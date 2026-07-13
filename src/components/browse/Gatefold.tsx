"use client";

/*
 * Gatefold — the album as a physical jacket that OPENS (Phase 18 · the Instrument
 * organ in the Archive Edition).
 *
 * Closed: the generative sleeve faces you, engraved "open the gatefold" beneath.
 * Click: the cover swings on its left hinge (real 3D), the whole composition
 * sliding as a real gatefold does, revealing the liner notes printed on the
 * cover's back and the pressing sheet (tracklist) on the base board. The vinyl
 * slides out of the jacket while open and spins when this release is playing.
 *
 * A11y: the cover is a button with aria-expanded; the inside is ordinary content
 * (the same TrackList used across the app). Reduced motion: no 3D — an instant
 * crossfade between cover and inside. Small screens: the inside stacks in flow
 * beneath instead of unfolding sideways.
 */
import { useEffect, useRef, useState } from "react";
import type { Release, Track } from "@/lib/catalog";
import { usePlayerStore } from "@/lib/player/usePlayerStore";
import { playCassetteClunk } from "@/lib/sound/sfx";
import { useSoundStore } from "@/lib/sound/useSoundStore";
import { RecordArt } from "@/components/art";
import { Vinyl } from "@/components/ui";
import { cx } from "@/lib/cx";
import { TrackList } from "./TrackList";

export function Gatefold({
  release,
  tracks,
  rpm,
}: {
  release: Release;
  tracks: Track[];
  rpm: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const [board, setBoard] = useState(0); // measured board edge px (vinyl sizing)
  const currentId = usePlayerStore((s) => s.currentTrack?.id);
  const status = usePlayerStore((s) => s.status);
  const spinning =
    !!currentId && release.trackIds.includes(currentId) && status === "playing";

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h) setBoard(Math.round(h));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={rootRef}
        className={cx("gatefold", open && "gatefold--open")}
        style={{ viewTransitionName: "groove-record" }}
      >
        {/* the vinyl, tucked in the jacket — slides out while open */}
        {board > 0 && (
          <div aria-hidden="true" className="gatefold__vinyl">
            <Vinyl size={Math.round(board * 0.88)} spinning={spinning} label={rpm} />
          </div>
        )}

        {/* base board — the pressing sheet (tracklist), revealed by the cover */}
        <div className="gatefold__base" inert={!open}>
          <p className="text-ink/60 font-mono text-[9px] tracking-[0.26em] uppercase">
            Pressing sheet · {rpm}
          </p>
          <div className="gatefold__sheet">
            <TrackList tracks={tracks} className="text-sm" />
          </div>
        </div>

        {/* the cover: sleeve front, liner notes on its back, hinged left */}
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close the gatefold" : `Open the gatefold — ${release.film}`}
          onClick={() => {
            useSoundStore.getState().unlock(); // the open IS a gesture
            if (!open) playCassetteClunk(); // the jacket thunk
            setOpen((o) => !o);
          }}
          data-magnet
          data-tilt
          className="gatefold__cover"
        >
          <span className="gatefold__face gatefold__face--front">
            <RecordArt subject={{ release }} size="lg" variant="sleeve" decorativeTitle />
          </span>
          <span className="gatefold__face gatefold__face--back" aria-hidden={!open}>
            <span className="text-accent-paper font-mono text-[9px] tracking-[0.26em] uppercase">
              Liner notes
            </span>
            <span className="font-display mt-2 block text-xl leading-tight">{release.film}</span>
            <span className="mt-3 block font-mono text-[11px] leading-relaxed tracking-wide opacity-80">
              {release.year} · {release.trackIds.length}{" "}
              {release.trackIds.length === 1 ? "song" : "songs"}
              <br />
              {release.language} · {release.region === "west" ? "the West" : "India"}
              <br />
              matrix MFL-{release.year}-{String(release.trackIds.length).padStart(2, "0")}
            </span>
          </span>
        </button>
      </div>

      <p className="text-ink/45 mt-4 font-mono text-[10px] tracking-[0.24em] uppercase">
        {open ? "· gatefold open ·" : "· open the gatefold ·"}
      </p>
    </div>
  );
}
