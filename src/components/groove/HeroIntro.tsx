/*
 * HeroIntro — the static hero header (kicker / wordmark / tagline). A SERVER
 * component passed into the client GrooveStage, so this markup renders on the
 * server and never lands in the hero's client hydration chunk (perf). The wordmark
 * is the preloaded Latin display family, so it paints immediately.
 */
export function HeroIntro() {
  return (
    <>
      <p className="text-accent font-mono text-[11px] tracking-[0.32em] uppercase">
        The medium is the map
      </p>
      <h1 className="groove-display font-display text-ink mt-3 text-3xl sm:text-5xl">MEHFIL</h1>
      <p className="text-ink/70 mt-2 font-body text-sm">
        Don&rsquo;t scroll the library. Travel the groove.
      </p>
    </>
  );
}
