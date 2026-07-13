/*
 * RetroWall — the artist page as a dated retrospective (Phase 18 · Archive).
 *
 * One chronological wall of the artist's works: film releases and standalone
 * singles interleaved by year, each entry a plate — the year set large in the
 * era's own accent (every row carries its record's [data-era]), the generative
 * sleeve, and wall-text metadata. Server-rendered; only the play controls are
 * client islands.
 */
import { decadeToEraId, type Release, type Track } from "@/lib/catalog";
import { getEra } from "@/lib/eras";
import { GrooveLink } from "@/components/GrooveLink";
import { NativeText } from "@/components/ui";
import { RecordArt } from "@/components/art";
import { PlayControl } from "./PlayControl";

type WallItem =
  | { kind: "release"; year: number; release: Release }
  | { kind: "single"; year: number; track: Track };

export function RetroWall({ releases, tracks }: { releases: Release[]; tracks: Track[] }) {
  const filmTrackIds = new Set(releases.flatMap((r) => r.trackIds));
  const singles = tracks.filter((t) => !filmTrackIds.has(t.id));
  const items: WallItem[] = [
    ...releases.map((r): WallItem => ({ kind: "release", year: r.year, release: r })),
    ...singles.map((t): WallItem => ({ kind: "single", year: t.year, track: t })),
  ].sort((a, b) => a.year - b.year);

  if (items.length === 0) return null;

  return (
    <ol className="stagger-grid divide-y divide-white/[0.07]">
      {items.map((item, i) => {
        const era =
          item.kind === "release"
            ? getEra(decadeToEraId(item.release.era))
            : getEra(decadeToEraId(item.track.era));
        const eraId = era.id;
        return (
          <li
            key={item.kind === "release" ? item.release.id : item.track.id}
            data-era={eraId}
            className="grid grid-cols-[minmax(64px,110px)_96px_1fr] items-center gap-5 py-6 sm:gap-8"
          >
            {/* the plate year — set in the record's own era accent */}
            <span
              aria-hidden="true"
              className="font-display text-right leading-none"
              style={{
                fontSize: "clamp(1.6rem, 4.5vw, 2.8rem)",
                color: "color-mix(in srgb, var(--accent) 55%, transparent)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.year}
            </span>

            {/* the sleeve */}
            {item.kind === "release" ? (
              <GrooveLink
                href={`/album/${item.release.id}`}
                intent="journey"
                aria-label={`${item.release.film}, ${item.year}`}
                data-tilt
                className="tilt-card block h-24 w-24 overflow-hidden rounded-[5px] shadow-[0_14px_34px_rgba(0,0,0,0.5)] transition-transform duration-[var(--dur-2)] ease-[var(--ease-out)] hover:-translate-y-1"
              >
                <RecordArt subject={{ release: item.release }} variant="sleeve" decorativeTitle />
              </GrooveLink>
            ) : (
              <span className="block h-24 w-24 overflow-hidden rounded-[5px] shadow-[0_14px_34px_rgba(0,0,0,0.5)]">
                <RecordArt subject={{ track: item.track }} variant="sleeve" decorativeTitle />
              </span>
            )}

            {/* wall-text + action */}
            <div className="min-w-0">
              {item.kind === "release" ? (
                <>
                  <p className="text-ink/50 font-mono text-[9px] tracking-[0.26em] uppercase">
                    Part {i + 1} · film soundtrack · {era.mediumLabel}
                  </p>
                  <GrooveLink
                    href={`/album/${item.release.id}`}
                    intent="journey"
                    className="font-display hover:text-accent mt-1.5 block truncate text-xl transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]"
                  >
                    {item.release.film}
                  </GrooveLink>
                  <p className="text-ink/55 mt-1 font-mono text-[11px] tracking-wide">
                    {item.release.trackIds.length}{" "}
                    {item.release.trackIds.length === 1 ? "song" : "songs"} · open the gatefold →
                  </p>
                </>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-ink/50 font-mono text-[9px] tracking-[0.26em] uppercase">
                      Part {i + 1} · single · {era.mediumLabel}
                    </p>
                    <div className="mt-1.5">
                      <NativeText
                        native={item.track.title.native}
                        latin={item.track.title.latin}
                        script={item.track.script}
                        size="h3"
                      />
                    </div>
                  </div>
                  <PlayControl track={item.track} queue={tracks} variant="icon" />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
