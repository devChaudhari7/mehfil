/*
 * MEHFIL ingestion — keep/drop heuristics (brief §6.4).
 * Keep only embeddable, public, full songs; drop Shorts/clips and the usual
 * non-song noise (karaoke, trailers, jhankar/remix, interviews, jukeboxes).
 */
import type { RawVideo } from "./types";

/** Drop anything shorter than this (Shorts, clips, intros). */
const MIN_DURATION_SEC = 60;

const BAD_TITLE =
  /\b(karaoke|trailer|teaser|promo|interview|making|behind the scenes|jhankar|remix|mashup|cover\s+(version|song)|jukebox|shorts?)\b/i;

export function keepVideo(v: RawVideo): boolean {
  if (!v.embeddable) return false;
  if (v.privacyStatus !== "public") return false;
  if (v.durationSec > 0 && v.durationSec < MIN_DURATION_SEC) return false;
  if (BAD_TITLE.test(v.title)) return false;
  return true;
}
