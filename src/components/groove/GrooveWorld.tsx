"use client";

/*
 * GrooveWorld — the one continuous vinyl world (Phase 13).
 *
 * The whole point: the user must stop perceiving pages. Home and /browse are not two
 * pages — they are two DEPTHS of a single scene that is mounted ONCE here (inside the
 * persistent World) and never unmounts while you travel the groove. The URL only nudges
 * a camera:
 *   /        → depth 0 — outside the record (the hero: MEHFIL + the big record + ENTER)
 *   /browse  → depth 1 — inside the grooves (the spiral)
 * Moving between them is a CSS camera dolly (groove.css `[data-depth]`): the record
 * scales up *through* the viewer and fades as the spiral grows from that same center —
 * you fly into the record. There is no remount, so there is no page to perceive.
 *
 * Structured routes (/catalog, /search, /album, …) are the calm "stepping out into the
 * library": GrooveWorld renders nothing (the page shows), and the surviving View-Transition
 * crossfade handles that hop.
 */
import { usePathname } from "next/navigation";
import { SpiralNavigator } from "@/components/browse";
import { GrooveStage } from "./GrooveStage";
import { HeroIntro } from "./HeroIntro";
import { HeroNav } from "./HeroNav";

function depthForPath(pathname: string): 0 | 1 | null {
  if (pathname === "/") return 0;
  if (pathname === "/browse") return 1;
  return null; // not a world route — the world recedes, the page renders
}

export function GrooveWorld() {
  const pathname = usePathname();
  const depth = depthForPath(pathname);
  if (depth === null) return null;

  return (
    <div
      className="groove-world fixed inset-0 z-[1] overflow-hidden"
      data-depth={depth}
      aria-label="The Groove"
    >
      {/* depth 0 — outside the record */}
      <div className="groove-world__hero" inert={depth !== 0}>
        <GrooveStage intro={<HeroIntro />} nav={<HeroNav />} active={depth === 0} />
      </div>

      {/* depth 1 — inside the grooves. Mounted alongside the hero (it is light DOM; the
          heavy canvas lives in the hero) so the camera can dolly between them. */}
      <div className="groove-world__spiral" inert={depth !== 1}>
        <div className="w-full max-w-2xl">
          <SpiralNavigator active={depth === 1} />
        </div>
      </div>
    </div>
  );
}
