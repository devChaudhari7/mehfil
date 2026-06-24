"use client";

/*
 * SetEra — drives the global era zone for a routed browse page (Phase 5).
 *
 * Server pages can't touch the era store, so they mount this with their
 * representative era; it writes `data-era` on <html> via useEraStore, so the whole
 * stage (gradient, grain, accents) MORPHS to the zone palette — the "tuning
 * crossfades + shifts palette" behaviour from the Phase 5 Definition of done. On a
 * client navigation between zones this is the analog crossfade; on a hard load it's
 * one morph from the default era, which is acceptable/on-brand. Renders nothing.
 */
import { useEffect } from "react";
import type { EraId } from "@/lib/eras";
import { useEraStore } from "@/lib/useEraStore";

export function SetEra({ era }: { era: EraId }) {
  useEffect(() => {
    useEraStore.getState().setEra(era);
  }, [era]);
  return null;
}
