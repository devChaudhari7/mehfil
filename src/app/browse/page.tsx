import type { Metadata } from "next";

/*
 * /browse — a thin shell. The spiral lives in the persistent GrooveWorld (depth 1), so
 * arriving here from home is a camera dolly *into* the record, not a page load. This shell
 * carries the accessible heading and a no-JS fallback link to the list view.
 */
export const metadata: Metadata = {
  title: "Travel the groove — MEHFIL",
};

export default function BrowsePage() {
  return (
    <>
      <h1 className="sr-only">Travel the groove</h1>
      <noscript>
        <main className="mx-auto flex min-h-[60svh] max-w-xl flex-col items-center justify-center gap-4 px-5 text-center">
          <p className="text-ink/80 font-body">Browse the groove as a list:</p>
          <a
            href="/catalog"
            className="bg-btn text-btn-ink rounded-full px-5 py-2.5 font-mono text-xs tracking-[0.2em] uppercase"
          >
            The Library →
          </a>
        </main>
      </noscript>
    </>
  );
}
