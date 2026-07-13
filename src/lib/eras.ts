/*
 * MEHFIL — era configuration ("The Groove": the medium is the map).
 *
 * Era *palette* lives in src/styles/tokens.css as `[data-era="…"]` sets (single
 * source of truth, driven at runtime). This file holds the non-color era data —
 * medium, RPM mark, sound texture, and a sample seed track — so components read
 * era metadata as data, not hardcoded values. Seeds are lifted verbatim from
 * docs/concept/groove-concept.html (the eras[] array) and double as the Phase 0
 * multilingual type specimen. This is the seed of the Phase 4 morph state machine.
 */
import type { Script } from "@/lib/fonts";

export type EraId = "50s" | "60s" | "70s" | "80s" | "90s" | "00s" | "10s" | "20s";
export type Medium = "shellac" | "vinyl" | "cassette" | "cd" | "mp3" | "stream";

export interface SeedTrack {
  native: string;
  latin: string;
  who: string;
  script: Script;
}

export interface EraConfig {
  id: EraId;
  decade: string;
  medium: Medium;
  /** HUD pill text, e.g. "Shellac · 78". */
  mediumLabel: string;
  /** RPM / medium badge, e.g. "78 RPM", "TAPE", "1×". */
  rpm: string;
  /** Ambient sound bed character (Phase 3+ honors this). */
  soundTexture: string;
  /** Sample track for the boot specimen + future hero seed. */
  seed: SeedTrack;
}

export const ERAS: readonly EraConfig[] = [
  {
    id: "50s",
    decade: "1950s",
    medium: "shellac",
    mediumLabel: "Shellac · 78",
    rpm: "78 RPM",
    soundTexture: "heavy crackle",
    seed: {
      native: "लग जा गले",
      latin: "Lag Ja Gale",
      who: "Lata Mangeshkar · 1964",
      script: "devanagari",
    },
  },
  {
    id: "60s",
    decade: "1960s",
    medium: "vinyl",
    mediumLabel: "Vinyl · 33⅓",
    rpm: "33⅓ RPM",
    soundTexture: "soft surface noise",
    seed: {
      native: "তুমি যে আমার",
      latin: "Tumi Je Amar",
      who: "Hemanta Mukherjee · 1959",
      script: "bengali",
    },
  },
  {
    id: "70s",
    decade: "1970s",
    medium: "vinyl",
    mediumLabel: "Vinyl · 33⅓",
    rpm: "33⅓ RPM",
    soundTexture: "warm hiss",
    seed: {
      native: "मेहबूबा मेहबूबा",
      latin: "Mehbooba Mehbooba",
      who: "R.D. Burman · 1975",
      script: "devanagari",
    },
  },
  {
    id: "80s",
    decade: "1980s",
    medium: "cassette",
    mediumLabel: "Cassette",
    rpm: "TAPE",
    soundTexture: "tape hiss, mechanical clunk",
    seed: {
      native: "ਦਿਲ ਦਾ ਮਾਮਲਾ",
      latin: "Dil Da Mamla",
      who: "Gurdas Maan · 1981",
      script: "gurmukhi",
    },
  },
  {
    id: "90s",
    decade: "1990s",
    medium: "cd",
    mediumLabel: "Compact Disc",
    rpm: "1×",
    soundTexture: "clean, near-silent",
    seed: {
      native: "पहला नशा",
      latin: "Pehla Nasha",
      who: "Jatin–Lalit · 1992",
      script: "devanagari",
    },
  },
  {
    id: "00s",
    decade: "2000s",
    medium: "mp3",
    mediumLabel: "Digital · MP3",
    rpm: "320 kbps",
    soundTexture: "compressed, crisp",
    seed: {
      native: "कल हो ना हो",
      latin: "Kal Ho Naa Ho",
      who: "Sonu Nigam · 2003",
      script: "devanagari",
    },
  },
  {
    id: "10s",
    decade: "2010s",
    medium: "stream",
    mediumLabel: "Streaming",
    rpm: "∞",
    soundTexture: "lossless silence",
    seed: {
      native: "कबीरा",
      latin: "Kabira",
      who: "Pritam · 2013",
      script: "devanagari",
    },
  },
  {
    id: "20s",
    decade: "2020s",
    medium: "stream",
    mediumLabel: "Streaming · Now",
    rpm: "∞",
    soundTexture: "algorithmic hush",
    seed: {
      native: "केसरिया",
      latin: "Kesariya",
      who: "Arijit Singh · 2022",
      script: "devanagari",
    },
  },
] as const;

/** Default era for the Phase 0 boot screen (warm vinyl, mid-spine). */
export const DEFAULT_ERA: EraId = "60s";

export function getEra(id: EraId): EraConfig {
  const era = ERAS.find((e) => e.id === id);
  if (!era) throw new Error(`Unknown era: ${id}`);
  return era;
}
