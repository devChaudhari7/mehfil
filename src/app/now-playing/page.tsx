import type { Metadata } from "next";
import { NowPlayingDeck } from "@/components/player/NowPlayingDeck";

/*
 * /now-playing — the full-screen cassette deck as a routable, shareable page
 * (brief §12). Renders the same NowPlayingDeck the player-bar overlay uses; reads
 * the persistent player store, so it reflects whatever is currently playing.
 */
export const metadata: Metadata = {
  title: "Now Playing — MEHFIL",
};

export default function NowPlayingPage() {
  return (
    <main className="flex min-h-dvh flex-col">
      <NowPlayingDeck backHref="/" />
    </main>
  );
}
