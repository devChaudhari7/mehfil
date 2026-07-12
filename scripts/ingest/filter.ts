/*
 * MEHFIL ingestion — keep/drop heuristics (brief §6.4).
 * Keep only embeddable, public, full songs; drop Shorts/clips and the usual
 * non-song noise (karaoke, trailers, jhankar/remix, interviews, jukeboxes) —
 * and, from the other end, anything movie-length (label channels upload full
 * films between the songs; a song is minutes, not hours).
 */
import type { RawVideo } from "./types";

/** Drop anything shorter than this (Shorts, clips, intros). */
const MIN_DURATION_SEC = 60;
/** Drop anything longer than this (full movies, episodes, compilations). */
const MAX_DURATION_SEC = 15 * 60;

const BAD_TITLE =
  /\b(karaoke|trailer|teaser|promo|interview|making|behind the scenes|jhankar|remix|mashup|cover\s+(version|song)|jukebox|shorts?|full (movie|film|episode)|hd movie|scene|dialogue)\b/i;

export function keepVideo(v: RawVideo): boolean {
  if (!v.embeddable) return false;
  if (v.privacyStatus !== "public") return false;
  if (v.durationSec > 0 && v.durationSec < MIN_DURATION_SEC) return false;
  if (v.durationSec > MAX_DURATION_SEC) return false;
  if (BAD_TITLE.test(v.title)) return false;
  return true;
}
