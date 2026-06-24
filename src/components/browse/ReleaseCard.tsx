/*
 * ReleaseCard — a films-as-album jacket that links to /album/[id] (Phase 5).
 * Navigation only (no playback), so it stays a server component; the pull-out +
 * playback live on the album detail page. Lifts on hover for a tactile cue.
 */
import Link from "next/link";
import type { Release } from "@/lib/catalog";
import { Sleeve } from "@/components/ui";
import { cx } from "@/lib/cx";

export function ReleaseCard({ release, className }: { release: Release; className?: string }) {
  const n = release.trackIds.length;
  return (
    <Link href={`/album/${release.id}`} className={cx("group block w-[180px]", className)}>
      <div className="transition-transform duration-300 ease-[var(--ease-analog)] group-hover:-translate-y-1">
        <Sleeve hole>
          <div className="text-ink">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase opacity-70">Film</span>
            <div className="font-display mt-1 text-xl leading-tight">{release.film}</div>
            <div className="font-mono mt-2 text-xs tabular-nums opacity-70">
              {release.year} · {n} {n === 1 ? "song" : "songs"}
            </div>
          </div>
        </Sleeve>
      </div>
    </Link>
  );
}
