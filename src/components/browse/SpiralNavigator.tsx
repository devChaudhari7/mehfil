"use client";

/*
 * SpiralNavigator — the primary browse interaction (art-direction Layer 1, Phase 5).
 *
 * One groove you zoom through: ERAS → a record's-worth of RECORDS (films + singles)
 * → a release's TRACKS. Nodes are laid along the Archimedean spiral (lib/spiral.ts);
 * they're real <button>s (keyboard + screen-reader first), so travel works by arrow
 * keys / wheel / pointer, Enter zooms in or plays, and Esc/Backspace zooms out.
 * Travelling the era level morphs the palette in lockstep (setEra).
 *
 * Tier C / reduced-motion → a static, in-flow list of the same nodes (the "Browse
 * as list" parallel), and every level always links out to its routed page, so the
 * experience never depends on the spiral animation.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, CornerUpLeft, Disc3, Pause, Play } from "lucide-react";
import {
  catalogRepository,
  filmReleases,
  getRelease,
  standaloneSingles,
  type EraDecade,
  type Track,
} from "@/lib/catalog";
import { ERAS, getEra, type EraId } from "@/lib/eras";
import { scriptFont, type Script } from "@/lib/fonts";
import { useEraStore } from "@/lib/useEraStore";
import { useRenderTier } from "@/lib/useRenderTier";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { canPlay, playFromCollection } from "@/lib/player/playFromCollection";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { nodePoints, pointAt, type SpiralOpts } from "@/lib/spiral";
import { cx } from "@/lib/cx";

const ALL_TRACKS = catalogRepository.allTracks();
const GEOM: SpiralOpts = { turns: 2.6, minR: 16, maxR: 46 };

type Level = "eras" | "records" | "tracks";

interface NavNode {
  key: string;
  kind: "era" | "release" | "track";
  title: string;
  sub?: string;
  script?: Script;
  eraId?: EraId;
  releaseId?: string;
  track?: Track;
  playable?: boolean;
}

interface NavState {
  level: Level;
  releaseId?: string;
}

/* Era is the single source of truth in useEraStore; level/releaseId are local. */
function buildLevel(level: Level, era: EraId, releaseId?: string): { nodes: NavNode[]; queue: Track[] } {
  if (level === "eras") {
    return {
      nodes: ERAS.map((e) => ({
        key: e.id,
        kind: "era",
        title: e.decade,
        sub: e.mediumLabel,
        eraId: e.id,
      })),
      queue: [],
    };
  }

  if (level === "records") {
    const decade = getEra(era).decade as EraDecade;
    const tracks = catalogRepository.tracksByEra(decade);
    const releases = filmReleases(tracks);
    const singles = standaloneSingles(tracks);
    const nodes: NavNode[] = [
      ...releases.map((r) => ({
        key: `rel:${r.id}`,
        kind: "release" as const,
        title: r.film,
        sub: `${r.year} · ${r.trackIds.length} ${r.trackIds.length === 1 ? "song" : "songs"}`,
        releaseId: r.id,
      })),
      ...singles.map((t) => ({
        key: `sng:${t.id}`,
        kind: "track" as const,
        title: t.title.native,
        sub: t.title.latin,
        script: t.script,
        track: t,
        playable: canPlay(t),
      })),
    ];
    return { nodes, queue: singles };
  }

  // tracks
  const release = releaseId ? getRelease(ALL_TRACKS, releaseId) : undefined;
  const tracks = release
    ? release.trackIds
        .map((tid) => catalogRepository.getTrack(tid))
        .filter((t): t is Track => Boolean(t))
    : [];
  return {
    nodes: tracks.map((t) => ({
      key: `trk:${t.id}`,
      kind: "track",
      title: t.title.native,
      sub: t.title.latin,
      script: t.script,
      track: t,
      playable: canPlay(t),
    })),
    queue: tracks,
  };
}

function breadcrumb(level: Level, era: EraId, releaseId?: string): string {
  const decade = getEra(era).decade;
  if (level === "eras") return "Travel the eras";
  if (level === "records") return `${decade} · records & films`;
  const release = releaseId ? getRelease(ALL_TRACKS, releaseId) : undefined;
  return release ? `${decade} › ${release.film}` : decade;
}

/** Where the current level's "Browse as list" link points (era from the store). */
function listHref(level: Level, era: EraId, releaseId?: string): string {
  if (level === "tracks" && releaseId) return `/album/${releaseId}`;
  return `/era/${getEra(era).decade}`;
}

