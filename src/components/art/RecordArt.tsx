/*
 * RecordArt — deterministic generative sleeve art (Phase 9).
 *
 * Pure + side-effect-free (no hooks/state) so it renders on the server with zero
 * hydration cost wherever its parent is a server component (ReleaseCard, the
 * /catalog list). "The medium is the map" onto the catalog: each era has one
 * motif family, the seed shuffles which era token paints which shape + varies the
 * geometry/layout, and `data-era` on the wrapper makes the CSS-var fills resolve
 * to the record's OWN era (tokens.css stays the single color source).
 *
 * Art is static SVG → reduced-motion safe by construction. The motif is
 * decorative (aria-hidden); the title is real text (its own script via
 * scriptFont, Latin beneath) so it labels the sleeve, unless `decorativeTitle`
 * (when a nearby <h1>/caption already owns the name). Title sizing uses container
 * query units (cqi) so it scales to any box with no JS. AA: the title plate uses
 * only pairs verified across all five eras (tokens.css).
 */
import type { CSSProperties } from "react";
import { decadeToEraId, type Release, type Track } from "@/lib/catalog";
import { scriptFont, type Script } from "@/lib/fonts";
import { cx } from "@/lib/cx";
import { buildArtSpec, type ArtSpec } from "@/lib/art/recordArt";

export type RecordArtSize = "sm" | "md" | "lg";
export type RecordArtVariant = "sleeve" | "swatch";

export type RecordArtSubject = { track: Track } | { release: Release };

export interface RecordArtProps {
  subject: RecordArtSubject;
  size?: RecordArtSize;
  variant?: RecordArtVariant;
  /** Hide the in-art title from assistive tech (a nearby heading owns the name). */
  decorativeTitle?: boolean;
  className?: string;
}

const LANG: Record<Script, string> = {
  devanagari: "hi",
  gurmukhi: "pa",
  bengali: "bn",
  latin: "en",
};

interface Normalized {
  seedKey: string;
  eraId: ReturnType<typeof decadeToEraId>;
  year: number;
  native: string;
  latin: string;
  script: Script;
}

function normalize(subject: RecordArtSubject): Normalized {
  if ("track" in subject) {
    const t = subject.track;
    return {
      seedKey: `${t.id}|${t.film ?? t.title.latin}|${t.year}`,
      eraId: decadeToEraId(t.era),
      year: t.year,
      native: t.title.native,
      latin: t.title.latin,
      script: t.script,
    };
  }
  const r = subject.release;
  return {
    seedKey: `${r.id}|${r.film}|${r.year}`,
    eraId: decadeToEraId(r.era),
    year: r.year,
    native: r.film,
    latin: r.film,
    script: "latin",
  };
}

/** Deterministic 2-decimal format so SSR and client markup match exactly. */
const f = (n: number): string => n.toFixed(2);

// ----- motif families (0..100 viewBox; flat fills, no per-card filters) -------

function DecoMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  const rings = Array.from({ length: params.rings }, (_, i) => {
    const r = 9 + (i * 40) / params.rings;
    return (
      <circle
        key={`r${i}`}
        cx="50"
        cy="50"
        r={f(r)}
        fill="none"
        stroke={roles.motif}
        strokeWidth="0.5"
        opacity={f(0.18 + (i / params.rings) * 0.32)}
      />
    );
  });
  const frame = Array.from({ length: params.frameSteps }, (_, j) => {
    const inset = 4 + j * 3;
    return (
      <rect
        key={`f${j}`}
        x={f(inset)}
        y={f(inset)}
        width={f(100 - inset * 2)}
        height={f(100 - inset * 2)}
        fill="none"
        stroke={roles.highlight}
        strokeWidth="0.7"
        opacity={f(0.5 - j * 0.1)}
      />
    );
  });
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      <circle cx="50" cy="50" r="58" fill={roles.field2} opacity="0.45" />
      {rings}
      <circle cx="50" cy="50" r="5" fill={roles.highlight} opacity="0.85" />
      {frame}
    </>
  );
}

function ModernMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  const sx = params.originX * 100;
  const sy = params.originY * 100;
  const sr = params.sunR * 100;
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      <g transform={`rotate(${params.splitAngle} 50 50)`}>
        <rect x="50" y="-30" width="90" height="160" fill={roles.field2} />
      </g>
      <circle cx={f(sx)} cy={f(sy)} r={f(sr)} fill={roles.motif} />
      <circle
        cx={f(sx)}
        cy={f(sy)}
        r={f(sr + 3)}
        fill="none"
        stroke={roles.highlight}
        strokeWidth="0.8"
        opacity="0.6"
      />
    </>
  );
}

function PsychMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  const ox = params.originX * 100;
  const oy = params.originY * 100;
  const step = 360 / params.rays;
  const wedges = Array.from({ length: params.rays }, (_, i) => {
    if (i % 2 !== 0) return null;
    const a0 = ((i * step + params.rotate) * Math.PI) / 180;
    const a1 = (((i + 1) * step + params.rotate) * Math.PI) / 180;
    const R = 150;
    const p1 = `${f(ox + Math.cos(a0) * R)},${f(oy + Math.sin(a0) * R)}`;
    const p2 = `${f(ox + Math.cos(a1) * R)},${f(oy + Math.sin(a1) * R)}`;
    return (
      <polygon
        key={`w${i}`}
        points={`${f(ox)},${f(oy)} ${p1} ${p2}`}
        fill={i % 4 === 0 ? roles.motif : roles.motifAlt}
        opacity="0.5"
      />
    );
  });
  const waves = Array.from({ length: 3 }, (_, k) => {
    const base = 30 + k * 22;
    const amp = params.waveAmp * 100;
    const pts: string[] = [];
    for (let x = 0; x <= 100; x += 8) {
      const y = base + amp * Math.sin((x / 100) * Math.PI * 3 + params.wavePhase + k);
      pts.push(`${f(x)},${f(y)}`);
    }
    return (
      <polyline
        key={`v${k}`}
        points={pts.join(" ")}
        fill="none"
        stroke={roles.highlight}
        strokeWidth="0.7"
        opacity="0.4"
      />
    );
  });
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      {wedges}
      {waves}
    </>
  );
}

function NeonMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  const horizon = 40 + params.originY * 20;
  const verticals = Array.from({ length: params.gridLines }, (_, i) => {
    const x = (i / (params.gridLines - 1)) * 100;
    return (
      <line
        key={`gv${i}`}
        x1={f(x)}
        y1="100"
        x2="50"
        y2={f(horizon)}
        stroke={roles.motif}
        strokeWidth="0.5"
        opacity="0.4"
      />
    );
  });
  const horizontals = Array.from({ length: 5 }, (_, h) => {
    const t = Math.pow((h + 1) / 5, 1.7);
    const y = horizon + (100 - horizon) * t;
    return (
      <line
        key={`gh${h}`}
        x1="0"
        y1={f(y)}
        x2="100"
        y2={f(y)}
        stroke={roles.motif}
        strokeWidth="0.5"
        opacity="0.3"
      />
    );
  });
  const chevrons = Array.from({ length: params.chevrons }, (_, c) => {
    const y = 8 + c * 7;
    return (
      <polyline
        key={`c${c}`}
        points={`30,${f(y)} 50,${f(y - 5)} 70,${f(y)}`}
        fill="none"
        stroke={roles.highlight}
        strokeWidth="1"
        opacity={f(0.8 - c * 0.18)}
      />
    );
  });
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      <circle cx="50" cy={f(horizon - 13)} r="13" fill={roles.motifAlt} opacity="0.85" />
      {verticals}
      {horizontals}
      {chevrons}
    </>
  );
}

function ChromeMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  const arcs = Array.from({ length: params.arcs }, (_, i) => {
    const r = 22 + i * 12;
    // quarter arc sweeping from the top-right corner
    const d = `M ${f(100 - r)} 0 A ${f(r)} ${f(r)} 0 0 1 100 ${f(r)}`;
    return (
      <path
        key={`a${i}`}
        d={d}
        fill="none"
        stroke={i % 2 === 0 ? roles.motif : roles.motifAlt}
        strokeWidth="0.9"
        opacity={f(0.75 - i * 0.08)}
      />
    );
  });
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      <rect width="100" height="100" fill={roles.field2} opacity="0.25" />
      {arcs}
      <line
        x1="10"
        y1="86"
        x2="46"
        y2="86"
        stroke={roles.highlight}
        strokeWidth="0.8"
        opacity="0.7"
      />
      <circle cx="50" cy="86" r="1.6" fill={roles.highlight} opacity="0.8" />
    </>
  );
}

function PixelMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  // a rounded pixel grid, density from gridLines; a seeded diagonal of lit cells
  const n = Math.max(params.gridLines, 6);
  const cell = 100 / n;
  const cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      // deterministic sparse lighting from the already-seeded params
      const v = Math.sin(x * 12.9898 + y * 78.233 + params.wavePhase) * 43758.5453;
      const r = v - Math.floor(v);
      if (r < 0.16) {
        cells.push(
          <rect
            key={`${x}-${y}`}
            x={f(x * cell + cell * 0.15)}
            y={f(y * cell + cell * 0.15)}
            width={f(cell * 0.7)}
            height={f(cell * 0.7)}
            rx={f(cell * 0.22)}
            fill={r < 0.05 ? roles.highlight : roles.motif}
            opacity={f(0.35 + r * 2.5)}
          />,
        );
      }
    }
  }
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      <rect width="100" height="100" fill={roles.field2} opacity="0.3" />
      {cells}
      <circle cx={f(params.originX * 100)} cy={f(params.originY * 100)} r="16" fill={roles.motifAlt} opacity="0.5" />
    </>
  );
}

