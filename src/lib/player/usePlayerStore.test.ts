// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Track } from "@/lib/catalog";
import { createEmitter, type AudioProvider, type PlayableTrack } from "@/lib/audio";
import { __playerTest, usePlayerStore } from "./usePlayerStore";

/** Minimal in-memory provider that drives the store via the real event names. */
class FakeProvider implements AudioProvider {
  private em = createEmitter();
  loaded: PlayableTrack | null = null;
  playing = false;
  time = 0;
  duration = 180;
  volume = 1;

  async load(track: PlayableTrack) {
    this.loaded = track;
    this.em.emit("ready", this.duration);
  }
  play() {
    this.playing = true;
    this.em.emit("play");
  }
  pause() {
    this.playing = false;
    this.em.emit("pause");
  }
  seek(seconds: number) {
    this.time = seconds;
    this.em.emit("timeupdate", seconds);
  }
  getCurrentTime() {
    return this.time;
  }
  getDuration() {
    return this.duration;
  }
  setVolume(v: number) {
    this.volume = v;
  }
  on(...args: Parameters<AudioProvider["on"]>) {
    this.em.on(...args);
  }
  off(...args: Parameters<AudioProvider["off"]>) {
    this.em.off(...args);
  }
  destroy() {
    this.em.clear();
  }
  /** test helper */
  endTrack() {
    this.playing = false;
    this.em.emit("ended");
  }
}

function track(id: string): Track {
  return {
    id,
    title: { native: id, latin: id },
    script: "latin",
    artists: [],
    film: null,
    albumId: null,
    year: 1975,
    era: "1970s",
    language: "english",
    region: "west",
    durationSec: 180,
    moods: [],
    genres: [],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "night",
    cover: "",
    source: "youtube",
    sourceId: `vid-${id}`,
    provenance: { channelId: "c", label: "L", embeddable: true },
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));
let fake: FakeProvider;

beforeEach(() => {
  __playerTest.reset();
  fake = new FakeProvider();
  __playerTest.setProviderFactory(() => fake);
});

afterEach(() => {
  __playerTest.reset();
});

describe("usePlayerStore", () => {
  it("loads and plays a queued track", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a"), track("b"), track("c")]);
    s.playQueueAt(0);
    await flush();

    const st = usePlayerStore.getState();
    expect(st.status).toBe("playing");
    expect(st.currentTrack?.id).toBe("a");
    expect(st.index).toBe(0);
    expect(st.duration).toBe(180);
    expect(fake.loaded?.id).toBe("a");
  });

  it("advances with next() and stops (ended) past the last track", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a"), track("b")]);
    s.playQueueAt(0);
    await flush();

    usePlayerStore.getState().next();
    await flush();
    expect(usePlayerStore.getState().index).toBe(1);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("b");

    usePlayerStore.getState().next();
    await flush();
    expect(usePlayerStore.getState().status).toBe("ended");
    expect(usePlayerStore.getState().index).toBe(1);
  });

  it("auto-advances when the provider emits 'ended'", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a"), track("b")]);
    s.playQueueAt(0);
    await flush();

    fake.endTrack();
    await flush();
    expect(usePlayerStore.getState().index).toBe(1);
    expect(usePlayerStore.getState().currentTrack?.id).toBe("b");
  });

  it("prev() goes back when early but restarts when >3s in", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a"), track("b"), track("c")]);
    s.playQueueAt(1);
    await flush();

    usePlayerStore.getState().prev();
    await flush();
    expect(usePlayerStore.getState().index).toBe(0);

    // now >3s into track 0 → prev restarts instead of going back
    usePlayerStore.setState({ currentTime: 5 });
    usePlayerStore.getState().prev();
    await flush();
    expect(usePlayerStore.getState().index).toBe(0);
    expect(fake.time).toBe(0);
  });

  it("togglePlay pauses then resumes", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a")]);
    s.playQueueAt(0);
    await flush();
    expect(usePlayerStore.getState().status).toBe("playing");

    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().status).toBe("paused");

    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().status).toBe("playing");
  });

  it("seek updates time and forwards to the provider", async () => {
    const s = usePlayerStore.getState();
    s.setQueue([track("a")]);
    s.playQueueAt(0);
    await flush();

    usePlayerStore.getState().seek(42);
    expect(fake.time).toBe(42);
    expect(usePlayerStore.getState().currentTime).toBe(42);
  });
});
