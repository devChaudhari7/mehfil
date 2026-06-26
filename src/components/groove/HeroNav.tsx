/*
 * HeroNav — the thesis line + the ONE primary action. A SERVER component passed
 * into the client GrooveStage, so it renders server-side and the ENTER link works
 * with zero JS (keyboard-focusable, real navigation). The cinematic enter/era
 * journey is a client enhancement layered on top by GrooveStage; this is the
 * accessible floor.
 */
import { GrooveLink } from "@/components/GrooveLink";

export function HeroNav() {
  return (
    <div className="flex flex-col items-center gap-6">
      <p
        className="font-display text-ink mx-auto max-w-xl text-balance"
        style={{ fontSize: "clamp(1.2rem, 2.8vw, 1.8rem)", lineHeight: 1.2 }}
      >
        Don&rsquo;t scroll the library. Travel the groove.
      </p>
      <GrooveLink
        href="/browse"
        intent="journey"
        windup
        className="cta-breathe bg-btn text-btn-ink rounded-full px-7 py-3 font-mono text-xs tracking-[0.22em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[2px]"
      >
        Enter the groove →
      </GrooveLink>
    </div>
  );
}
