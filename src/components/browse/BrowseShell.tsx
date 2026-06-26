/*
 * BrowseShell — shared chrome for the routed browse leaves (Phase 5). Server
 * component: a top nav (home + "travel the groove" into the spiral navigator), a
 * header slot, and the page body. Each routed page is itself the accessible "list"
 * parallel to the spiral, so the nav always offers the way back to the groove.
 */
import type { ReactNode } from "react";
import { GrooveLink } from "@/components/GrooveLink";

export function BrowseShell({
  header,
  children,
}: {
  header: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:py-16">
      <nav className="mb-10 flex items-center justify-between font-mono text-[11px] tracking-[0.18em] uppercase">
        <GrooveLink href="/" className="text-ink/60 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline">
          ← MEHFIL
        </GrooveLink>
        <div className="flex items-center gap-5">
          <GrooveLink
            href="/catalog"
            className="text-ink/60 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
          >
            Library
          </GrooveLink>
          <GrooveLink
            href="/search"
            className="text-ink/60 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
          >
            Search
          </GrooveLink>
          <GrooveLink
            href="/browse"
            className="text-ink/60 hover:text-accent underline-offset-4 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)] hover:underline"
          >
            Travel the groove →
          </GrooveLink>
        </div>
      </nav>
      <header className="max-w-2xl">{header}</header>
      <div className="mt-12 space-y-14">{children}</div>
    </main>
  );
}
