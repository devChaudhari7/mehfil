/*
 * MEHFIL ingestion — title parsing + normalization (brief §6.5/§6.6).
 *
 * YouTube titles look like "Lag Ja Gale | Woh Kaun Thi (1964) | Lata Mangeshkar".
 * We split into song / film / year / artist, with a manual-override map for the
 * messy cases, then derive normalized keys for dedupe and stable slug ids.
 * All keys are ASCII-folded: official uploads are romanized, so matching the
 * curated `title.latin` is reliable; native-script fields aren't used for keys.
 */
import { ERA_DECADES, type EraDecade } from "@/lib/catalog/types";

export interface ParsedTitle {
  song: string;
  film?: string;
  year?: number;
  artist?: string;
}

const YEAR_RE = /\b(19\d{2}|20\d{2})\b/;
/** Unicode combining-mark range, stripped after NFD normalization. */
const COMBINING_MARKS = /[̀-ͯ]/g;

/** Hand overrides for titles the heuristic parser gets wrong. Keyed by exact raw title. */
export const TITLE_OVERRIDES: Record<string, ParsedTitle> = {
  // Example shape — extend as real messy titles surface during live runs:
  // "Lag Ja Gale - Lata - HD": { song: "Lag Ja Gale", artist: "Lata Mangeshkar", year: 1964 },
};

/** Drop trailing decorations like "(Full Song)", "[HD]", "| 4K". */
function stripBrackets(s: string): string {
  return s
    .replace(/[([][^)\]]*[)\]]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTitle(
  raw: string,
  overrides: Record<string, ParsedTitle> = TITLE_OVERRIDES,
): ParsedTitle {
  const trimmed = raw.trim();
  const override = overrides[trimmed];
  if (override) return override;

  let segments = trimmed
    .split("|")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 1) {
    segments = trimmed
      .split(/\s+[-–]\s+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const song = stripBrackets(segments[0] ?? trimmed) || trimmed;
  let film: string | undefined;
  let year: number | undefined;
  let artist: string | undefined;

  for (const seg of segments.slice(1)) {
    const ym = seg.match(YEAR_RE);
    if (ym && year === undefined) {
      year = Number(ym[1]);
      const filmPart = stripBrackets(seg.replace(YEAR_RE, ""));
      if (filmPart) film = filmPart;
      continue;
    }
    if (artist === undefined) {
      const a = stripBrackets(seg);
      if (a) artist = a;
    }
  }

  return {
    song,
    ...(film ? { film } : {}),
    ...(year !== undefined ? { year } : {}),
    ...(artist ? { artist } : {}),
  };
}

/**
 * Fold for matching: strip diacritics, lowercase, drop punctuation/whitespace —
 * KEEPING letters of every script (Phase 19: Saregama-style channels title many
 * uploads in Devanagari/Gurmukhi/Bengali; ASCII-only folding erased those to ""
 * and silently dropped them before the merge).
 */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

/** Detect the writing system of a title (drives language inference + rendering). */
export function scriptOf(text: string): "devanagari" | "gurmukhi" | "bengali" | "latin" {
  if (/[ऀ-ॿ]/.test(text)) return "devanagari";
  if (/[਀-੿]/.test(text)) return "gurmukhi";
  if (/[ঀ-৿]/.test(text)) return "bengali";
  return "latin";
}

/** Dedupe / match key = normalized song + primary artist. */
export function dedupeKey(song: string, artist: string | undefined): string {
  return `${normalize(song)}|${normalize(artist ?? "")}`;
}

/** URL/id-safe slug, e.g. "Aaja Re Pardesi" → "aaja-re-pardesi". */
export function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Map a release year to its catalog decade, or null if outside 1950s–1990s scope. */
export function eraFromYear(year: number): EraDecade | null {
  if (!Number.isFinite(year)) return null;
  const decade = Math.floor(year / 10) * 10;
  const label = `${decade}s`;
  return (ERA_DECADES as readonly string[]).includes(label) ? (label as EraDecade) : null;
}
