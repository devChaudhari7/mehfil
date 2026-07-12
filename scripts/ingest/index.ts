/*
 * MEHFIL ingestion — CLI runner (brief §6c, Phase 2 "single command").
 *
 *   npm run ingest         # live if YOUTUBE_API_KEY is set, else auto dry-run
 *   npm run ingest:dry     # force the offline fixture run
 *
 * Flags: --dry-run  --source=<label|id>  --limit=<n>  --max-units=<n>
 *
 * Pipeline: source → uploads playlist → playlistItems (enumerate) → batched
 * videos.list (enrich) → filter → parse → merge. Dry-run writes ONLY to
 * scripts/ingest/.out/ and never touches src/data/catalog.json; the live writer
 * refuses to persist any FIXTURE_ id as a final guard.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { assertCatalogShape } from "@/lib/catalog/types";
import { LiveYouTubeClient } from "./client";
import { FixtureYouTubeClient } from "./fixtures/client";
import { keepVideo } from "./filter";
import { loadCheckpoint, ptDate, saveCheckpoint } from "./checkpoint";
import { mergeCatalog } from "./merge";
import { parseTitle } from "./parse";
import { serializeCatalog } from "./serialize";
import { CATALOG_PATH, ROOT, loadEnvLocal, readCatalog } from "./shared";
import { SOURCES, type CatalogSource } from "./sources";
import type { Candidate, Checkpoint, YouTubeClient } from "./types";

const OUT_DIR = path.join(ROOT, "scripts", "ingest", ".out");
const OUT_PATH = path.join(OUT_DIR, "catalog.dry-run.json");

interface Args {
  dryRun: boolean;
  source?: string;
  limit: number;
  maxUnits: number;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { dryRun: false, limit: 200, maxUnits: 9000 };
  for (const token of argv) {
    const [key, value] = token.includes("=") ? token.split("=", 2) : [token, undefined];
    if (key === "--dry-run") args.dryRun = true;
    else if (key === "--source" && value) args.source = value;
    else if (key === "--limit" && value) args.limit = Number(value);
    else if (key === "--max-units" && value) args.maxUnits = Number(value);
  }
  return args;
}

interface Collected {
  candidates: Candidate[];
  sourcesProcessed: number;
  filtered: number;
  perSourceTokens: Record<string, string | undefined>;
}

async function collectCandidates(
  client: YouTubeClient,
  sources: CatalogSource[],
  args: Args,
  checkpoint: Checkpoint | null,
): Promise<Collected> {
  const candidates: Candidate[] = [];
  const perSourceTokens: Record<string, string | undefined> = {};
  let sourcesProcessed = 0;
  let filtered = 0;

  for (const src of sources) {
    if (client.units >= args.maxUnits) {
      console.warn(`! quota guard hit (${client.units}/${args.maxUnits} units) — stopping`);
      break;
    }

    // One broken source (bad handle, deleted channel, 404 playlist) must not kill
    // the whole 19-source run — warn and continue. Quota exhaustion still aborts.
    try {
      // Handle-only entries resolve their channelId at run time (1 unit, once —
      // the result is cached in the committed checkpoint's `handles` map).
      let sourceId = src.id;
      if (src.kind === "channel" && !sourceId && src.handle) {
        sourceId = checkpoint?.handles?.[src.handle] ?? "";
        if (!sourceId) {
          sourceId = (await client.resolveHandle(src.handle)) ?? "";
          if (sourceId && checkpoint) {
            checkpoint.handles = { ...(checkpoint.handles ?? {}), [src.handle]: sourceId };
          }
        }
      }
      if (src.kind === "channel" && !sourceId) {
        console.warn(`- skip ${src.label}: channelId unresolved (handle ${src.handle})`);
        continue;
      }
      if (src.kind === "playlist") sourceId = src.id;

      const playlistId =
        src.kind === "channel" ? await client.getUploadsPlaylist(sourceId) : sourceId;
      if (!playlistId) {
        console.warn(`- skip ${src.label}: no uploads playlist`);
        continue;
      }
      sourcesProcessed += 1;

      const videoIds: string[] = [];
      let pageToken = checkpoint?.perSource[sourceId]?.pageToken;
      do {
        const page = await client.listPlaylistItems(playlistId, pageToken);
        videoIds.push(...page.videoIds);
        pageToken = page.nextPageToken;
      } while (pageToken && videoIds.length < args.limit && client.units < args.maxUnits);
      perSourceTokens[sourceId] = pageToken; // undefined ⇒ source exhausted

      const ids = videoIds.slice(0, args.limit);
      for (let i = 0; i < ids.length && client.units < args.maxUnits; i += 50) {
        const videos = await client.listVideos(ids.slice(i, i + 50));
        for (const v of videos) {
          if (!keepVideo(v)) {
            filtered += 1;
            continue;
          }
          candidates.push({
            ...v,
            parsed: parseTitle(v.title),
            sourceLabel: src.label,
            sourceLanguage: src.language,
            sourceRegion: src.region,
            trusted: src.trusted,
          });
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/quota/i.test(msg) || msg.includes(" 403")) throw err; // quota → abort the run
      console.warn(`- skip ${src.label}: ${msg.slice(0, 160)}`);
    }
  }

  return { candidates, sourcesProcessed, filtered, perSourceTokens };
}

function selectSources(filter: string | undefined): CatalogSource[] {
  if (!filter) return SOURCES;
  const needle = filter.toLowerCase();
  return SOURCES.filter(
    (s) => s.id === filter || s.label.toLowerCase().includes(needle),
  );
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  await loadEnvLocal();
  const apiKey = process.env.YOUTUBE_API_KEY;
  const dryRun = args.dryRun || !apiKey;
  const client: YouTubeClient = dryRun
    ? new FixtureYouTubeClient()
    : new LiveYouTubeClient(apiKey as string);

  const sources = selectSources(args.source);
  const base = await readCatalog();
  const checkpoint = dryRun ? null : await loadCheckpoint();

  const { candidates, sourcesProcessed, filtered, perSourceTokens } =
    await collectCandidates(client, sources, args, checkpoint);
  const { next, diff } = mergeCatalog(base, candidates);
  assertCatalogShape(next);
  const serialized = serializeCatalog(next);

  let outputPath: string;
  if (dryRun) {
    await fs.mkdir(OUT_DIR, { recursive: true });
    await fs.writeFile(OUT_PATH, serialized, "utf8");
    outputPath = path.relative(ROOT, OUT_PATH);
  } else {
    if (next.tracks.some((t) => t.sourceId.startsWith("FIXTURE_"))) {
      throw new Error("refusing to write: a FIXTURE_ id reached the live catalog");
    }
    await fs.writeFile(CATALOG_PATH, serialized, "utf8");
    if (checkpoint) {
      const perSource = { ...checkpoint.perSource };
      const stamp = new Date().toISOString();
      for (const [id, token] of Object.entries(perSourceTokens)) {
        perSource[id] = { ...(token ? { pageToken: token } : {}), lastRun: stamp };
      }
      await saveCheckpoint({
        quotaDate: ptDate(),
        unitsSpent: checkpoint.unitsSpent + client.units,
        perSource,
        ...(checkpoint.handles ? { handles: checkpoint.handles } : {}),
      });
    }
    outputPath = path.relative(ROOT, CATALOG_PATH);
  }

  const lines = [
    "",
    `MEHFIL ingest — mode: ${client.mode}${dryRun ? " (dry-run)" : ""}`,
    `  sources processed : ${sourcesProcessed}`,
    `  candidates kept   : ${candidates.length}   (filtered out: ${filtered})`,
    `  seeds resolved    : ${diff.resolvedIds.length}   (unmatched seeds: ${diff.unmatchedSeedIds.length})`,
    `  discoveries added : ${diff.appendedIds.length}   (skipped: ${diff.skipped})`,
    `  quota units spent : ${client.units}`,
    `  catalog tracks    : ${base.tracks.length} → ${next.tracks.length}`,
    `  output            : ${outputPath}${dryRun ? "  (src/data/catalog.json untouched)" : ""}`,
    "",
  ];
  console.log(lines.join("\n"));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
