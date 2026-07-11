/*
 * HeroNav — the thesis line + the ONE primary action. A SERVER component passed into
 * GrooveStage. The action is now a scroll cue: it smooth-scrolls down the spine into the
 * grooves (#groove) rather than navigating — the whole experience is one scroll. Works
 * with zero JS (a real in-page anchor) and is keyboard-focusable.
 */
export function HeroNav() {
  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="font-display text-ink mx-auto max-w-xl text-balance"
        style={{ fontSize: "clamp(1.2rem, 2.8vw, 1.8rem)", lineHeight: 1.2 }}
      >
        Don&rsquo;t scroll the library. Travel the groove.
      </p>
      <a
        href="#groove"
        data-magnet
        className="cta-breathe bg-btn text-btn-ink rounded-full px-7 py-3 font-mono text-xs tracking-[0.22em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[2px]"
      >
        Travel the groove ↓
      </a>
    </div>
  );
}
