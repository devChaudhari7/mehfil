/*
 * MEHFIL — SpotifyProvider stub (brief §5).
 * Implements AudioProvider so the source is swappable. Full playback needs the
 * Web Playback SDK + Premium (30s previews otherwise) — wired in a later phase.
 */
import { createEmitter, type AudioProvider } from "./types";

export class SpotifyProvider implements AudioProvider {
  private readonly emitter = createEmitter();

  async load(): Promise<void> {
    this.emitter.emit("error", "SpotifyProvider not implemented");
  }
  play(): void {}
  pause(): void {}
  seek(): void {}
  getCurrentTime(): number {
    return 0;
  }
  getDuration(): number {
    return 0;
  }
  setVolume(): void {}
  on(event: Parameters<AudioProvider["on"]>[0], cb: Parameters<AudioProvider["on"]>[1]): void {
    this.emitter.on(event, cb);
  }
  off(event: Parameters<AudioProvider["off"]>[0], cb: Parameters<AudioProvider["off"]>[1]): void {
    this.emitter.off(event, cb);
  }
  destroy(): void {
    this.emitter.clear();
  }
}
