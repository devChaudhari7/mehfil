// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { MUTED_STORAGE_KEY, useSoundStore } from "./useSoundStore";

beforeEach(() => {
  localStorage.clear();
  useSoundStore.setState({ muted: false, unlocked: false, hydrated: false });
});

describe("useSoundStore", () => {
  it("hydrates muted state from localStorage", () => {
    localStorage.setItem(MUTED_STORAGE_KEY, "1");
    useSoundStore.getState().hydrate();
    expect(useSoundStore.getState().muted).toBe(true);
    expect(useSoundStore.getState().hydrated).toBe(true);
  });

  it("persists the mute toggle", () => {
    useSoundStore.getState().setMuted(true);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe("1");
    useSoundStore.getState().toggleMute();
    expect(useSoundStore.getState().muted).toBe(false);
    expect(localStorage.getItem(MUTED_STORAGE_KEY)).toBe("0");
  });

  it("unlock() flips the gesture flag once", () => {
    expect(useSoundStore.getState().unlocked).toBe(false);
    useSoundStore.getState().unlock();
    expect(useSoundStore.getState().unlocked).toBe(true);
  });
});
