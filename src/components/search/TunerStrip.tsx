"use client";

/*
 * TunerStrip — search tunes across time (Phase 18 · the Instrument organ).
 *
 * A backlit tuner band spanning 1950 → NOW. The needle eases to the AVERAGE YEAR
 * of the current results — type "kabira" and it sweeps to ~2013, type "lata" and
 * it settles near 1962 — so searching literally tunes the dial across the century.
 * Signal LEDs show match strength. Decorative (aria-hidden): the grouped results
 * below remain the real, accessible output.
 */
import type { GroupedResults } from "@/lib/search";
import { NOW_YEAR } from "@/lib/grooveBus";
import { cx } from "@/lib/cx";

const SPAN_START = 1950;
const STOPS = [1950, 1960, 1970, 1980, 1990, 2000, 2010];

export function TunerStrip({ results, query }: { results: GroupedResults; query: string }) {
  const years = [
    ...results.tracks.map((r) => r.track.year),
    ...results.albums.map((r) => r.release.year),
  ];
  const active = query.trim().length > 0;
  const avg = years.length > 0 ? years.reduce((a, b) => a + b, 0) / years.length : null;
  const span = NOW_YEAR - SPAN_START;
  const pos = avg === null ? 0.5 : Math.min(Math.max((avg - SPAN_START) / span, 0), 1);
  const count = years.length + results.artists.length;
  const signal = active ? Math.min(Math.ceil(count / 3), 5) : 0;

  return (
    <div aria-hidden="true" className={cx("tuner", active && count > 0 && "tuner--locked")}>
      <div className="tuner__band">
        {/* decade stations */}
        {STOPS.map((y) => {
          const x = ((y - SPAN_START) / span) * 100;
          return (
            <span key={y} className="tuner__stop" style={{ left: `${x}%` }}>
              <i />
              {String(y).slice(2)}
            </span>
          );
        })}
        <span className="tuner__stop" style={{ left: "100%" }}>
          <i />
          NOW
        </span>

        {/* the needle */}
        <span className="tuner__needle" style={{ left: `${pos * 100}%` }} />
        <span className="tuner__glow" style={{ left: `${pos * 100}%` }} />
      </div>

      <div className="tuner__readout">
        <span
          key={active && avg !== null ? Math.round(avg) : -1}
          className="tuner__lock font-mono text-[10px] tracking-[0.22em] uppercase tabular-nums"
        >
          {active && avg !== null ? `tuned · ${Math.round(avg)}` : "tune the century"}
        </span>
        <span className="tuner__leds">
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} data-lit={n <= signal ? "1" : undefined} />
          ))}
        </span>
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase tabular-nums">
          {active ? `${count} ${count === 1 ? "record" : "records"}` : "· · ·"}
        </span>
      </div>
    </div>
  );
}
