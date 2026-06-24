/*
 * MEHFIL — multilingual search engine (Phase 7, pure + dependency-free).
 *
 * The catalog already carries the romanization (`*.latin`), so we don't need a
 * transliteration engine: fold both the query and every searchable field the same
 * way, then match a romanized query against `*.latin` and a native query against
 * `*.native`. `fold` lowercases, drops *Latin* diacritics, and reduces punctuation
 * to spaces while PRESERVING Indic letters + their combining vowel signs — so one
 * folder serves Devanagari, Gurmukhi, Bengali, and Latin with no script detection.
 *
 * Matching is forgiving (substring → all-tokens → bounded fuzzy) and ranked so an
 * exact prefix beats a mid-string hit. Display is never gated here — non-playable
 * tracks are returned too; the UI gates only the play action.
 */
import type { Artist, Release, Track } from "@/lib/catalog";

export type SearchType = "track" | "album" | "artist";

export interface TrackResult {
  type: "track";
  id: string;
  score: number;
  track: Track;
}
export interface AlbumResult {
  type: "album";
  id: string;
  score: number;
  release: Release;
}
export interface ArtistResult {
  type: "artist";
  id: string;
  score: number;
  artist: Artist;
}

export interface GroupedResults {
  tracks: TrackResult[];
  albums: AlbumResult[];
  artists: ArtistResult[];
}

/** Normalize for matching: fold Latin accents, keep Indic, punctuation → spaces. */
export function fold(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop Latin combining diacritics (é → e); keeps Indic marks
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, " ") // punctuation/space → one space; keep Indic marks
    .trim();
}

export function tokenize(input: string): string[] {
  const f = fold(input);
  return f ? f.split(" ") : [];
}

/** Bounded Levenshtein: returns >max as soon as it's certain (cheap early-out). */
export function levenshtein(a: string, b: string, max: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  let prev = Array.from({ length: bl + 1 }, (_, i) => i);
  for (let i = 1; i <= al; i++) {
    const cur: number[] = [i];
    let rowMin = i;
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[bl]!;
}

function withinEdit(token: string, q: string): boolean {
  const max = q.length <= 4 ? 1 : 2;
  if (Math.abs(token.length - q.length) > max) return false;
  return levenshtein(token, q, max) <= max;
}

interface Field {
  folded: string;
  tokens: string[];
  weight: number;
}
interface Doc<T> {
  source: T;
  fields: Field[];
}
export interface SearchIndex {
  tracks: Doc<Track>[];
  albums: Doc<Release>[];
  artists: Doc<Artist>[];
}

function field(text: string | null | undefined, weight: number): Field | null {
  const folded = fold(text ?? "");
  if (!folded) return null;
  return { folded, tokens: folded.split(" "), weight };
}

function compact(fields: (Field | null)[]): Field[] {
  return fields.filter((f): f is Field => f !== null);
}

export function buildIndex(tracks: Track[], artists: Artist[], releases: Release[]): SearchIndex {
  const artistById = new Map(artists.map((a) => [a.id, a]));
  const artistNameFields = (ids: string[]): (Field | null)[] =>
    ids.flatMap((id) => {
      const a = artistById.get(id);
      if (!a) return [];
      return [field(a.name.latin, 0.7), field(a.name.native, 0.7)];
    });

  return {
    tracks: tracks.map((t) => ({
      source: t,
      fields: compact([
        field(t.title.latin, 1),
        field(t.title.native, 1),
        ...artistNameFields(t.artists),
        field(t.film, 0.6),
      ]),
    })),
    albums: releases.map((r) => ({
      source: r,
      fields: compact([field(r.film, 1), ...artistNameFields(r.artistIds)]),
    })),
    artists: artists.map((a) => ({
      source: a,
      fields: compact([field(a.name.latin, 1), field(a.name.native, 1)]),
    })),
  };
}

/* Tiers: exact > field-prefix > word-prefix > substring > all-tokens > fuzzy. */
function scoreField(f: Field, q: string, qTokens: string[]): number {
  let tier = 0;
  if (f.folded === q) tier = 1000;
  else if (f.folded.startsWith(q)) tier = 100;
  else if (f.tokens.some((t) => t.startsWith(q))) tier = 80;
  else if (f.folded.includes(q)) tier = 60;
  else if (qTokens.every((qt) => f.tokens.some((ft) => ft.includes(qt)))) tier = 40;
  else if (qTokens.every((qt) => f.tokens.some((ft) => withinEdit(ft, qt)))) tier = 20;
  return tier * f.weight;
}

function scoreDoc<T>(doc: Doc<T>, q: string, qTokens: string[]): number {
  let best = 0;
  for (const f of doc.fields) {
    const s = scoreField(f, q, qTokens);
    if (s > best) best = s;
  }
  return best;
}

function rank<T, R>(
  docs: Doc<T>[],
  q: string,
  qTokens: string[],
  limit: number,
  make: (source: T, score: number) => R,
): R[] {
  return docs
    .map((d) => ({ d, s: scoreDoc(d, q, qTokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => make(x.d.source, x.s));
}

export function searchCatalog(
  index: SearchIndex,
  query: string,
  perGroupLimit = 8,
): GroupedResults {
  const q = fold(query);
  if (!q) return { tracks: [], albums: [], artists: [] };
  const qTokens = q.split(" ");

  return {
    tracks: rank(index.tracks, q, qTokens, perGroupLimit, (track, score) => ({
      type: "track" as const,
      id: track.id,
      score,
      track,
    })),
    albums: rank(index.albums, q, qTokens, perGroupLimit, (release, score) => ({
      type: "album" as const,
      id: release.id,
      score,
      release,
    })),
    artists: rank(index.artists, q, qTokens, perGroupLimit, (artist, score) => ({
      type: "artist" as const,
      id: artist.id,
      score,
      artist,
    })),
  };
}

export function totalCount(r: GroupedResults): number {
  return r.tracks.length + r.albums.length + r.artists.length;
}
