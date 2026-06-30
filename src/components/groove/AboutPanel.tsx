"use client";

/*
 * AboutPanel — the colophon (Phase 14). The closing frame of the cinematic journey: after
 * you've traveled the eras and dropped the needle, the last stretch of scroll fades the
 * world into "Side B" — a love-letter, the credit + portfolio link, and a way to travel
 * again. Driven by --gp-about (set by GrooveWorld); covers the spiral as it rises.
 */
export function AboutPanel() {
  return (
    <div className="groove-world__about">
      <div className="flex max-w-xl flex-col items-center gap-6 px-6 text-center">
        <span className="text-accent/70 font-mono text-[11px] tracking-[0.4em] uppercase">
          Fin · Side B
        </span>

        <h2
          className="groove-display font-display text-ink leading-none"
          style={{ fontSize: "clamp(3rem, 9vw, 6.5rem)" }}
        >
          MEHFIL
        </h2>

        <div className="bg-accent/35 h-px w-14" aria-hidden="true" />

        <p
          className="font-display text-ink/90 leading-snug"
          style={{ fontSize: "clamp(1.15rem, 2.6vw, 1.6rem)" }}
        >
          Don&rsquo;t scroll the library. Travel the groove.
        </p>

        <p className="text-ink/55 font-body mx-auto max-w-md text-sm leading-relaxed">
          A love letter to recorded sound — golden-age Hindi, Punjabi &amp; Bengali, and Western
          retro — rendered with analog warmth and modern web craft. Every sleeve is generated;
          every track an official embed. The medium is the map.
        </p>

        <a
          href="https://dc-taupe.vercel.app/"
          target="_blank"
          rel="noreferrer"
          className="group bg-btn text-btn-ink mt-1 inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-mono text-xs tracking-[0.2em] uppercase shadow-[0_10px_30px_rgba(0,0,0,0.4)] transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[1px]"
        >
          Designed &amp; built by Dev Chaudhari
          <span className="transition-transform duration-[var(--dur-1)] ease-[var(--ease-out)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
            ↗
          </span>
        </a>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-ink/40 hover:text-accent font-mono text-[11px] tracking-[0.2em] uppercase underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
        >
          ↑ Travel the groove again
        </button>
      </div>
    </div>
  );
}
