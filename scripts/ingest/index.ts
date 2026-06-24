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
import { assertCatalogShape, type CatalogData } from "@/lib/catalog/types";
import { LiveYouTubeClient } from "./client";
import { FixtureYouTubeClient } from "./fixtures/client";
import { keepVideo } from "./filter";
import { loadCheckpoint, ptDate, saveCheckpoint } from "./checkpoint";
import { mergeCatalog } from "./merge";
import { parseTitle } from "./parse";
import { serializeCatalog } from "./serialize";
import { SOURCES, type CatalogSource } from "./sources";
import type { Candidate, Checkpoint, YouTubeClient } from "./types";

const ROOT = process.cwd();
const CATALOG_PATH = path.join(ROOT, "src", "data", "catalog.json");
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

async function readCatalog(): Promise<CatalogData> {
  const data: unknown = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  assertCatalogShape(data);
  return data;
}

/**
 * Minimal, dependency-free .env.local loader (KEY=VALUE per line). Keeps the
 * npm scripts plain `tsx` (no reliance on Node's --env-file flag) while still
 * giving the live run a place to put YOUTUBE_API_KEY. Absent file ⇒ dry-run.
 */
async function loadEnvLocal(): Promise<void> {
  if (process.env.YOUTUBE_API_KEY) return;
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const key = m[1] as string;
      let value = m[2] as string;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* no .env.local — fall through to dry-run */
  }
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
    if (src.kind === "channel" && !src.id) {
      console.warn(`- skip ${src.label}: channelId unresolved (handle ${src.handle})`);
      continue;
    }

    const playlistId =
      src.kind === "channel" ? await client.getUploadsPlaylist(src.id) : src.id;
    if (!playlistId) {
      console.warn(`- skip ${src.label}: no uploads playlist`);
      continue;
    }
    sourcesProcessed += 1;

    const videoIds: string[] = [];
    let pageToken = checkpoint?.perSource[src.id]?.pageToken;
    do {
      const page = await client.listPlaylistItems(playlistId, pageToken);
      videoIds.push(...page.videoIds);
      pageToken = page.nextPageToken;
    } while (pageToken && videoIds.length < args.limit && client.units < args.maxUnits);
    perSourceTokens[src.id] = pageToken; // undefined ⇒ source exhausted

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