export function SpiralNavigator({ active = true }: { active?: boolean } = {}) {
  const tier = useRenderTier();
  const reduced = useReducedMotion();
  const storeEra = useEraStore((s) => s.era);
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);

  const [nav, setNav] = useState<NavState>(() => ({ level: "eras" }));
  const [focus, setFocus] = useState(() => Math.max(ERAS.findIndex((e) => e.id === storeEra), 0));

  const { nodes, queue } = useMemo(
    () => buildLevel(nav.level, storeEra, nav.releaseId),
    [nav, storeEra],
  );
  const points = useMemo(() => nodePoints(nodes.length, GEOM, 0.2, 1), [nodes.length]);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const clampFocus = useCallback((i: number) => Math.min(Math.max(i, 0), nodes.length - 1), [nodes.length]);

  // Travelling the era level lifts the selection into useEraStore (single source),
  // so the palette morphs AND "Browse as list" tracks the choice live. Only when this
  // is the live depth (active) — at depth 0 the home auto-journey owns the era, and the
  // hidden spiral must not fight it (Phase 13).
  useEffect(() => {
    if (!active || nav.level !== "eras") return;
    const node = nodes[focus];
    if (node?.eraId && node.eraId !== storeEra) useEraStore.getState().setEra(node.eraId);
  }, [active, nav.level, focus, nodes, storeEra]);

  const moveFocus = useCallback(
    (delta: number) => {
      setFocus((f) => {
        const next = clampFocus(f + delta);
        refs.current[next]?.focus();
        return next;
      });
    },
    [clampFocus],
  );

  const zoomOut = useCallback(() => {
    if (nav.level === "tracks") {
      setNav({ level: "records" });
      setFocus(0);
    } else if (nav.level === "records") {
      setNav({ level: "eras" });
      setFocus(Math.max(ERAS.findIndex((e) => e.id === storeEra), 0));
    }
  }, [nav, storeEra]);

  function activate(node: NavNode) {
    if (node.kind === "era" && node.eraId) {
      useEraStore.getState().setEra(node.eraId);
      setNav({ level: "records" });
      setFocus(0);
    } else if (node.kind === "release" && node.releaseId) {
      setNav({ level: "tracks", releaseId: node.releaseId });
      setFocus(0);
    } else if (node.kind === "track" && node.track) {
      playFromCollection(queue, node.track);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        moveFocus(1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        moveFocus(-1);
        break;
      case "Home":
        setFocus(0);
        refs.current[0]?.focus();
        break;
      case "End":
        setFocus(nodes.length - 1);
        refs.current[nodes.length - 1]?.focus();
        break;
      case "Enter":
      case " ":
        if (nodes[focus]) activate(nodes[focus]!);
        break;
      case "Escape":
      case "Backspace":
        if (nav.level !== "eras") zoomOut();
        break;
      default:
        return;
    }
    e.preventDefault();
  }

  // Wheel = move focus, but ONLY as a standalone page (active). On the home scroll world
  // (inactive) the wheel must scroll the page so the scroll-camera + era-travel run — never
  // hijack it.
  const groupRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = groupRef.current;
    if (!el || reduced || !active) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 2) return;
      e.preventDefault();
      moveFocus(e.deltaY > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [moveFocus, reduced, active]);

  // On the scroll world (inactive) the hub follows the scroll-driven era, so the year +
  // medium visibly change as you scroll; standalone, it follows keyboard focus.
  const dispIdx =
    !active && nav.level === "eras"
      ? Math.max(
          ERAS.findIndex((e) => e.id === storeEra),
          0,
        )
      : focus;
  const focused = nodes[dispIdx];
  const staticMode = reduced || tier === "C";

  const announce =
    `${breadcrumb(nav.level, storeEra, nav.releaseId)}. ` +
    (focused
      ? `${focused.kind === "track" ? focused.sub ?? focused.title : focused.title}` +
        (focused.kind === "track" && focused.playable === false ? " — no source yet" : "")
      : "");

  return (
    <div className="flex w-full flex-col items-center gap-7">
      {/* control bar: zoom-out + breadcrumb + list link */}
      <div className="flex w-full max-w-xl items-center justify-between gap-3">
        <button
          type="button"
          onClick={zoomOut}
          disabled={nav.level === "eras"}
          aria-label="Zoom out"
          className={cx(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wide transition-colors",
            nav.level === "eras"
              ? "text-ink/25 cursor-not-allowed border-white/5"
              : "text-ink/70 hover:text-ink cursor-pointer border-white/15 hover:bg-white/10",
          )}
        >
          <CornerUpLeft size={13} /> Out
        </button>
        <p className="text-ink/70 truncate font-mono text-[11px] tracking-[0.16em] uppercase">
          {breadcrumb(nav.level, storeEra, nav.releaseId)}
        </p>
        <Link
          href={listHref(nav.level, storeEra, nav.releaseId)}
          className="text-ink/60 hover:text-accent shrink-0 font-mono text-[11px] tracking-wide underline-offset-4 hover:underline"
        >
          As list →
        </Link>
      </div>

      {staticMode ? (
        <StaticLevel nodes={nodes} focusIndex={focus} onActivate={activate} currentId={currentId} />
      ) : (
        <div
          ref={groupRef}
          role="group"
          aria-label="The groove — travel with arrow keys, Enter to open, Escape to go back"
          onKeyDown={onKeyDown}
          className="relative aspect-square w-[min(88vw,60vh,560px)]"
        >
          {/* decorative groove */}
          <svg viewBox="0 0 100 100" aria-hidden="true" className="absolute inset-0 h-full w-full">
            <path
              d={spiralPath()}
              fill="none"
              stroke="var(--accent)"
              strokeOpacity="0.22"
              strokeWidth="0.4"
            />
          </svg>

          {/* central hub disc — you're standing inside the record. Also the
              shared-element target the home/album record morphs into (Phase 12). */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: "34%",
              aspectRatio: "1",
              viewTransitionName: "groove-record",
              background:
                "repeating-radial-gradient(circle at 50% 50%, var(--disc) 0 3px, var(--disc2) 3px 5px)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)",
              opacity: 0.55,
            }}
          />

          {/* center hub: the focused node + its action */}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="max-w-[44%] text-center">
              <Disc3
                size={22}
                className={cx("text-accent mx-auto", status === "playing" && "animate-spin")}
                style={status === "playing" ? { animationDuration: "1.8s" } : undefined}
              />
              {focused && (
                <p
                  className={cx(
                    "text-ink mt-2 text-3xl leading-tight sm:text-4xl",
                    focused.script ? scriptFont(focused.script).display : "font-display",
                  )}
                >
                  {focused.title}
                </p>
              )}
              {focused?.sub && (
                <p className="text-ink/70 mt-2 font-mono text-[11px] tracking-[0.14em]">
                  {focused.sub}
                </p>
              )}
              <p className="text-accent/70 mt-3 font-mono text-[10px] tracking-[0.22em] uppercase">
                {hint(focused)}
              </p>
            </div>
          </div>

          {/* nodes on the groove */}
          <div key={`${nav.level}:${storeEra}:${nav.releaseId ?? ""}`} className="groove-zoom absolute inset-0">
            {nodes.map((node, i) => {
              const p = points[i] ?? pointAt(0.5, GEOM);
              const active = i === dispIdx;
              const isCurrent = node.track && currentId === node.track.id;
              const disabled = node.kind === "track" && node.playable === false;
              return (
                <button
                  key={node.key}
                  type="button"
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  tabIndex={active ? 0 : -1}
                  aria-label={nodeLabel(node)}
                  onClick={() => {
                    setFocus(i);
                    activate(node);
                  }}
                  onFocus={() => setFocus(i)}
                  className={cx(
                    "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition-[width,height,background-color,box-shadow] duration-300 ease-[var(--ease-analog)]",
                    active ? "h-5 w-5" : "h-3 w-3",
                    disabled
                      ? "bg-ink/20 cursor-not-allowed"
                      : "bg-accent/60 hover:bg-accent cursor-pointer",
                    isCurrent && "bg-glow",
                  )}
                  style={{
                    left: `${50 + p.x}%`,
                    top: `${50 + p.y}%`,
                    boxShadow: active ? "0 0 12px var(--glow)" : undefined,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  );
}

function hint(node: NavNode | undefined): string {
  if (!node) return "";
  if (node.kind === "era") return "Enter to open";
  if (node.kind === "release") return "Enter to open";
  return node.playable ? "Enter to play" : "No source yet";
}

function nodeLabel(node: NavNode): string {
  const base = node.kind === "track" ? `${node.sub ?? node.title}` : node.title;
  if (node.kind === "era") return `${base} — open era`;
  if (node.kind === "release") return `${base} — open album`;
  return node.playable ? `Play ${base}` : `${base} — no source yet`;
}

function spiralPath(): string {
  const steps = 240;
  let d = "";
  for (let i = 0; i <= steps; i++) {
    const p = pointAt(i / steps, GEOM);
    d += `${i === 0 ? "M" : "L"}${(50 + p.x).toFixed(2)} ${(50 + p.y).toFixed(2)} `;
  }
  return d;
}

/* Reduced-motion / Tier C: the same nodes as a calm, in-flow list. */
function StaticLevel({
  nodes,
  focusIndex,
  onActivate,
  currentId,
}: {
  nodes: NavNode[];
  focusIndex: number;
  onActivate: (n: NavNode) => void;
  currentId?: string;
}) {
  return (
    <ul className="flex w-full max-w-xl flex-col gap-2">
      {nodes.map((node, i) => {
        const disabled = node.kind === "track" && node.playable === false;
        const isCurrent = node.track && currentId === node.track.id;
        const Icon = node.kind === "track" ? (isCurrent ? Pause : Play) : ChevronRight;
        return (
          <li key={node.key}>
            <button
              type="button"
              autoFocus={i === focusIndex}
              disabled={disabled}
              onClick={() => onActivate(node)}
              aria-label={nodeLabel(node)}
              className={cx(
                "flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                disabled
                  ? "text-ink/30 cursor-not-allowed border-white/5"
                  : "text-ink hover:bg-white/10 cursor-pointer border-white/15",
                isCurrent && "bg-white/[0.06]",
              )}
            >
              <span className="min-w-0">
                <span
                  className={cx(
                    "block truncate",
                    node.script ? scriptFont(node.script).display : "font-display",
                  )}
                >
                  {node.title}
                </span>
                {node.sub && (
                  <span className="text-ink/55 block truncate font-mono text-[11px] tracking-wide">
                    {node.sub}
                  </span>
                )}
              </span>
              <Icon size={16} className="text-accent shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
