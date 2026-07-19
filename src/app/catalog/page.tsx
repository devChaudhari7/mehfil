import type { Metadata } from "next";
import {
  catalogRepository,
  countsByEra,
  countsByLanguage,
  countsByRegion,
  ERA_DECADES,
  LANGUAGES,
  REGIONS,
} from "@/lib/catalog";
import { Heading, Mono } from "@/components/ui";
import { BrowseShell } from "@/components/browse";
import { GrooveLink } from "@/components/GrooveLink";
import { CrateDigger } from "@/components/library/CrateDigger";
import { PressingSheet } from "@/components/library/PressingSheet";

/*
 * /catalog — "The Library": the accessible, list-mode browse hub (the "Browse as
 * list" destination). Facet chips (era / language / region) make every zone one
 * click away; the full record list plays through the gated CatalogPlayButton.
 */
export const metadata: Metadata = {
  title: "The Library — MEHFIL",
};

const tracks = catalogRepository.allTracks();

const LANGUAGE_LABEL: Record<string, string> = {
  hindi: "Hindi",
  punjabi: "Punjabi",
  bengali: "Bengali",
  english: "English",
};
const REGION_LABEL: Record<string, string> = { india: "India", west: "The West" };

function Facet({ href, label, count }: { href: string; label: string; count: number }) {
  return (
    <GrooveLink
      href={href}
      className="hover:border-accent/50 group flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 transition-colors hover:bg-white/5"
    >
      <span className="text-ink font-body text-sm">{label}</span>
      <span className="text-ink/45 font-mono text-[11px] tabular-nums">{count}</span>
    </GrooveLink>
  );
}

function FacetRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-label={`Browse by ${label}`}>
      <Mono className="text-ink/50">{label}</Mono>
      <div className="stagger-grid mt-3 flex flex-wrap gap-2.5">{children}</div>
    </section>
  );
}

export default function LibraryPage() {
  const eraCounts = countsByEra(tracks);
  const langCounts = countsByLanguage(tracks);
  const regionCounts = countsByRegion(tracks);

  return (
    <BrowseShell
      header={
        <>
          <Mono className="text-accent">The Library · a retrospective of recorded sound</Mono>
          <Heading level={1} className="mt-4">
            Dig the crate
          </Heading>
          <p className="text-ink/70 mt-3 font-body">
            {tracks.length} records, 1950 to now, standing in one crate. Drag through the
            years, open a drawer, or scan the pressing sheet below.
          </p>
        </>
      }
    >
      {/* the crate — the whole century in cover-flow (Archive Edition) */}
      <CrateDigger />

      <FacetRow label="Drawers · by era">
        {ERA_DECADES.map((d) => (
          <Facet key={d} href={`/era/${d}`} label={d} count={eraCounts[d] ?? 0} />
        ))}
      </FacetRow>
      <FacetRow label="Drawers · by language">
        {LANGUAGES.map((l) => (
          <Facet key={l} href={`/language/${l}`} label={LANGUAGE_LABEL[l] ?? l} count={langCounts[l] ?? 0} />
        ))}
      </FacetRow>
      <FacetRow label="Drawers · by region">
        {REGIONS.map((r) => (
          <Facet key={r} href={`/region/${r}`} label={REGION_LABEL[r] ?? r} count={regionCounts[r] ?? 0} />
        ))}
      </FacetRow>

      <PressingSheet />
    </BrowseShell>
  );
}
