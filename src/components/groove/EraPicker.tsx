"use client";

/*
 * EraPicker — choose where your journey begins (Phase 14). On the hero, a refined row of
 * decades lets the user pick the landing era; picking morphs the whole world to it
 * smoothly (the [data-era] token transition) and persists it, so next visit lands there.
 * The scroll journey then travels forward from the chosen era.
 */
import { ERAS } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";
import { cx } from "@/lib/cx";

export function EraPicker() {
  const era = useEraStore((s) => s.era);

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-ink/35 font-mono text-[10px] tracking-[0.28em] uppercase">
        Choose your era
      </span>
      <div role="radiogroup" aria-label="Choose your landing era" className="flex items-center gap-1.5">
        {ERAS.map((e) => {
          const on = e.id === era;
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={e.decade}
              onClick={() => useEraStore.getState().setHomeEra(e.id)}
              className={cx(
                "cursor-pointer rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.12em] tabular-nums transition-[color,background-color] duration-[var(--dur-1)] ease-[var(--ease-out)]",
                on ? "bg-btn text-btn-ink" : "text-ink/45 hover:text-ink hover:bg-white/5",
              )}
            >
              {e.id === "20s" ? "Now" : e.decade.slice(0, 4)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
