"use client";

/*
 * EraDial — the radio tuner wired to the catalog (Phase 5). Wraps the Phase 1
 * accessible Dial: turning it morphs the zone palette immediately (setEra) and
 * navigates to that era's route, so "tuning crossfades the catalog + shifts the
 * palette" (Phase 5 Definition of done). Keyboard nav comes from Dial.
 */
import { useRouter } from "next/navigation";
import { Dial } from "@/components/ui";
import { ERAS } from "@/lib/eras";
import { ERA_ORDER, useEraStore } from "@/lib/useEraStore";

const DECADES = ERAS.map((e) => e.decade);

export function EraDial({ size = 220 }: { size?: number }) {
  const router = useRouter();
  const era = useEraStore((s) => s.era);
  const value = Math.max(ERA_ORDER.indexOf(era), 0);

  function onChange(i: number) {
    const id = ERA_ORDER[i];
    const decade = ERAS[i]?.decade;
    if (!id || !decade) return;
    useEraStore.getState().setEra(id);
    router.push(`/era/${decade}`);
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
