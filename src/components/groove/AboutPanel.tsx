"use client";

/*
 * AboutPanel — the colophon (Phase 14). The closing frame of the cinematic journey: after
 * you've traveled the eras and dropped the needle, the last stretch of scroll fades the
 * world into "Side B" — a short love-letter, the credit + portfolio link, and a way to
 * travel again. Driven by --gp-about (set by GrooveWorld); covers the spiral as it rises.
 */
export function AboutPanel() {
  return (
    <div className="groove-world__about">
      <div className="flex max-w-lg flex-col items-center gap-5 px-6 text-center">
        <span className="text-accent font-mono text-[11px] tracking-[0.34em] uppercase">
          Side B · the colophon
        </span>
        <h2 className="groove-display font-display text-ink text-5xl sm:text-6xl">MEHFIL</h2>
        <p className="font-display text-ink/90 text-xl leading-snug">
          Don&rsquo;t scroll the library. Travel the groove.
        </p>
        <p className="text-ink/60 font-body text-sm leading-relaxed">
          A love letter to recorded sound — golden-age Hindi, Punjabi &amp; Bengali, and Western
          retro — rendered with analog warmth and modern web craft. Every sleeve is generated;
          every track an official embed. The medium is the map.
        </p>
        <a
          href="https://dc-taupe.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="bg-btn text-btn-ink mt-1 rounded-full px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[1px]"
        >
          Designed &amp; built by Dev Chaudhari ↗
        </a>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-ink/45 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
        >
          ↑ Travel the groove again
        </button>
      </div>
    </div>
  );
}
