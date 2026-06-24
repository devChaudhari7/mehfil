import { describe, expect, it } from "vitest";
import rawCatalog from "@/data/catalog.json";
import { assertCatalogShape } from "@/lib/catalog/types";
import { serializeCatalog } from "../serialize";

describe("serializeCatalog", () => {
  it("round-trips: parsing the output deep-equals the input", () => {
    const data: unknown = rawCatalog;
    assertCatalogShape(data);
    expect(JSON.parse(serializeCatalog(data))).toEqual(data);
  });

  it("emits one compact line per record (reviewable diffs)", () => {
    const data: unknown = rawCatalog;
    assertCatalogShape(data);
    const text = serializeCatalog(data);
    expect(text).toContain('  "tracks": [');
    const recordLines = text.split("\n").filter((l) => l.startsWith("    {"));
    expect(recordLines.length).toBe(data.artists.length + data.tracks.length);
  });
});
