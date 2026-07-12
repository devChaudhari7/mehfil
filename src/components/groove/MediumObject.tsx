"use client";

/*
 * MediumObject — the central artifact, crossfaded by era (docs/02). Disc reuses
 * the Phase 1 Vinyl; Cassette and CompactDisc are the 80s/90s artifacts. All
 * three are always mounted and crossfaded (opacity + scale) over --morph-dur, so
 * the medium "dissolves" between formats and rapid era changes stay in sync. The
 * reduced-motion block in globals.css collapses the transition to an instant cut.
 */
import type { ReactNode } from "react";
import { getEra, type EraId } from "@/lib/eras";
import { Vinyl } from "@/components/ui";
import { cx } from "@/lib/cx";
import { Cassette } from "./Cassette";
import { CompactDisc } from "./CompactDisc";
import { Mp3Player } from "./Mp3Player";
import { StreamWave } from "./StreamWave";

function Layer({ visible, children }: { visible: boolean; children: ReactNode }) {
  return (
    <div
      aria-hidden={!visible}
      className="absolute inset-0 grid place-items-center"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.9)",
        transition:
          "opacity var(--morph-dur) var(--ease-analog), transform var(--morph-dur) var(--ease-analog)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}

export interface MediumObjectProps {
  era: EraId;
  spinning: boolean;
  size: number;
  className?: string;
}

export function MediumObject({ era, spinning, size, className }: MediumObjectProps) {
  const medium = getEra(era).medium;
  const isDisc = medium === "shellac" || medium === "vinyl";

  return (
    <div className={cx("relative", className)} style={{ width: size, height: size }}>
      <Layer visible={isDisc}>
        <Vinyl spinning={spinning && isDisc} size={size} label={getEra(era).rpm} />
      </Layer>
      <Layer visible={medium === "cassette"}>
        <Cassette spinning={spinning && medium === "cassette"} size={size} />
      </Layer>
      <Layer visible={medium === "cd"}>
        <CompactDisc spinning={spinning && medium === "cd"} size={size} />
      </Layer>
      <Layer visible={medium === "mp3"}>
        <Mp3Player spinning={spinning && medium === "mp3"} size={size} />
      </Layer>
      <Layer visible={medium === "stream"}>
        <StreamWave spinning={spinning && medium === "stream"} size={size} />
      </Layer>
    </div>
  );
}
