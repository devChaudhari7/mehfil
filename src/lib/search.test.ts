import { describe, expect, it } from "vitest";
import { catalogRepository, filmReleases, type Artist, type Track } from "@/lib/catalog";
import { buildIndex, fold, levenshtein, searchCatalog } from "./search";

function track(over: Partial<Track>): Track {
  return {
    id: "t",
    title: { native: "T", latin: "T" },
    script: "latin",
    artists: [],
    film: null,
    albumId: null,
    year: 1965,
    era: "1960s",
    language: "hindi",
    region: "india",
    durationSec: null,
    moods: [],
    genres: [],
    raga: null,
    tempoBucket: "mid",
    timeOfDay: "day",
    cover: "",
    source: "youtube",
    sourceId: "",
    provenance: { channelId: "", label: "", embeddable: null },
    ...over,
  };
}

describe("fold", () => {
  it("folds Latin accents + punctuation but preserves Indic letters and vowel signs", () => {
    expect(fold("Café Society")).toBe("cafe society");
    expect(fold("R.D. Burman")).toBe("r d burman");
    expect(fold("  Lag Ja Gale!  ")).toBe("lag ja gale");
    expect(fold("गले")).toBe("गले"); // vowel sign े (U+0947) survives
    expect(fold("লগ জা")).toBe("লগ জা");
  });
});

describe("levenshtein (bounded)", () => {
  it("counts edits and early-outs past max", () => {
    expect(levenshtein("gale", "gle", 1)).toBe(1);
    expect(levenshtein("abc", "abc", 1)).toBe(0);
    expect(levenshtein("abc", "xyz", 1)).toBeGreaterThan(1); // max+1
  });
});

describe("ranking", () => {
  it("ranks an exact prefix above a mid-string match", () => {
    const idx = buildIndex(
      [
        track({ id: "mid", title: { native: "Gale Lag Ja", latin: "Gale Lag Ja" } }),
        track({ id: "prefix", title: { native: "Lag Ja Gale", latin: "Lag Ja Gale" } }),
      ],
      [],
      [],
    );
    const top = searchCatalog(idx, "lag").tracks;
    expect(top[0]!.id).toBe("prefix");
    expect(top.map((r) => r.id)).toContain("mid");
  });

  it("returns nothing for an empty query", () => {
    const idx = buildIndex([track({ id: "a" })], [], []);
    expect(searchCatalog(idx, "   ").tracks).toHaveLength(0);
  });
});

describe("catalog search (real data)", () => {
  const tracks = catalogRepository.allTracks();
  const artists = catalogRepository.allArtists();
  const index = buildIndex(tracks, artists, filmReleases(tracks));
  const trackIds = (q: string) => searchCatalog(index, q).tracks.map((r) => r.id);

  it("matches a romanized query against title.latin", () => {
    expect(trackIds("lag ja gale")).toContain("lag-ja-gale-1964");
  });

  it("matches native-script queries (Devanagari / Bengali / Gurmukhi)", () => {
    expect(trackIds("लग जा")).toContain("lag-ja-gale-1964");
    expect(trackIds("তুমি")).toContain("tumi-je-amar-1957");
    expect(trackIds("ਲੱਠੇ")).toContain("lathe-di-chadar");
  });

  it("tolerates a transliteration typo (fuzzy)", () => {
    expect(trackIds("lag ja gle")).toContain("lag-ja-gale-1964");
  });

  it("matches artists and films-as-albums", () => {
    const r = searchCatalog(index, "lata");
    expect(r.artists.map((a) => a.id)).toContain("lata-mangeshkar");
    const wkt = searchCatalog(index, "woh kaun");
    expect(wkt.albums.map((a) => a.release.film)).toContain("Woh Kaun Thi?");
  });

  it("returns non-playable tracks too (display is ungated)", () => {
    const top = searchCatalog(index, "lag ja gale").tracks;
    expect(top.length).toBeGreaterThan(0);
    expect(top[0]!.track.sourceId).toBe(""); // seed is unresolved yet still returned
  });
});

describe("buildIndex artist resolution", () => {
  it("lets a track be found by its artist's name", () => {
    const artist: Artist = {
      id: "kishore",
      name: { native: "किशोर कुमार", latin: "Kishore Kumar" },
      language: "hindi",
      region: "india",
      era: "1970s",
      bio: "",
    };
    const idx = buildIndex(
      [track({ id: "song", title: { native: "X", latin: "X" }, artists: ["kishore"] })],
      [artist],
      [],
    );
    expect(searchCatalog(idx, "kishore").tracks.map((r) => r.id)).toContain("song");
  });
});
