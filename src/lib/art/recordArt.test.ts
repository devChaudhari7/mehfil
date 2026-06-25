import { describe, expect, it } from "vitest";
import type { EraId } from "@/lib/eras";
import { buildArtSpec, familyForEra } from "./recordArt";

const base = { seedKey: "lag-ja-gale-1964|Woh Kaun Thi|1964", eraId: "50s" as EraId, year: 1964 };

describe("buildArtSpec", () => {
  it("is fully deterministic for the same input", () => {
    expect(buildArtSpec(base)).toEqual(buildArtSpec(base));
  });

  it("produces different specs for different seeds", () => {
    const a = buildArtSpec(base);
    const b = buildArtSpec({ ...base, seedKey: "mehbooba-1975|Sholay|1975" });
    // At least the catalog number (seed-stamped) must differ.
    expect(a.catalogNo).not.toBe(b.catalogNo);
  });

  it("maps each era to its motif family", () => {
    const map: Record<EraId, string> = {
      "50s": "deco",
      "60s": "modern",
      "70s": "psych",
      "80s": "neon",
      "90s": "chrome",
    };
    for (const era of Object.keys(map) as EraId[]) {
      expect(familyForEra(era)).toBe(map[era]);
      expect(buildArtSpec({ ...base, eraId: era }).family).toBe(map[era]);
    }
  });

  it("stamps a well-formed catalog number carrying the year", () => {
    const spec = buildArtSpec({ ...base, year: 1980 });
    expect(spec.catalogNo).toMatch(/^MFL-1980-\d{3}$/);
  });

  it("only ever uses CSS-var color roles (no raw hex)", () => {
    const s = buildArtSpec(base);
    const colors = [
      s.roles.field,
      s.roles.field2,
      s.roles.motif,
      s.roles.motifAlt,
      s.roles.highlight,
      s.plate.fill,
      s.plate.ink,
    ];
    for (const c of colors) expect(c).toMatch(/^var\(--[a-z0-9-]+\)$/);
  });

  it("keeps title position and plate within the known safe sets", () => {
    const positions = new Set<string>();
    const plates = new Set<string>();
    for (let i = 0; i < 60; i++) {
      const s = buildArtSpec({ ...base, seedKey: `seed-${i}` });
      expect(["top", "center", "bottom"]).toContain(s.titlePos);
      expect(["var(--btn)", "var(--s1)", "var(--s2)"]).toContain(s.plate.fill);
      positions.add(s.titlePos);
      plates.add(s.plate.fill);
    }
    // A wall of records should vary, not collapse to one layout.
    expect(positions.size).toBeGreaterThan(1);
    expect(plates.size).toBeGreaterThan(1);
  });

  it("keeps numeric params within their declared bounds", () => {
    for (let i = 0; i < 40; i++) {
      const p = buildArtSpec({ ...base, seedKey: `p-${i}` }).params;
      expect(p.rings).toBeGreaterThanOrEqual(4);
      expect(p.rings).toBeLessThanOrEqual(9);
      expect(p.rays).toBeGreaterThanOrEqual(9);
      expect(p.rays).toBeLessThanOrEqual(18);
      expect(p.originX).toBeGreaterThanOrEqual(0.3);
      expect(p.originX).toBeLessThan(0.7);
      expect(p.rotate).toBeGreaterThanOrEqual(-12);
      expect(p.rotate).toBeLessThanOrEqual(12);
    }
  });
});
