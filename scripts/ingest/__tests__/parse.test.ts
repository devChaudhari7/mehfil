import { describe, expect, it } from "vitest";
import { dedupeKey, eraFromYear, normalize, parseTitle, slugify } from "../parse";

describe("parseTitle", () => {
  it("splits song | film (year) | artist", () => {
    expect(parseTitle("Lag Ja Gale | Woh Kaun Thi (1964) | Lata Mangeshkar")).toEqual({
      song: "Lag Ja Gale",
      film: "Woh Kaun Thi",
      year: 1964,
      artist: "Lata Mangeshkar",
    });
  });

  it("handles song | artist with no film/year", () => {
    expect(parseTitle("Lathe Di Chadar | Surinder Kaur")).toEqual({
      song: "Lathe Di Chadar",
      artist: "Surinder Kaur",
    });
  });

  it("strips trailing decorations from the song", () => {
    expect(parseTitle("Hotel California (Official Audio)")).toEqual({
      song: "Hotel California",
    });
  });

  it("falls back to ' - ' separator when there is no pipe", () => {
    expect(parseTitle("Dil Da Mamla - Gurdas Maan")).toEqual({
      song: "Dil Da Mamla",
      artist: "Gurdas Maan",
    });
  });

  it("respects the manual override map", () => {
    const overrides = { "Weird Raw Title": { song: "Clean Song", year: 1972 } };
    expect(parseTitle("Weird Raw Title", overrides)).toEqual({
      song: "Clean Song",
      year: 1972,
    });
  });
});

describe("normalize / dedupeKey / slugify", () => {
  it("folds case, diacritics, and punctuation", () => {
    expect(normalize("Lāthé  Di!! Chàdar")).toBe("lathedichadar");
  });

  it("produces a stable match key regardless of spacing/case", () => {
    expect(dedupeKey("Lag Ja Gale", "Lata Mangeshkar")).toBe(
      dedupeKey("lag  ja gale", "LATA mangeshkar"),
    );
  });

  it("slugifies to id-safe kebab-case", () => {
    expect(slugify("Aaja Re Pardesi")).toBe("aaja-re-pardesi");
  });
});

describe("eraFromYear", () => {
  it("maps a year to its catalog decade", () => {
    expect(eraFromYear(1964)).toBe("1960s");
    expect(eraFromYear(1959)).toBe("1950s");
    expect(eraFromYear(1990)).toBe("1990s");
  });

  it("accepts the modern decades (Phase 16: 1950s–2010s)", () => {
    expect(eraFromYear(2005)).toBe("2000s");
    expect(eraFromYear(2016)).toBe("2010s");
  });

  it("returns null outside the catalog's span", () => {
    expect(eraFromYear(1940)).toBeNull();
    expect(eraFromYear(Number.NaN)).toBeNull();
  });
});
