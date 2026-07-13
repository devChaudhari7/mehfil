import type { ReactNode } from "react";
import { GrainOverlay } from "@/components/GrainOverlay";
import { PointerRoot } from "@/components/PointerRoot";
import { StylusCursor } from "@/components/StylusCursor";
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

      {/* The pointer system (Phase 23): the cursor IS the stylus — a cartridge
          needle that sits exactly on the pointer (zero lag), turns to face its
          flight path, banks into corners, touches down on playables, and
          trembles with the playing track's tempo. Beneath it: the lamp, the
          magnets, the tilt surfaces. All no-op on coarse pointers / reduced
          motion (native cursor stands). */}
      <PointerRoot />
      <StylusCursor />
    </>
  );
}
