/*
 * MEHFIL ingestion — offline fixtures simulating YouTube Data API v3 responses.
 *
 * Keyed by the REAL source channelIds from sources.ts so a dry-run exercises the
 * exact registry the live run uses. Every *video* id is prefixed FIXTURE_ so a
 * fake id can never be mistaken for a resolved one (the live writer refuses to
 * persist any FIXTURE_ id). channelIds are real — only video ids are synthetic.
 *
 * Coverage: resolves seed tracks across Hindi/Bengali/Punjabi (Saregama),
 * appends two Hindi discoveries (Shemaroo), and includes a karaoke / a
 * non-embeddable / a Short to exercise the filter.
 */
import type { YtVideoItem } from "../types";

interface FixtureChannel {
  uploads: string;
  items: YtVideoItem[];
}

function video(
  id: string,
  title: string,
  channelId: string,
  channelTitle: string,
  duration: string,
  opts: { embeddable?: boolean; privacyStatus?: string; viewCount?: number } = {},
): YtVideoItem {
  return {
    id,
    snippet: {
      title,
      channelId,
      channelTitle,
      publishedAt: "2015-01-01T00:00:00Z",
      thumbnails: {
        default: { url: `https://i.ytimg.com/vi/${id}/default.jpg` },
        high: { url: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` },
      },
    },
    contentDetails: { duration },
    status: {
      embeddable: opts.embeddable ?? true,
      privacyStatus: opts.privacyStatus ?? "public",
    },
    statistics: { viewCount: String(opts.viewCount ?? 1_000_000) },
  };
}

const SAREGAMA = "UC_A7K2dXFsTMAciGmnNxy-Q";
const SHEMAROO = "UCP6uH_XlsxrXwZQ4DlqbqPg";

export const FIXTURES: Record<string, FixtureChannel> = {
  [SAREGAMA]: {
    uploads: "FIXTURE_UPLOADS_SAREGAMA",
    items: [
      video(
        "FIXTURE_LAGJAGALE",
        "Lag Ja Gale | Woh Kaun Thi (1964) | Lata Mangeshkar",
        SAREGAMA,
        "Saregama Music",
        "PT4M2S",
        { viewCount: 42_000_000 },
      ),
      video(
        "FIXTURE_PYARHUA",
        "Pyar Hua Ikrar Hua | Shree 420 (1955) | Manna Dey",
        SAREGAMA,
        "Saregama Music",
        "PT3M50S",
        { viewCount: 9_000_000 },
      ),
      video(
        "FIXTURE_TUMIJEAMAR",
        "Tumi Je Amar | Harano Sur (1957) | Hemanta Mukherjee",
        SAREGAMA,
        "Saregama Music",
        "PT3M20S",
        { viewCount: 5_000_000 },
      ),
      video(
        "FIXTURE_LATHEDICHADAR",
        "Lathe Di Chadar | Surinder Kaur",
        SAREGAMA,
        "Saregama Music",
        "PT4M10S",
        { viewCount: 3_000_000 },
      ),
      // Dropped by filter (karaoke):
      video(
        "FIXTURE_KARAOKE",
        "Lag Ja Gale (Karaoke Version) | Saregama",
        SAREGAMA,
        "Saregama Music",
        "PT4M0S",
        { viewCount: 120_000 },
      ),
      // Dropped by filter (non-embeddable) — leaves its seed unresolved:
      video(
        "FIXTURE_NONEMBED",
        "Aap Ki Nazron Ne Samjha | Anpadh (1962) | Lata Mangeshkar",
        SAREGAMA,
        "Saregama Music",
        "PT5M0S",
        { embeddable: false, viewCount: 7_000_000 },
      ),
    ],
  },
  [SHEMAROO]: {
    uploads: "FIXTURE_UPLOADS_SHEMAROO",
    items: [
      // New discoveries (not in seed) → appended:
      video(
        "FIXTURE_AAJAREPARDESI",
        "Aaja Re Pardesi | Madhumati (1958) | Lata Mangeshkar",
        SHEMAROO,
        "Shemaroo Filmi Gaane",
        "PT3M55S",
        { viewCount: 4_000_000 },
      ),
      video(
        "FIXTURE_AAOTWIST",
        "Aao Twist Karein | Bhoot Bungla (1965) | Mohammed Rafi",
        SHEMAROO,
        "Shemaroo Filmi Gaane",
        "PT3M12S",
        { viewCount: 2_000_000 },
      ),
      // Dropped by filter (Short):
      video(
        "FIXTURE_SHORT",
        "Mehbooba Mehbooba #shorts",
        SHEMAROO,
        "Shemaroo Filmi Gaane",
        "PT0M45S",
        { viewCount: 900 },
      ),
    ],
  },
};
