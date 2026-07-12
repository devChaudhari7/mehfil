/*
 * MEHFIL ingestion — availability re-check CLI (Phase 17).
 *
 *   npm run recheck          # live if YOUTUBE_API_KEY is set, else refuses
 *   npm run recheck -- --dry-run   # report only, never writes
 *
 * ~1 quota unit per 50 resolved tracks. Dead uploads: seeds revert (re-resolvable
 * by the next ingest), discoveries are removed. Writes through the same
 * serializer + shape guard as the ingest.
 */
import { promises as fs } from "node:fs";
import { assertCatalogShape } from "@/lib/catalog/types";
import { LiveYouTubeClient } from "./client";
import { applyRecheck, resolvedIdBatches } from "./recheck";
import { serializeCatalog } from "./serialize";
import { CATALOG_PATH, loadEnvLocal, readCatalog } from "./shared";
import type { RawVideo } from "./types";

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  await loadEnvLocal();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("recheck needs YOUTUBE_API_KEY (there is no offline mode for status checks)");
    process.exitCode = 1;
    return;
  }

  const client = new LiveYouTubeClient(apiKey);
  const base = await readCatalog();
  const alive = new Map<string, RawVideo>();
  for (const batch of resolvedIdBatches(base)) {
    for (const v of await client.listVideos(batch)) alive.set(v.videoId, v);
  }

  const { next, diff } = applyRecheck(base, alive);
  assertCatalogShape(next);
  if (!dryRun) await fs.writeFile(CATALOG_PATH, serializeCatalog(next), "utf8");

  console.log(
    [
      "",
      `MEHFIL recheck${dryRun ? " (dry-run — catalog untouched)" : ""}`,
      `  resolved checked  : ${diff.checked}`,
      `  healthy           : ${diff.healthy}`,
      `  seeds reverted    : ${diff.revertedSeedIds.length}${
        diff.revertedSeedIds.length ? `  (${diff.revertedSeedIds.join(", ")})` : ""
      }`,
      `  discoveries removed: ${diff.removedDiscoveryIds.length}`,
      `  quota units spent : ${client.units}`,
      `  catalog tracks    : ${base.tracks.length} → ${next.tracks.length}`,
      "",
    ].join("\n"),
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
