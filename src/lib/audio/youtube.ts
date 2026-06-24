/*
 * MEHFIL — YouTubeProvider (brief §5, §6e).
 *
 * Wraps the IFrame Player API. The iframe is visually hidden (see #host in
 * World) and stripped of all chrome via playerVars — the user only ever sees
 * OUR analog player. All UI state is derived from player-state events; since the
 * IFrame API has no "timeupdate", we poll getCurrentTime() while playing.
 *
 * No autoplay: load() only CUEs the video; the store calls play() from within
 * the user's gesture. Embed-only — we never touch the media stream.
 */
import { createEmitter, type AudioProvider, type PlayableTrack } from "./types";

export const AUDIO_HOST_ID = "mehfil-audio-host";

type YtWindow = Window & {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
};

let apiPromise: Promise<typeof YT> | null = null;

/** Idempotent loader for the IFrame Player API; resolves the global `YT`. */
export function loadYouTubeIframeApi(): Promise<typeof YT> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube API unavailable on the server"));
  }
  const w = window as YtWindow;
  if (w.YT?.Player) return Promise.resolve(w.YT);
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<typeof YT>((resolve) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(w.YT as typeof YT);
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
  return apiPromise;
}

/** Find the persistent hidden host (World renders it); create a fallback if absent. */
function resolveHost(): HTMLElement {
  const existing = document.getElementById(AUDIO_HOST_ID);
  if (existing) return existing;
  const el = document.createElement("div");
  el.id = AUDIO_HOST_ID;
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    width: "1px",
    height: "1px",
    left: "-9999px",
    opacity: "0",
    pointerEvents: "none",
  });
  document.body.appendChild(el);
  return el;
}

export class YouTubeProvider implements AudioProvider {
  private readonly emitter = createEmitter();
  private player: YT.Player | null = null;
  private creating: Promise<void> | null = null;
  private timer: number | null = null;
  private volume = 1;

  async load(track: PlayableTrack): Promise<void> {
    if (!track.sourceId) {
      this.emitter.emit("error", "missing sourceId");
      return;
    }
    const api = await loadYouTubeIframeApi();
    if (!this.player) {
      await this.createPlayer(api, track.sourceId);
    } else {
      this.player.cueVideoById(track.sourceId);
    }
  }

  private createPlayer(api: typeof YT, videoId: string): Promise<void> {
    if (this.creating) return this.creating;
    this.creating = new Promise<void>((resolve) => {
      this.player = new api.Player(resolveHost(), {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: () => {
            this.player?.setVolume(Math.round(this.volume * 100));
            this.emitter.emit("ready", this.getDuration());
            resolve();
          },
          onStateChange: (e) => this.onState(e.data),
          onError: (e) => this.emitter.emit("error", e.data),
        },
      });
    });
    return this.creating;
  }

  private onState(state: number): void {
    switch (state) {
      case YT.PlayerState.PLAYING:
        this.emitter.emit("ready", this.getDuration());
        this.emitter.emit("play");
        this.startTicking();
        break;
      case YT.PlayerState.PAUSED:
        this.stopTicking();
        this.emitter.emit("pause");
        break;
      case YT.PlayerState.ENDED:
        this.stopTicking();
        this.emitter.emit("ended");
        break;
      default:
        break;
    }
  }

  private startTicking(): void {
    if (this.timer !== null) return;
    this.timer = window.setInterval(() => {
      this.emitter.emit("timeupdate", this.getCurrentTime());
    }, 250);
  }

  private stopTicking(): void {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  play(): void {
    this.player?.playVideo();
  }

  pause(): void {
    this.player?.pauseVideo();
  }

  seek(seconds: number): void {
    this.player?.seekTo(seconds, true);
    this.emitter.emit("timeupdate", seconds);
  }

  getCurrentTime(): number {
    return this.player?.getCurrentTime() ?? 0;
  }

  getDuration(): number {
    return this.player?.getDuration() ?? 0;
  }

  setVolume(volume: number): void {
    this.volume = Math.min(Math.max(volume, 0), 1);
    this.player?.setVolume(Math.round(this.volume * 100));
  }

  on(event: Parameters<AudioProvider["on"]>[0], cb: Parameters<AudioProvider["on"]>[1]): void {
    this.emitter.on(event, cb);
  }

  off(event: Parameters<AudioProvider["off"]>[0], cb: Parameters<AudioProvider["off"]>[1]): void {
    this.emitter.off(event, cb);
  }

  destroy(): void {
    this.stopTicking();
    this.emitter.clear();
    this.player?.destroy();
    this.player = null;
    this.creating = null;
  }
}
