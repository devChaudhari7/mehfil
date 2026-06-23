/*
 * MEHFIL — multilingual font system (Phase 0).
 *
 * Roster per docs/01-art-direction.md §3, all via next/font/google:
 *   - Latin display:  Marcellus           (quiet, characterful retro serif)
 *   - Latin body/UI:  Familjen Grotesk     (clean grotesk)
 *   - Mono:           Space Mono           (tape counter / RPM / timestamps)
 *   - Native display: Baloo 2 / Paaji 2 / Da 2  (Devanagari / Gurmukhi / Bengali)
 *   - Native body:    Noto Sans {Devanagari, Gurmukhi, Bengali}  (robust fallback)
 *
 * On-demand intent: Latin + mono are always visible, so they preload. The
 * native-script families set `preload: false` — fetched when referenced rather
 * than blocking first paint. (Per-route/content loading is a Phase 8 refinement.)
 *
 * Each font exposes a CSS variable consumed by src/app/globals.css `@theme inline`.
 */
import {
  Marcellus,
  Familjen_Grotesk,
  Space_Mono,
  Baloo_2,
  Baloo_Paaji_2,
  Baloo_Da_2,
  Noto_Sans_Devanagari,
  Noto_Sans_Gurmukhi,
  Noto_Sans_Bengali,
} from "next/font/google";

// ---- Latin + mono (preloaded) ----

export const marcellus = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const familjen = Familjen_Grotesk({
  variable: "--font-familjen",
  subsets: ["latin"],
  display: "swap",
});

export const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  weight: ["400", "700"],
  subsets: ["latin"],
  display: "swap",
});

// ---- Native display: Baloo per-script cuts (on demand) ----

export const baloo2 = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
});

export const balooPaaji = Baloo_Paaji_2({
  variable: "--font-baloo-paaji",
  subsets: ["gurmukhi"],
  display: "swap",
  preload: false,
});

export const balooDa = Baloo_Da_2({
  variable: "--font-baloo-da",
  subsets: ["bengali"],
  display: "swap",
  preload: false,
});

// ---- Native body / fallback: Noto Sans per script (on demand) ----

export const notoDeva = Noto_Sans_Devanagari({
  variable: "--font-noto-deva",
  subsets: ["devanagari"],
  display: "swap",
  preload: false,
});

export const notoGuru = Noto_Sans_Gurmukhi({
  variable: "--font-noto-guru",
  subsets: ["gurmukhi"],
  display: "swap",
  preload: false,
});

export const notoBangla = Noto_Sans_Bengali({
  variable: "--font-noto-bangla",
  subsets: ["bengali"],
  display: "swap",
  preload: false,
});

/** All font CSS-variable classNames, to spread onto <html>. */
export const fontVariables = [
  marcellus.variable,
  familjen.variable,
  spaceMono.variable,
  baloo2.variable,
  balooPaaji.variable,
  balooDa.variable,
  notoDeva.variable,
  notoGuru.variable,
  notoBangla.variable,
].join(" ");

/** Track scripts (mirrors Track['script'] in the brief §8 data model). */
export type Script = "devanagari" | "gurmukhi" | "bengali" | "latin";

/**
 * Map a track's script to its display + body font Tailwind utility classes
 * (generated from the `--font-*` theme tokens in globals.css), for a future
 * <NativeText> component. Song titles render in their own script first.
 */
export function scriptFont(script: Script): { display: string; body: string } {
  switch (script) {
    case "devanagari":
      return { display: "font-deva-display", body: "font-deva" };
    case "gurmukhi":
      return { display: "font-guru-display", body: "font-guru" };
    case "bengali":
      return { display: "font-bangla-display", body: "font-bangla" };
    case "latin":
      return { display: "font-display", body: "font-body" };
  }
}
