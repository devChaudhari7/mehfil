/*
 * ReleaseCard — a films-as-album jacket that links to /album/[id] (Phase 5).
 * Navigation only (no playback), so it stays a server component; the pull-out +
 * playback live on the album detail page. Lifts on hover for a tactile cue.
 */
import type { Release } from "@/lib/catalog";
import { Sleeve } from "@/components/ui";
import { RecordArt } from "@/components/art";
import { GrooveLink } from "@/components/GrooveLink";
import { cx } from "@/lib/cx";

export function ReleaseCard({ release, className }: { release: Release; className?: string }) {
  const n = release.trackIds.length;
  const label = `${release.film}, ${release.year}, ${n} ${n === 1 ? "song" : "songs"}`;
  return (
    <GrooveLink
      href={`/album/${release.id}`}
      intent="journey"
      aria-label={label}
      className={cx("group block w-[180px]", className)}
    >
      <div className="transition-transform duration-300 ease-[var(--ease-analog)] group-hover:-translate-y-1">
        <Sleeve hole bleed>
          <RecordArt subject={{ release }} variant="sleeve" decorativeTitle />
        </Sleeve>
      </div>
    </GrooveLink>
  );
}
