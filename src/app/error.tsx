"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <p className="text-accent font-mono text-[11px] tracking-[0.3em] uppercase">
        A skip in the groove
      </p>
      <h1 className="font-display text-ink text-3xl">Something went sideways</h1>
      <p className="text-ink/60 font-body max-w-md">
        The needle jumped the track. Lift it and drop it again — or head back to the groove.
      </p>
      <div className="mt-1 flex items-center gap-4">
        <button
          type="button"
          onClick={reset}
          className="bg-btn text-btn-ink rounded-full px-5 py-2.5 font-mono text-xs tracking-[0.18em] uppercase transition-[filter] duration-[var(--dur-1)] hover:brightness-110"
        >
          Retry
        </button>
        <Link
          href="/"
          className="text-ink/55 hover:text-accent font-mono text-[11px] tracking-[0.18em] uppercase underline-offset-4 hover:underline"
        >
          Back to the groove
        </Link>
      </div>
    </main>
  );
}