function WaveMotif({ spec }: { spec: ArtSpec }) {
  const { roles, params } = spec;
  // a waveform of seeded bars across the center — the shape of a streamed song
  const bars = Math.max(params.rays, 12);
  const bw = 100 / (bars * 1.6);
  const items: React.ReactNode[] = [];
  for (let i = 0; i < bars; i++) {
    const t = i / bars;
    const h =
      8 +
      34 *
        Math.abs(
          Math.sin(t * Math.PI * 2.4 + params.wavePhase) *
            Math.sin(t * Math.PI * 7 + params.rotate),
        );
    items.push(
      <rect
        key={i}
        x={f(6 + t * 88)}
        y={f(50 - h / 2)}
        width={f(bw)}
        height={f(h)}
        rx={f(bw / 2)}
        fill={i % 5 === 0 ? roles.highlight : roles.motif}
        opacity={f(0.55 + 0.45 * Math.abs(Math.sin(t * 9 + params.wavePhase)))}
      />,
    );
  }
  return (
    <>
      <rect width="100" height="100" fill={roles.field} />
      {/* the gradient-age field: two soft color pools */}
      <circle cx={f(params.originX * 100)} cy="18" r="38" fill={roles.motifAlt} opacity="0.22" />
      <circle cx={f(100 - params.originX * 100)} cy="86" r="44" fill={roles.highlight} opacity="0.12" />
      {items}
    </>
  );
}

function Motif({ spec }: { spec: ArtSpec }) {
  switch (spec.family) {
    case "deco":
      return <DecoMotif spec={spec} />;
    case "modern":
      return <ModernMotif spec={spec} />;
    case "psych":
      return <PsychMotif spec={spec} />;
    case "neon":
      return <NeonMotif spec={spec} />;
    case "chrome":
      return <ChromeMotif spec={spec} />;
    case "pixel":
      return <PixelMotif spec={spec} />;
    case "wave":
      return <WaveMotif spec={spec} />;
  }
}

// ----- component --------------------------------------------------------------

const POS: Record<ArtSpec["titlePos"], string> = {
  top: "top-0 left-0 right-0",
  center: "top-1/2 left-0 right-0 -translate-y-1/2",
  bottom: "bottom-0 left-0 right-0",
};

export function RecordArt({
  subject,
  size = "md",
  variant = "sleeve",
  decorativeTitle = false,
  className,
}: RecordArtProps) {
  const rec = normalize(subject);
  const spec = buildArtSpec({ seedKey: rec.seedKey, eraId: rec.eraId, year: rec.year });
  const font = scriptFont(rec.script);
  const latinRedundant = rec.script === "latin" || rec.latin === rec.native;

  const svg = (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
    >
      <Motif spec={spec} />
    </svg>
  );

  const edge = (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        inset: "5cqi",
        border: "0.4cqi solid",
        borderColor: spec.roles.highlight,
        borderRadius: "2cqi",
        opacity: 0.3,
      }}
    />
  );

  if (variant === "swatch") {
    return (
      <span
        aria-hidden="true"
        data-era={rec.eraId}
        className={cx("relative block h-full w-full overflow-hidden", className)}
        style={{ containerType: "inline-size" }}
      >
        {svg}
        {edge}
      </span>
    );
  }

  const marksAtBottom = spec.titlePos !== "bottom";
  const markColor = "var(--ink)";

  return (
    <div
      data-era={rec.eraId}
      className={cx("relative h-full w-full overflow-hidden", className)}
      style={{ containerType: "inline-size" } as CSSProperties}
    >
      {svg}
      {edge}

      {/* catalog number + house mark, in the corner the title band leaves free */}
      <div
        aria-hidden="true"
        className="absolute right-0 left-0 flex items-center justify-between"
        style={{
          padding: "0 6cqi",
          color: markColor,
          fontSize: "3.3cqi",
          letterSpacing: "0.18em",
          opacity: 0.72,
          ...(marksAtBottom ? { bottom: "3.5cqi" } : { top: "3.5cqi" }),
        }}
      >
        <span className="font-mono uppercase">MEHFIL</span>
        <span className="font-mono tabular-nums">{spec.catalogNo}</span>
      </div>

      {/* title plate (AA-paired tokens), set into the sleeve */}
      <div
        className={cx("absolute overflow-hidden", POS[spec.titlePos])}
        style={{
          background: spec.plate.fill,
          color: spec.plate.ink,
          padding: "4.5cqi 6cqi",
        }}
      >
        <span
          lang={LANG[rec.script]}
          className={cx("block leading-[1.05]", font.display)}
          style={{ fontSize: size === "lg" ? "13cqi" : "11.5cqi" }}
          aria-hidden={decorativeTitle || undefined}
        >
          {rec.native}
        </span>
        {!latinRedundant && (
          <span
            lang="en"
            className={cx("mt-[1cqi] block opacity-80", font.body)}
            style={{ fontSize: "5.6cqi" }}
            aria-hidden={decorativeTitle || undefined}
          >
            {rec.latin}
          </span>
        )}
      </div>
    </div>
  );
}
