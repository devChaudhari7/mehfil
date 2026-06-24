import { describe, expect, it } from "vitest";
import { pickTier, type TierInputs } from "./useRenderTier";

const base: TierInputs = {
  reducedMotion: false,
  webgl2: true,
  saveData: false,
  deviceMemory: 8,
  cores: 8,
  finePointer: true,
};

describe("pickTier", () => {
  it("returns C for reduced motion or data-saver", () => {
    expect(pickTier({ ...base, reducedMotion: true })).toBe("C");
    expect(pickTier({ ...base, saveData: true })).toBe("C");
  });

  it("returns A for a capable fine-pointer device", () => {
    expect(pickTier(base)).toBe("A");
  });

  it("falls back to B without webgl2 or on a low-end device", () => {
    expect(pickTier({ ...base, webgl2: false })).toBe("B");
    expect(pickTier({ ...base, deviceMemory: 2 })).toBe("B");
    expect(pickTier({ ...base, cores: 2 })).toBe("B");
  });

  it("falls back to B on a coarse pointer (phones/tablets) — no heavy WebGL", () => {
    expect(pickTier({ ...base, finePointer: false })).toBe("B");
  });
});
