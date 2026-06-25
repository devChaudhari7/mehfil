"use client";

/*
 * CatalogPlayButton — the play control for the /catalog list. Looks the track up
 * client-side (the catalog is already in the client bundle) so the full track
 * array isn't serialized per row, then defers to the shared gated PlayControl: any
 * track with a real, embeddable sourceId (now 175 after the live ingest, plus the
 * dev demo overlay) gets a Play button; the rest stay disabled. Queue = the whole
 * catalog so next/prev flows through the playable tracks.
 */
import { catalogRepository } from "@/lib/catalog";
import { PlayControl } from "@/components/browse/PlayControl";

export function CatalogPlayButton({ trackId }: { trackId: string }) {
  const track = catalogRepository.getTrack(trackId);
  if (!track) return null;
  return <PlayControl track={track} queue={catalogRepository.allTracks()} variant="pill" />;
}
