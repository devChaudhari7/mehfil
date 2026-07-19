"use client";

/*
 * PressingSheet — the /catalog scannable table, WINDOWED and self-sourced (Phase 25).
 *
 * Same fix as BrowseCollection: it pulls the full track list from the already-
 * client-bundled `catalogRepository` and prerenders only a capped window, so the
 * page's HTML stays small no matter how large the catalog grows (the crate above
 * it is the primary, fully-browsable view). "Show more" reveals the rest client-side.
 */
import { useMemo, useState } from "react";
import { catalogRepository } from "@/lib/catalog";
import { Heading, Mono, NativeText } from "@/components/ui";
import { RecordArt } from "@/components/art";
import { CatalogPlayButton } from "@/components/player/CatalogPlayButton";

const CAP = 60;
const STEP = 150;

export function PressingSheet() {
  const tracks = useMemo(() => catalogRepository.allTracks(), []);
  const [shown, setShown] = useState(CAP);

  return (
    <section aria-label="All records">
      <Heading level={2}>The pressing sheet ({tracks.length.toLocaleString()})</Heading>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th scope="col" className="px-4 py-3">
                <span className="sr-only">Sleeve</span>
              </th>
              {["Play", "Title", "Era", "Language", "Region"].map((h) => (
                <th key={h} scope="col" className="px-4 py-3">
                  <Mono className="text-ink/60">{h}</Mono>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tracks.slice(0, shown).map((t) => (
              <tr
                key={t.id}
                className="border-b border-white/5 align-top transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] last:border-0 hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3">
                  <span className="block h-10 w-10 overflow-hidden rounded-[3px] shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
                    <RecordArt subject={{ track: t }} size="sm" variant="swatch" />
                  </span>
                </td>
                <td className="px-4 py-3">
                  <CatalogPlayButton trackId={t.id} />
                </td>
                <td className="px-4 py-3">
                  <NativeText
                    native={t.title.native}
                    latin={t.title.latin}
                    script={t.script}
                    size="body"
                  />
                </td>
                <td className="text-ink/80 px-4 py-3 font-mono text-sm">{t.era}</td>
                <td className="text-ink/80 px-4 py-3 font-mono text-sm">{t.language}</td>
                <td className="text-ink/80 px-4 py-3 font-mono text-sm">{t.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {shown < tracks.length && (
        <div className="mt-6 flex items-center justify-center gap-5">
          <button
            type="button"
            data-magnet
            onClick={() => setShown((n) => Math.min(n + STEP, tracks.length))}
            className="bg-btn text-btn-ink rounded-full px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase transition-[filter,transform] duration-[var(--dur-1)] ease-[var(--ease-analog)] hover:brightness-110 active:translate-y-[1px]"
          >
            Show more
          </button>
          <button
            type="button"
            onClick={() => setShown(tracks.length)}
            className="text-ink/55 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
          >
            All {(tracks.length - shown).toLocaleString()} →
          </button>
        </div>
      )}
    </section>
  );
}
