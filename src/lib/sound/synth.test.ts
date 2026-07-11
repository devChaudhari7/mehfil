import { describe, expect, it } from "vitest";
import { DRONE_PATCHES } from "./synth";
import { ERAS } from "@/lib/eras";

describe("DRONE_PATCHES", () => {
  it("covers every era", () => {
    for (const era of ERAS) expect(DRONE_PATCHES[era.id]).toBeDefined();
  });

  it("stays whisper-quiet and physically sane", () => {
    for (const patch of Object.values(DRONE_PATCHES)) {
      expect(patch.level).toBeGreaterThan(0);
      expect(patch.level).toBeLessThanOrEqual(0.08); // a score, never a track
      expect(patch.cutoff).toBeGreaterThan(100);
      expect(patch.voices.length).toBeGreaterThan(0);
      for (const v of patch.voices) {
        expect(v.freq).toBeGreaterThan(20); // audible fundamentals only
        expect(v.freq).toBeLessThan(2000);
        expect(v.gain).toBeGreaterThan(0);
        expect(v.gain).toBeLessThanOrEqual(1);
        expect(v.lfoRate).toBeLessThan(0.5); // breaths, not tremolo
        expect(v.lfoDepth).toBeGreaterThanOrEqual(0);
        expect(v.lfoDepth).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps the tanpura eras on the Sa–Pa–Sa′ frame (1 · 3/2 · 2)", () => {
    for (const era of ["50s", "60s", "70s"] as const) {
      const freqs = DRONE_PATCHES[era].voices.map((v) => v.freq);
      expect(freqs).toContain(110);
      expect(freqs).toContain(165);
      expect(freqs).toContain(220);
    }
  });
});
