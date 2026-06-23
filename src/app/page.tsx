import { ERAS } from "@/lib/eras";
import { scriptFont } from "@/lib/fonts";

/*
 * Phase 0 boot proof. Quiet and disciplined (the bold groove hero is Phase 4).
 * Verifies the Definition of done: tokens + fonts render across all four scripts,
 * the per-era token cascade works (each card sets its own [data-era]), and the
 * grain layer is alive (and freezes under prefers-reduced-motion).
 */
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <header className="max-w-2xl">
        <p className="text-accent font-mono text-xs tracking-[0.32em] uppercase">
          Mehfil · Phase 0 — Scaffold &amp; Tokens
        </p>
        <h1 className="font-display text-ink mt-5 text-4xl leading-[1.05] sm:text-6xl">
          Don&rsquo;t scroll the library.
          <br />
          Travel the groove.
        </h1>
        <p className="font-body text-ink/80 mt-5 text-base leading-relaxed">
          A retro listening experience for golden-age Indian (Hindi · Punjabi · Bengali)
          and classic Western records. Each card below renders a different era&rsquo;s
          token set — <span className="text-accent">the medium is the map</span> — in its
          own native script.
        </p>
      </header>

      <section
        aria-label="Era token and multilingual type specimen"
        className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {ERAS.map((era) => {
          const native = scriptFont(era.seed.script);
          return (
            <article
              key={era.id}
              data-era={era.id}
              className="relative overflow-hidden rounded-[20px] border border-white/10 p-6"
              style={{
                background:
                  "radial-gradient(125% 120% at 50% 18%, var(--s1) 0%, var(--s2) 78%, #050507 100%)",
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="bg-glow inline-block h-[7px] w-[7px] rounded-full"
                  style={{ boxShadow: "0 0 9px var(--glow)" }}
                  aria-hidden="true"
                />
                <span className="text-ink rounded-full border border-white/15 px-2.5 py-1 font-mono text-[11px] tracking-[0.12em]">
                  {era.mediumLabel}
                </span>
                <span className="text-accent ml-auto font-mono text-[11px] tracking-[0.14em]">
                  {era.rpm}
                </span>
              </div>

              <p className={`${native.display} text-ink mt-8 text-4xl leading-tight`}>
                {era.seed.native}
              </p>
              <p className="font-display text-ink/90 mt-1 text-lg tracking-wide">
                {era.seed.latin}
              </p>
              <p className="text-ink/60 mt-3 font-mono text-[11px] tracking-[0.14em] uppercase">
                {era.seed.who}
              </p>

              <p className="text-accent-2 mt-6 font-mono text-[10px] tracking-[0.2em] uppercase">
                {era.decade} · {era.soundTexture}
              </p>
            </article>
          );
        })}
      </section>

      <footer className="text-ink/55 mt-16 max-w-2xl border-t border-white/10 pt-6 font-mono text-[11px] leading-relaxed">
        Devanagari · Gurmukhi · Bengali · Latin — loaded on demand. Animated film grain
        overlays the stage and freezes under{" "}
        <code className="text-ink/80">prefers-reduced-motion</code>. Tokens shift via{" "}
        <code className="text-ink/80">[data-era]</code>; the full groove hero arrives in
        Phase 4.
      </footer>
    </main>
  );
}
