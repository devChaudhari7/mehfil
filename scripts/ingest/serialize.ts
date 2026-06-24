/*
 * MEHFIL ingestion — deterministic catalog.json serializer.
 *
 * Reproduces the hand-authored seed style so live-run diffs stay reviewable:
 * one compact, space-padded line per artist/track (explicit, stable field
 * order), blank lines between sections. `_meta` is emitted pretty (2-space) and
 * is never modified by ingestion, so it round-trips unchanged in practice.
 */
import type { Album, Artist, CatalogData, Track } from "@/lib/catalog/types";

/** Compact but space-padded value: `{ "k": v, ... }` / `[a, b]` — matches the seed. */
function val(v: unknown): string {
  if (v === null) return "null";
  if (Array.isArray(v)) return `[${v.map(val).join(", ")}]`;
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).map(
      ([k, vv]) => `${JSON.stringify(k)}: ${val(vv)}`,
    );
    return `{ ${entries.join(", ")} }`;
  }
  return JSON.stringify(v);
}

function serializeArtist(a: Artist): string {
  return val({
    id: a.id,
    name: a.name,
    language: a.language,
    region: a.region,
    era: a.era,
    bio: a.bio,
  });
}

function serializeAlbum(a: Album): string {
  return val({
    id: a.id,
    title: a.title,
    artistId: a.artistId,
    year: a.year,
    cover: a.cover,
    trackIds: a.trackIds,
  });
}

function serializeTrack(t: Track): string {
  return val({
    id: t.id,
    title: t.title,
    script: t.script,
    artists: t.artists,
    film: t.film,
    albumId: t.albumId,
    year: t.year,
    era: t.era,
    language: t.language,
    region: t.region,
    durationSec: t.durationSec,
    moods: t.moods,
    genres: t.genres,
    raga: t.raga,
    tempoBucket: t.tempoBucket,
    timeOfDay: t.timeOfDay,
    cover: t.cover,
    source: t.source,
    sourceId: t.sourceId,
    provenance: {
      channelId: t.provenance.channelId,
      label: t.provenance.label,
      embeddable: t.provenance.embeddable,
    },
  });
}

function arrayBlock(name: string, lines: string[]): string {
  if (lines.length === 0) return `  "${name}": []`;
  return `  "${name}": [\n${lines.map((l) => `    ${l}`).join(",\n")}\n  ]`;
}

function indent(block: string, pad: string): string {
  return block
    .split("\n")
    .map((line, i) => (i === 0 ? line : pad + line))
    .join("\n");
}

export function serializeCatalog(data: CatalogData): string {
  const meta = indent(JSON.stringify(data._meta, null, 2), "  ");
  const artists = arrayBlock("artists", data.artists.map(serializeArtist));
  const albums = arrayBlock("albums", data.albums.map(serializeAlbum));
  const tracks = arrayBlock("tracks", data.tracks.map(serializeTrack));
  return `{\n  "_meta": ${meta},\n\n${artists},\n\n${albums},\n\n${tracks}\n}\n`;
}
