import type { ReactNode } from "react";
import { GrainOverlay } from "@/components/GrainOverlay";

/*
 * World — the persistent stage every route lives inside. Lays the analog
 * texture stack (stage gradient → vignette → grain), all driven by the active
 * `[data-era]` tokens, then renders page content above it.
 *
 * The persistent player bar (brief §12) mounts here in Phase 3 — placeholder slot below.
 */
export function World({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="stage-bg" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
      <GrainOverlay />
      <div className="relative z-10 flex min-h-dvh flex-col">{children}</div>
      {/* Phase 3: <PlayerBar /> persistent now-playing dock mounts here. */}
    </>
  );
}
