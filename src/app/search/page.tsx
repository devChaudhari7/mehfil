import type { Metadata } from "next";
import { Suspense } from "react";
import { Heading, Mono } from "@/components/ui";
import { BrowseShell } from "@/components/browse";
import { SearchView } from "@/components/search/SearchView";

/*
 * /search — multilingual search (brief §12, §15 Phase 7). The matching engine is
 * shared with the ⌘K palette; this is the dedicated, shareable (?q=) page.
 */
export const metadata: Metadata = {
  title: "Search — MEHFIL",
};

export default function SearchPage() {
  return (
    <BrowseShell
      header={
        <>
          <Mono className="text-accent">Search</Mono>
          <Heading level={1} className="mt-4">
            Find a record
          </Heading>
          <p className="text-ink/70 mt-3 font-body">
            Type in any script — Devanagari, Bengali, Gurmukhi, or romanized. Matches titles,
            artists, and films.
          </p>
        </>
      }
    >
      <Suspense fallback={null}>
        <SearchView />
      </Suspense>
    </BrowseShell>
  );
}
