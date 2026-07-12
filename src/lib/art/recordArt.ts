/*
 * MEHFIL — generative record-sleeve spec (Phase 9, pure/testable).
 *
 * `buildArtSpec` turns a record's stable identity + era into a fully-resolved,
 * deterministic drawing spec; the RecordArt component just renders it (no
 * randomness at render). "The medium is the map" onto the catalog: each era has
 * ONE motif family, and the seed shuffles which era token paints which shape,
 * varies the motif params + title layout, and stamps a catalog number — so a
 * one-era grid reads as a varied, curated wall, not identical squares.
 *
 * COLOR: we never duplicate hex values. The spec stores CSS-var *roles*
 * (`var(--accent)` …) drawn from the tokens that are defined in EVERY
 * `[data-era]` block (tokens.css); the component sets `data-era` to the record's
 * own era so they resolve to that era's palette. The title plate uses only
 * pairs verified AA across all five eras (`--btn`/`--btn-ink`, or the dark field
 * `--s1/--s2` with light `--ink`).
 */
import type { EraId } from "@/lib/eras";
import { int, makeRng, pick, range, shuffle } from "./rng";

export type MotifFamily = "deco" | "modern" | "psych" | "neon" | "chrome" | "pixel" | "wave";
export type TitlePos = "top" | "center" | "bottom";

/** A title plate: a fill + its AA-paired ink (both era CSS-var roles). */
export interface Plate {
  fill: string;
  ink: string;
  /** True when `fill` is a light accent (corner marks then use dark ink). */
  light: boolean;
}

export interface ArtRoles {
  /** Background field (a dark `--s1`/`--s2` stop). */
  field: string;
  field2: string;
  /** Primary + secondary motif colors and a highlight (era accents/glow). */
  motif: string;
  motifAlt: string;
  highlight: string;
}

export interface ArtParams {
  rings: number; // deco: concentric shellac grooves
  frameSteps: number; // deco: stepped art-deco frame
  splitAngle: number; // modern: split-field tilt (deg)
  sunR: number; // modern: sun/disc radius (fraction)
  rays: number; // psych: sunburst ray count
  waveAmp: number; // psych: wave amplitude (fraction)
  wavePhase: number; // psych: wave phase (rad)
  gridLines: number; // neon: perspective grid columns
  chevrons: number; // neon: chevron count
  arcs: number; // chrome: concentric arc count
  rotate: number; // global motif rotation (deg)
  originX: number; // motif origin (0..1)
  originY: number;
}

export interface ArtSpec {
  family: MotifFamily;
  roles: ArtRoles;
  plate: Plate;
  titlePos: TitlePos;
  catalogNo: string;
  params: ArtParams;
}

export interface ArtInput {
  /** Stable seed (e.g. `${id}|${film ?? latin}|${year}`). */
  seedKey: string;
  eraId: EraId;
  year: number;
}

const FAMILY: Record<EraId, MotifFamily> = {
  "50s": "deco",
  "60s": "modern",
  "70s": "psych",
  "80s": "neon",
  "90s": "chrome",
  "00s": "pixel", // digital-age: rounded pixel grid + gradient dots
  "10s": "wave", // streaming-age: waveform bars over a gradient field
};

/** Dark field stops — present in every [data-era] block. */
const FIELD = ["var(--s1)", "var(--s2)"] as const;
/** Motif color pool — accent/accent2/glow are set per era (never empty). */
const MOTIF = ["var(--accent)", "var(--accent2)", "var(--glow)"] as const;
/** Title plates verified AA across ALL eras (see tokens.css contrast notes). */
const PLATES: readonly Plate[] = [
  { fill: "var(--btn)", ink: "var(--btn-ink)", light: true },
  { fill: "var(--s1)", ink: "var(--ink)", light: false },
  { fill: "var(--s2)", ink: "var(--ink)", light: false },
];
const TITLE_POS: readonly TitlePos[] = ["top", "center", "bottom"];

export function familyForEra(eraId: EraId): MotifFamily {
  return FAMILY[eraId];
}

export function buildArtSpec(input: ArtInput): ArtSpec {
  const rng = makeRng(input.seedKey);
  const family = FAMILY[input.eraId];

  // Role shuffle: different seeds emphasize different era colors.
  const motifShuffled = shuffle(rng, MOTIF);
  const fieldOrder = shuffle(rng, FIELD);
  const roles: ArtRoles = {
    field: fieldOrder[0]!,
    field2: fieldOrder[1]!,
    motif: motifShuffled[0]!,
    motifAlt: motifShuffled[1]!,
    highlight: motifShuffled[2]!,
  };

  const plate = pick(rng, PLATES);
  const titlePos = pick(rng, TITLE_POS);
  const catalogNo = `MFL-${input.year}-${String(int(rng, 1, 999)).padStart(3, "0")}`;

  const params: ArtParams = {
    rings: int(rng, 4, 9),
    frameSteps: int(rng, 2, 4),
    splitAngle: int(rng, -28, 28),
    sunR: range(rng, 0.18, 0.32),
    rays: int(rng, 9, 18),
    waveAmp: range(rng, 0.04, 0.12),
    wavePhase: range(rng, 0, Math.PI * 2),
    gridLines: int(rng, 5, 9),
    chevrons: int(rng, 2, 4),
    arcs: int(rng, 3, 6),
    rotate: int(rng, -12, 12),
    originX: range(rng, 0.3, 0.7),
    originY: range(rng, 0.32, 0.6),
  };

  return { family, roles, plate, titlePos, catalogNo, params };
}
