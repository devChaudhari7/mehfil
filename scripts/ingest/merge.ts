/*
 * MEHFIL ingestion — the merge contract (catalog.json `_meta`, brief §6.5–6.8).
 *
 * Pure and immutable: returns a NEW CatalogData, never mutating `base`, so the
 * dry-run can compute a result without side effects and tests can assert the
 * seed is untouched.
 *
 * Two operations:
 *  1. resolveSeed   — fill ONLY the resolver fields (sourceId, cover, durationSec,
 *                     provenance.channelId, provenance.embeddable) on seed tracks
 *                     that aren't resolved yet, matching by normalized
 *                     song+artist key. Curated fields are never touched; if no
 *                     confident candidate matches, the track is left empty
 *                     (we never invent a sourceId).
 *  2. appendDiscoveries — add candidates that match no seed as new tracks with
 *                     stable slug ids, deduped, never clobbering an existing id.
 */
import type { Artist, CatalogData, Language, Track } from "@/lib/catalog/types";
import { dedupeKey, eraFromYear, normalize, scriptOf, slugify } from "./parse";
import type { Candidate, MergeDiff } from "./types";

/** Native script → language, for classifying discoveries from "multi" channels. */
const SCRIPT_LANGUAGE: Record<string, Language | null> = {
  devanagari: "hindi",
  gurmukhi: "punjabi",
  bengali: "bengali",
  latin: null, // a Latin title on a multi channel stays unclassifiable
};

function primaryArtistLatin(track: Track, artistsById: Map<string, Artist>): string {
  const id = track.artists[0];
  return (id ? artistsById.get(id)?.name.latin : undefined) ?? "";
}

export function seedKey(track: Track, artistsById: Map<string, Artist>): string {
  return dedupeKey(track.title.latin, primaryArtistLatin(track, artistsById));
}

export function candidateKey(c: Candidate): string {
  return dedupeKey(c.parsed.song, c.parsed.artist);
}

/** Curated label hint vs. source label: match if either contains the other. */
function labelMatches(sourceLabel: string, preferLabel: string): boolean {
  const a = normalize(sourceLabel);
  const b = normalize(preferLabel);
  if (!a || !b) return false;
  return a.includes(b) || b.includes(a);
}

/** Best candidate: prefer the curated label, then a trusted channel, then views. */
function pickBest(group: Candidate[], preferLabel: string | undefined): Candidate {
  const sorted = [...group].sort((a, b) => {
    const la = preferLabel && labelMatches(a.sourceLabel, preferLabel) ? 1 : 0;
    const lb = preferLabel && labelMatches(b.sourceLabel, preferLabel) ? 1 : 0;
    if (la !== lb) return lb - la;
    if (a.trusted !== b.trusted) return Number(b.trusted) - Number(a.trusted);
    return b.viewCount - a.viewCount;
  });
  // group is always non-empty where this is called
  return sorted[0] as Candidate;
}

function uniqueId(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}

function buildDiscoveryTrack(
  id: string,
  best: Candidate,
  year: number,
  era: Track["era"],
  language: Language,
): Track {
  return {
    id,
    title: { native: best.parsed.song, latin: best.parsed.song },
    script: scriptOf(best.parsed.song),
    artists: [],
    film: best.parsed.film ?? null,
    albumId: null,
    year,
    era,
    language,
    region: best.sourceRegion,
    durationSec: best.durationSec,
    moods: [],
    genres: [],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "day",
    cover: best.thumbnail,
    source: "youtube",
    sourceId: best.videoId,
    provenance: {
      channelId: best.channelId,
      label: best.sourceLabel,
      embeddable: best.embeddable,
    },
  };
}

