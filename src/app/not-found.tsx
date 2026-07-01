import Link from "next/link";

export const metadata = { title: "Not found · MEHFIL" };

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-accent font-mono text-[11px] tracking-[0.3em] uppercase">404 · off the record</p>
      <h1 className="font-display text-ink text-4xl">This groove doesn&rsquo;t exist</h1>
      <p className="text-ink/60 font-body max-w-md">
        That track isn&rsquo;t in the catalog. Travel the groove from the top, or browse the library.
      </p>
      <div className="mt-1 flex items-center gap-4">
        <Link
          href="/"
          className="bg-btn text-btn-ink rounded-full px-5 py-2.5 font-mono text-xs tracking-[0.18em] uppercase transition-[filter] duration-[var(--dur-1)] hover:brightness-110"
        >
          Travel the groove →
        </Link>
        <Link
          href="/catalog"
          className="text-ink/55 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
        >
          The Library
        </Link>
      </div>
    </main>
  );
}
