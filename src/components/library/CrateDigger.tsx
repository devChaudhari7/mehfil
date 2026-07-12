"use client";

/*
 * CrateDigger — the Library as a record crate (Phase 18 · Archive Edition).
 *
 * The whole century stands in one crate, sorted by year: full generative sleeves
 * in a cover-flow row, the focused record face-on, its neighbours skewed away
 * like real crates. Dig with drag, arrow keys, a click on any neighbour, or the
 * year scrubber. The focused record offers Play + its album; the pressing-sheet
 * list below remains the accessible, scannable parallel (and the reduced-motion
 * primary — the crate flattens to a simple swap there).
 *
 * Perf: only a ±7 window of sleeves is mounted (~15 of 230+); transform/opacity
 * only; no wheel hijack — the page keeps native scroll.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { catalogRepository, decadeToEraId, releaseId, type Track } from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { RecordArt } from "@/components/art";
import { GrooveLink } from "@/components/GrooveLink";
import { NativeText } from "@/components/ui";
import { PlayControl } from "@/components/browse/PlayControl";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cx } from "@/lib/cx";

const WINDOW = 7; // sleeves mounted either side of the focus

const ALL: Track[] = [...catalogRepository.allTracks()].sort(
  (a, b) => a.year - b.year || a.title.latin.localeCompare(b.title.latin),
);

export function CrateDigger() {
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState(0);
  const clamp = useCallback((i: number) => Math.min(Math.max(i, 0), ALL.length - 1), []);
  const step = useCallback((d: number) => setFocus((f) => clamp(f + d)), [clamp]);

  // drag-to-dig (pointer events; vertical page scroll stays native via touch-action)
  const dragRef = useRef<{ x: number; start: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = { x: e.clientX, start: focus };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d) return;
    setFocus(clamp(d.start + Math.round((d.x - e.clientX) / 60)));
  };
  const onPointerUp = () => {
    dragRef.current = null;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
    } else if (e.key === "Home") {
      e.preventDefault();
      setFocus(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setFocus(ALL.length - 1);
    }
  };

  const current = ALL[focus];
  const visible = useMemo(() => {
    const from = Math.max(0, focus - WINDOW);
    const to = Math.min(ALL.length, focus + WINDOW + 1);
    return ALL.slice(from, to).map((t, i) => ({ track: t, index: from + i }));
  }, [focus]);

  // the crate follows the record's own era (palette morphs as you dig decades)
  useEffect(() => {
    if (!current) return;
    // passive palette hint only — the era store stays owned by the world/scroll
  }, [current]);

  if (!current) return null;
  const era = getEra(decadeToEraId(current.era));
  const albumId = current.film ? releaseId(current.film, current.year) : null;

  return (
    <section aria-label="Dig the crate" className="flex flex-col items-center">
      {/* ghosted plate numeral — the year you are digging through */}
      <div className="relative w-full" style={{ height: "min(58vw, 430px)" }}>
        <div
          aria-hidden="true"
          className="font-display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center leading-none"
          style={{
            fontSize: "clamp(6rem, 22vw, 15rem)",
            fontVariantNumeric: "tabular-nums",
            color: "color-mix(in srgb, var(--ink) 7%, transparent)",
          }}
        >
          {current.year}
        </div>

        {/* the crate */}
        <div
          role="group"
          aria-label={`Record crate — ${ALL.length} records, arrow keys to dig`}
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="crate absolute inset-0 outline-none"
          style={{ touchAction: "pan-y" }}
        >
          {visible.map(({ track, index }) => {
            const off = index - focus;
            const focused = off === 0;
            return (
              <button
                key={track.id}
                type="button"
                aria-label={`${track.title.latin} (${track.year})`}
                tabIndex={-1}
                onClick={() => setFocus(index)}
                className={cx("crate__sleeve", focused && "crate__sleeve--front")}
                style={
                  reduced
                    ? { opacity: focused ? 1 : 0, pointerEvents: focused ? "auto" : "none" }
                    : {
                        transform: `translate(-50%, -50%) translateX(${
                          off === 0 ? 0 : Math.sign(off) * 120 + off * 34
                        }px) rotateY(${off === 0 ? 0 : -Math.sign(off) * 52}deg) scale(${
                          focused ? 1 : 0.82
                        })`,
                        zIndex: 100 - Math.abs(off),
                        opacity: Math.abs(off) >= WINDOW ? 0 : 1,
                      }
                }
              >
                <RecordArt subject={{ track }} variant="sleeve" decorativeTitle />
              </button>
            );
          })}
        </div>
      </div>

      {/* the year scrubber — dig straight to a decade */}
      <input
        type="range"
        min={0}
        max={ALL.length - 1}
        value={focus}
        onChange={(e) => setFocus(Number(e.target.value))}
        aria-label="Dig through the years"
        className="mt-2 h-1 w-[min(80vw,520px)] cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--glow)]"
      />

      {/* the focused record — wall-text metadata + actions */}
      <div aria-live="polite" className="mt-6 flex flex-col items-center gap-3 text-center">
        <p className="text-accent font-mono text-[10px] tracking-[0.3em] uppercase">
          {era.decade} · {era.mediumLabel} · Nº {focus + 1} / {ALL.length}
        </p>
        <NativeText
          native={current.title.native}
          latin={current.title.latin}
          script={current.script}
          size="h2"
        />
        {current.film && (
          <p className="text-ink/55 font-mono text-[11px] tracking-[0.16em] uppercase">
            from “{current.film}”
          </p>
        )}
        <div className="mt-1 flex items-center gap-4">
          <PlayControl track={current} queue={ALL} />
          {albumId && (
            <GrooveLink
              href={`/album/${albumId}`}
              intent="journey"
              className="text-ink/60 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
            >
              Open the record →
            </GrooveLink>
          )}
        </div>
      </div>
    </section>
  );
}
