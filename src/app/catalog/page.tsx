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
import { Heading, Mono, NativeText } from "@/components/ui";
import { BrowseShell } from "@/components/browse";
import { RecordArt } from "@/components/art";
import { GrooveLink } from "@/components/GrooveLink";
import { CatalogPlayButton } from "@/components/player/CatalogPlayButton";

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
          <Mono className="text-accent">The Library</Mono>
          <Heading level={1} className="mt-4">
            Every record
          </Heading>
          <p className="text-ink/70 mt-3 font-body">
            {tracks.length} records across five eras and four languages. Browse by zone, or
            scan the full list below.
          </p>
        </>
      }
    >
      <FacetRow label="By era">
        {ERA_DECADES.map((d) => (
          <Facet key={d} href={`/era/${d}`} label={d} count={eraCounts[d] ?? 0} />
        ))}
      </FacetRow>
      <FacetRow label="By language">
        {LANGUAGES.map((l) => (
          <Facet key={l} href={`/language/${l}`} label={LANGUAGE_LABEL[l] ?? l} count={langCounts[l] ?? 0} />
        ))}
      </FacetRow>
      <FacetRow label="By region">
        {REGIONS.map((r) => (
          <Facet key={r} href={`/region/${r}`} label={REGION_LABEL[r] ?? r} count={regionCounts[r] ?? 0} />
        ))}
      </FacetRow>

      <section aria-label="All records">
        <Heading level={2}>All records ({tracks.length})</Heading>
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
              {tracks.map((t) => (
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
      </section>
    </BrowseShell>
  );
}