export function mergeCatalog(
  base: CatalogData,
  candidates: Candidate[],
): { next: CatalogData; diff: MergeDiff } {
  const artistsById = new Map(base.artists.map((a) => [a.id, a]));

  // Index every seed by its key (resolved or not) so discoveries never duplicate one.
  const seedKeys = new Set<string>();
  for (const t of base.tracks) seedKeys.add(seedKey(t, artistsById));

  // Group candidates by key (must have both song and artist to be matchable).
  const byKey = new Map<string, Candidate[]>();
  for (const c of candidates) {
    const k = candidateKey(c);
    if (k === "|" || k.startsWith("|") || k.endsWith("|")) continue;
    const list = byKey.get(k);
    if (list) list.push(c);
    else byKey.set(k, [c]);
  }

  // --- 1. resolveSeed (in place; only resolver fields) ---
  const usedKeys = new Set<string>();
  const resolvedIds: string[] = [];
  const unmatchedSeedIds: string[] = [];

  const nextTracks: Track[] = base.tracks.map((t) => {
    if (t.sourceId !== "") return t; // already resolved — never re-touch
    const k = seedKey(t, artistsById);
    const group = byKey.get(k);
    if (!group || group.length === 0) {
      unmatchedSeedIds.push(t.id);
      return t;
    }
    const best = pickBest(group, t.provenance.label);
    usedKeys.add(k);
    resolvedIds.push(t.id);
    return {
      ...t,
      durationSec: best.durationSec,
      cover: best.thumbnail,
      sourceId: best.videoId,
      provenance: {
        ...t.provenance,
        channelId: best.channelId,
        embeddable: best.embeddable,
      },
    };
  });

  // --- 2. appendDiscoveries ---
  const existingIds = new Set(base.tracks.map((t) => t.id));
  // Re-run idempotence (17.1): a video already in the catalog must never append
  // again. Discoveries carry no artists, so their seedKey is `song|` while the
  // re-parsed candidate keys as `song|artist` — the key guard alone misses them
  // and uniqueId would mint `…-2` duplicates every scheduled run. Two backstops:
  //   a) videoId identity — the same upload is by definition already here;
  //   b) song-only key for artist-less tracks — a different upload of the same
  //      discovered song is still the same song.
  const existingVideoIds = new Set(
    base.tracks.map((t) => t.sourceId).filter((sid) => sid !== ""),
  );
  const songOnlyKeys = new Set(
    base.tracks.filter((t) => t.artists.length === 0).map((t) => normalize(t.title.latin)),
  );
  const appended: Track[] = [];
  const appendedIds: string[] = [];
  let skipped = 0;

  for (const [k, group] of byKey) {
    if (usedKeys.has(k)) continue; // consumed by a seed
    if (seedKeys.has(k)) {
      skipped += 1; // matches a seed we couldn't resolve — don't duplicate it
      continue;
    }
    const best = pickBest(group, undefined);
    if (existingVideoIds.has(best.videoId) || songOnlyKeys.has(normalize(best.parsed.song))) {
      skipped += 1; // already in the catalog from a previous run
      continue;
    }
    // "multi" channels (Saregama & co.) title much of the vault in native script —
    // infer the language from the writing system; Latin-titled multi stays skipped.
    const language: Language | null =
      best.sourceLanguage === "multi"
        ? (SCRIPT_LANGUAGE[scriptOf(best.parsed.song)] ?? null)
        : best.sourceLanguage;
    if (language === null) {
      skipped += 1;
      continue;
    }
    const year = best.parsed.year;
    const era = year !== undefined ? eraFromYear(year) : null;
    if (year === undefined || era === null) {
      skipped += 1; // need an in-scope year to assign an era
      continue;
    }
    const slug = slugify(`${best.parsed.song}-${year}`) || `yt-${best.videoId.toLowerCase()}`;
    const id = uniqueId(slug, existingIds);
    existingIds.add(id);
    existingVideoIds.add(best.videoId); // same-run duplicates under different keys
    songOnlyKeys.add(normalize(best.parsed.song));
    appendedIds.push(id);
    appended.push(buildDiscoveryTrack(id, best, year, era, language));
  }

  const next: CatalogData = { ...base, tracks: [...nextTracks, ...appended] };
  return { next, diff: { resolvedIds, appendedIds, unmatchedSeedIds, skipped } };
}
