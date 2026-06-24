/*
 * MEHFIL — DEV-ONLY demo tracks.
 *
 * The seed catalog's sourceIds are empty until a live ingest run, so
 * catalogRepository.playable() is currently empty. To exercise the player NOW,
 * this module overlays a few real, official, embeddable YouTube videoIds onto
 * existing seed Track ids — IN MEMORY ONLY. It never writes catalog.json and
 * never invents catalog sourceIds (that stays the resolver's job, Phase 2).
 *
 * If an id turns out non-embeddable/region-blocked, the provider emits "error"
 * and the store advances — swap the id here. Remove this module once a live
 * ingest fills real sourceIds and playable() is non-empty.
 */
import { catalogRepository, type Track } from "@/lib/catalog";

/** seed track id → a well-known official Vevo/label upload videoId. */
const DEMO_VIDEO_IDS: Record<string, string> = {
  "take-on-me-1985": "djV11Xbc914", // a-ha (official)
  "dancing-queen-1976": "xFrGuyw1V8s", // ABBA (official)
  "stayin-alive-1977": "I_izvAbhExY", // Bee Gees (official)
};

export function getDemoTracks(): Track[] {
  return Object.entries(DEMO_VIDEO_IDS).flatMap(([id, videoId]) => {
    const track = catalogRepository.getTrack(id);
    if (!track) return [];
    return [
      {
        ...track,
        sourceId: videoId,
        provenance: { ...track.provenance, embeddable: true },
      },
    ];
  });
}
