import type { ReactNode } from "react";
import { GrainOverlay } from "@/components/GrainOverlay";
import { NeedleCursor } from "@/components/NeedleCursor";
import { PointerRoot } from "@/components/PointerRoot";
import { PlayerBar } from "@/components/player/PlayerBar";
import { NowPlayingOverlay } from "@/components/player/NowPlayingOverlay";
import { SearchPalette } from "@/components/search/SearchPalette";
import { GrooveTransitionRoot } from "@/lib/useGrooveTransition";

/*
 * World — the persistent stage every route lives inside. Lays the analog
 * texture stack (stage gradient → vignette → grain), all driven by the active
 * `[data-era]` tokens, then renders page content above it.
 *
 * The persistent player bar (brief §12) + the hidden YouTube host mount here, in
 * the root layout, so audio + transport state survive route changes (Phase 3).
 */
export function World({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="stage-bg" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <GrainOverlay />
      <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>

      {/*
       * Hidden YouTube host — id must match AUDIO_HOST_ID in
       * src/lib/audio/youtube.ts. Visually hidden but NOT display:none (that
       * breaks playback); kept here so the iframe persists across navigation.
       */}
      <div
        id="mehfil-audio-host"
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-[-9999px] h-px w-px opacity-0"
      />
      <PlayerBar />
      <NowPlayingOverlay />
      <SearchPalette />
      <GrooveTransitionRoot />

      {/* Phase 15 pointer system: lamp vars + magnets (PointerRoot) + the stylus
          cursor. Both no-op on coarse pointers / reduced motion. */}
      <PointerRoot />
      <NeedleCursor />
    </>
  );
}
