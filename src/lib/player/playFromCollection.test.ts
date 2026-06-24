// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Keep Howler/WebAudio out of the test: stub the SFX layer the play path touches.
vi.mock("@/lib/sound/sfx", () => ({
  playNeedleDrop: vi.fn(),
  unlockAudio: vi.fn(),
  applyMuted: vi.fn(),
}));

import type { Track } from "@/lib/catalog";
import { createEmitter, type AudioProvider, type PlayableTrack } from "@/lib/audio";
import { __playerTest, usePlayerStore } from "./usePlayerStore";
import { canPlay, effective, playableQueue, playFromCollection } from "./playFromCollection";

class FakeProvider implements AudioProvider {
  private em = createEmitter();
  loaded: PlayableTrack | null = null;
  async load(t: PlayableTrack) {
    this.loaded = t;
    this.em.emit("ready", 180);
  }
  play() {
    this.em.emit("play");
  }
  pause() {
    this.em.emit("pause");
  }
  seek() {}
  getCurrentTime() {
    return 0;
  }
  getDuration() {
    return 180;
  }
  setVolume() {}
  on(...a: Parameters<AudioProvider["on"]>) {
    this.em.on(...a);
  }
  off(...a: Parameters<AudioProvider["off"]>) {
    this.em.off(...a);
  }
  destroy() {
    this.em.clear();
  }
}

function track(over: Partial<Track>): Track {
  return {
    id: "t",
    title: { native: "T", latin: "T" },
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
    sourceId: "",
    provenance: { channelId: "", label: "", embeddable: null },
    ...over,
  };
}

const playable = (id: string) =>
  track({ id, sourceId: `vid-${id}`, provenance: { channelId: "c", label: "L", embeddable: true } });

const flush = () => new Promise((r) => setTimeout(r, 0));
let fake: FakeProvider;

beforeEach(() => {
  __playerTest.reset();
  fake = new FakeProvider();
  __playerTest.setProviderFactory(() => fake);
});
afterEach(() => __playerTest.reset());

describe("demo overlay (effective / canPlay)", () => {
  it("overlays a real source onto a known demo seed id and leaves others unresolved", () => {
    // 'take-on-me-1985' is in the dev demo map; a plain seed id is not.
    expect(canPlay(track({ id: "take-on-me-1985" }))).toBe(true);
    expect(effective(track({ id: "take-on-me-1985" })).sourceId).not.toBe("");
    expect(canPlay(track({ id: "lag-ja-gale-1964" }))).toBe(false);
  });
});

describe("playableQueue", () => {
  it("keeps only playable members", () => {
    const q = playableQueue([track({ id: "a" }), playable("b"), playable("c")]);
    expect(q.map((t) => t.id)).toEqual(["b", "c"]);
  });
});

describe("playFromCollection", () => {
  it("queues the playable members and plays the chosen track", async () => {
    const collection = [track({ id: "a" }), playable("b"), playable("c")];
    playFromCollection(collection, collection[2]!);
    await flush();

    const st = usePlayerStore.getState();
    expect(st.queue.map((t) => t.id)).toEqual(["b", "c"]); // unplayable 'a' dropped
    expect(st.currentTrack?.id).toBe("c");
    expect(st.status).toBe("playing");
  });

  it("is a no-op when the chosen track isn't playable", async () => {
    const collection = [track({ id: "a" }), playable("b")];
    playFromCollection(collection, collection[0]!); // 'a' is unplayable
    await flush();
    expect(usePlayerStore.getState().status).toBe("idle");
  });
});
