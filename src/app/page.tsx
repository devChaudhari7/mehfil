/*
 * Home — a thin shell. The visible, interactive home (MEHFIL + the big record + ENTER)
 * is the persistent GrooveWorld (depth 0) mounted in World, so traveling home↔browse is a
 * camera move within one scene, not a page swap. This shell carries the accessible heading
 * (SEO/AT) and a no-JS fallback hero with a real ENTER link.
 */
export default function Home() {
  return (
    <>
      <h1 className="sr-only">MEHFIL — travel the groove</h1>
      <noscript>
        <div className="mx-auto flex min-h-[80svh] max-w-xl flex-col items-center justify-center gap-6 px-5 text-center">
          <p className="font-display text-ink text-5xl">MEHFIL</p>
          <p className="text-ink/80 font-body">
            Don&rsquo;t scroll the library. Travel the groove.
          </p>
          <a
            href="/browse"
            className="bg-btn text-btn-ink rounded-full px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase"
          >
            Enter the groove →
          </a>
        </div>
      </noscript>
    </>
  );
}
