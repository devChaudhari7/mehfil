/*
 * MEHFIL — LocalProvider stub (brief §5).
 * For royalty-free / public-domain tracks via an <audio> element. Implements
 * AudioProvider so the source is swappable; fleshed out in a later phase (this
 * is also where true Web-Audio FFT is allowed, unlike the cross-origin embed).
 */
import { createEmitter, type AudioProvider } from "./types";

export class LocalProvider implements AudioProvider {
  private readonly emitter = createEmitter();

  async load(): Promise<void> {
    this.emitter.emit("error", "LocalProvider not implemented");
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
