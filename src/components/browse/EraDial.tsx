"use client";

/*
 * EraDial — the radio tuner wired to the catalog (Phase 5). Wraps the Phase 1
 * accessible Dial: turning it morphs the zone palette immediately (setEra) and
 * navigates to that era's route, so "tuning crossfades the catalog + shifts the
 * palette" (Phase 5 Definition of done). Keyboard nav comes from Dial.
 */
import { Dial } from "@/components/ui";
import { ERAS } from "@/lib/eras";
import { ERA_ORDER, useEraStore } from "@/lib/useEraStore";
import { travel } from "@/lib/useGrooveTransition";
import { playVeilTick } from "@/lib/sound/sfx";

const DECADES = ERAS.map((e) => e.decade);

export function EraDial({ size = 220 }: { size?: number }) {
  const era = useEraStore((s) => s.era);
  const value = Math.max(ERA_ORDER.indexOf(era), 0);

  // An era change is a narrative moment → the groove-iris veil (the destination's
  // SetEra morphs the palette as it's revealed). Soft whoosh on the gesture.
  function onChange(i: number) {
    const decade = ERAS[i]?.decade;
    if (!decade) return;
    playVeilTick();
    travel(`/era/${decade}`, "veil");
  }

  return (
    <Dial
      value={value}
      positions={ERAS.length}
      labels={DECADES}
      onChange={onChange}
      size={size}
      ariaLabel="Tune to an era"
    />
  );
}
