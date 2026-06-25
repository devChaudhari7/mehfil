/*
 * HeroNav — the static hero entry links. A SERVER component passed into the client
 * GrooveStage, so these links stay out of the client hydration chunk (perf).
 */
import Link from "next/link";

export function HeroNav() {
  return (
    <div className="flex items-center gap-4">
      <Link
        href="/browse"
        className="bg-btn text-btn-ink rounded-full px-4 py-1.5 font-mono text-[11px] tracking-[0.18em] uppercase transition-[filter] hover:brightness-110"
      >
        Travel the groove →
      </Link>
      <Link
        href="/search"
        className="text-ink/60 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
      >
        Search
      </Link>
      <Link
        href="/catalog"
        className="text-ink/60 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
      >
        The Library
      </Link>
    </div>
  );
}
