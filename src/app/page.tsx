import { BootSequence } from "@/components/groove/BootSequence";
import { GrooveWorld } from "@/components/groove/GrooveWorld";

/*
 * Home — the scroll world (Phase 14). The page is a tall scroll spine; GrooveWorld pins a
 * scene and scrubs the camera off scroll: outside the record → into the grooves → through
 * the eras. /browse folds into this (it redirects here). The sr-only heading + <noscript>
 * keep SEO / no-JS working with a real ENTER link.
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
            href="/catalog"
            className="bg-btn text-btn-ink rounded-full px-6 py-3 font-mono text-xs tracking-[0.2em] uppercase"
          >
            Enter the library →
          </a>
        </div>
      </noscript>
      <GrooveWorld />
      {/* the analog power-on — first arrival each session; skippable; silent */}
      <BootSequence />
    </>
  );
}
