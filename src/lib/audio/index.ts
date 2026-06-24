/*
 * MEHFIL — audio abstraction barrel + provider factory.
 * The player store imports from here; it never imports a concrete provider
 * directly, keeping the source swappable (brief §5).
 */
import type { AudioSource } from "@/lib/catalog";
import type { AudioProvider } from "./types";
import { YouTubeProvider } from "./youtube";
import { SpotifyProvider } from "./spotify";
import { LocalProvider } from "./local";

export function getAudioProvider(source: AudioSource): AudioProvider {
  switch (source) {
    case "youtube":
      return new YouTubeProvider();
    case "spotify":
      return new SpotifyProvider();
    case "local":
      return new LocalProvider();
  }
}

export * from "./types";
export { YouTubeProvider, AUDIO_HOST_ID } from "./youtube";
export { getDemoTracks } from "./demoTracks";
