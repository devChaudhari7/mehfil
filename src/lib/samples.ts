import type { Script } from "@/lib/fonts";
import type { EraId } from "@/lib/eras";

/*
 * MOCK sample data for showcasing primitives (NativeText / Card / Sleeve) in the
 * styleguide. The real, typed catalog arrives in Phase 2 via CatalogRepository —
 * this is throwaway. Covers all four scripts.
 */
export interface SampleTrack {
  native: string;
  latin: string;
  artist: string;
  script: Script;
  era: EraId;
}

const LAG_JA_GALE: SampleTrack = {
  native: "लग जा गले",
  latin: "Lag Ja Gale",
  artist: "Lata Mangeshkar",
  script: "devanagari",
  era: "60s",
};
const TUMI_JE_AMAR: SampleTrack = {
  native: "তুমি যে আমার",
  latin: "Tumi Je Amar",
  artist: "Hemanta Mukherjee",
  script: "bengali",
  era: "60s",
};
const DIL_DA_MAMLA: SampleTrack = {
  native: "ਦਿਲ ਦਾ ਮਾਮਲਾ",
  latin: "Dil Da Mamla",
  artist: "Gurdas Maan",
  script: "gurmukhi",
  era: "80s",
};
const HOTEL_CALIFORNIA: SampleTrack = {
  native: "Hotel California",
  latin: "Hotel California",
  artist: "Eagles",
  script: "latin",
  era: "70s",
};
const PEHLA_NASHA: SampleTrack = {
  native: "पहला नशा",
  latin: "Pehla Nasha",
  artist: "Jatin–Lalit",
  script: "devanagari",
  era: "90s",
};

export const SAMPLE_TRACKS: readonly SampleTrack[] = [
  LAG_JA_GALE,
  TUMI_JE_AMAR,
  DIL_DA_MAMLA,
  HOTEL_CALIFORNIA,
  PEHLA_NASHA,
];

/** One representative track per script, for the four-script type specimen. */
export const ONE_PER_SCRIPT: Record<Script, SampleTrack> = {
  devanagari: LAG_JA_GALE,
  bengali: TUMI_JE_AMAR,
  gurmukhi: DIL_DA_MAMLA,
  latin: HOTEL_CALIFORNIA,
};
