/*
 * HeroIntro — the MEHFIL wordmark, rendered CLEARLY (not eclipsed behind the disc — that
 * hid the middle letters so the name never read). The preloaded Marcellus display family →
 * it's the LCP element and paints immediately. `.groove-display` morphs its letter-spacing
 * per era (wide art-deco 50s → tight 90s), so the title itself tells the time.
 */
export function HeroIntro() {
  return (
    <h1
      className="groove-display font-display text-ink leading-none select-none"
      style={{ fontSize: "clamp(2.6rem, 7vw, 5.5rem)" }}
    >
      MEHFIL
    </h1>
  );
}
