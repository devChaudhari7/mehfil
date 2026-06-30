/*
 * HeroIntro — the MEHFIL title card, rendered as the cinematic STAGE: a giant
 * wordmark that the central record eclipses (GrooveStage positions it behind the
 * disc). A SERVER component passed into the client GrooveStage so the markup is
 * never hydrated. Uses the preloaded Latin display family (Marcellus) → it is the
 * LCP element and paints immediately, with no native-script font on the critical
 * path. `.groove-display` morphs its letter-spacing per era (wide art-deco 50s →
 * tight 90s), so even the title tells the time.
 */
export function HeroIntro() {
  return (
    <h1
      className="groove-display font-display text-ink/45 leading-none whitespace-nowrap select-none"
      style={{ fontSize: "clamp(3rem, 12vw, 8.5rem)" }}
    >
      MEHFIL
    </h1>
  );
}
