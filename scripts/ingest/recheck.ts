/*
 * MEHFIL ingestion — availability re-check (brief §6c step 10, Phase 17).
 *
 * Videos die: uploads get deleted, privated, or de-embedded. This pass re-fetches
 * the status of every RESOLVED track and cleans the catalog:
 *   · curated seeds  → resolver fields are REVERTED (sourceId "", cover "",
 *     durationSec null, provenance channelId ""/embeddable null) so a future
 *     ingest can re-resolve them against a healthy upload;
 *   · discoveries    → REMOVED outright (they only ever existed as that upload).
 * A video missing from the videos.list response IS the dead signal (the API
 * omits deleted ids). Pure and immutable, mirroring the merge contract.
 */
import type { CatalogData, Track } from "@/lib/catalog/types";
import type { RawVideo, RecheckDiff } from "./types";

function isHealthy(raw: RawVideo | undefined): boolean {
  return Boolean(raw && raw.embeddable && raw.privacyStatus === "public");
}

/** Curated seeds carry artist ids; discoveries are appended with artists: []. */
function isCuratedSeed(track: Track): boolean {
  return track.artists.length > 0;
}

function revertResolverFields(track: Track): Track {
  return {
    ...track,
    durationSec: null,
    cover: "",
    sourceId: "",
    provenance: { ...track.provenance, channelId: "", embeddable: null },
  };
}

export function applyRecheck(
  base: CatalogData,
  alive: ReadonlyMap<string, RawVideo>,
): { next: CatalogData; diff: RecheckDiff } {
  const revertedSeedIds: string[] = [];
  const removedDiscoveryIds: string[] = [];
  let checked = 0;
  let healthy = 0;

  const tracks: Track[] = [];
  for (const t of base.tracks) {
    if (t.sourceId === "") {
      tracks.push(t); // unresolved — nothing to check
      continue;
    }
    checked += 1;
    if (isHealthy(alive.get(t.sourceId))) {
      healthy += 1;
      tracks.push(t);
      continue;
    }
    if (isCuratedSeed(t)) {
      revertedSeedIds.push(t.id);
      tracks.push(revertResolverFields(t));
    } else {
      removedDiscoveryIds.push(t.id);
    }
  }

  return {
    next: { ...base, tracks },
    diff: { checked, healthy, revertedSeedIds, removedDiscoveryIds },
  };
}

/** Every resolved sourceId, batched for videos.list (≤50 ids per unit). */
export function resolvedIdBatches(base: CatalogData, batchSize = 50): string[][] {
  const ids = [...new Set(base.tracks.map((t) => t.sourceId).filter((s) => s !== ""))];
  const batches: string[][] = [];
  for (let i = 0; i < ids.length; i += batchSize) batches.push(ids.slice(i, i + batchSize));
  return batches;
}
