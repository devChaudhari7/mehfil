# MEHFIL — Phase 4 build spec: the Groove hero

*MEHFIL docs set — build: `docs/00-brief.md` · design: `docs/01-art-direction.md` · hero (this file): `docs/02-groove-hero.md`.*
> Hand this to Claude Code for the signature hero. It replaces the plain turntable in v2-brief Phase 4 and implements "The Groove" from the art-direction doc. **Run this phase in plan mode** (see workflow notes at the bottom) — it's multi-file and architectural.

## Goal
Build the home hero: a single record groove the user travels through the history of recorded sound, where **the physical medium morphs across eras** (shellac → vinyl → cassette → CD) and the palette, grain, typography, RPM, and ambient light all transform with it. This is the award centerpiece — spend the craft here.

## Prerequisites (assume these exist from earlier phases)
- Design tokens (CSS variables) and the multilingual font system (Phase 1).
- `CatalogRepository` + typed `Track` data (Phase 2).
- The `AudioProvider` abstraction + `YouTubeProvider`, and the Zustand player store (Phase 3).

## Component architecture
Build these as composable, typed components under `components/groove/`:
- `GrooveStage` — orchestrator. Owns the current-era state and the active rendering tier; lays out the scene, HUD, and timeline.
- `GrooveSpiral` — the continuous spiral groove that is the navigation + timeline + playhead. Travelling it changes era/year; it carries a subtle "vibration" keyed to the synesthetic params (not real audio — see note).
- `MediumObject` — the central artifact; three sub-renderers crossfaded by era: `Disc` (shellac/vinyl: concentric grooves, label, sheen), `Cassette` (two turning reels + tape), `CompactDisc` (iridescent rings). Only one is visible per era; transitions are physical-object crossfades, not hard swaps.
- `Needle` — the playhead riding the groove (visible for disc eras; fades for cassette/CD).
- `SynestheticBloom` — the ambient raga-light layer (procedural; see note).
- `GrainOverlay` — animated film grain, intensity driven by an `--grain` token per era.
- `EraTimeline` — the visible "groove" control: era nodes (50s–90s) the user taps/keys through; the active node is the needle position.
- `NowPlaying` — title in native script + Latin + artist, medium badge, RPM.

## Adaptive rendering tiers (must degrade gracefully → Lighthouse 90+)
Detect capability + `prefers-reduced-motion` + data-saver, then pick:
- **Tier A — WebGL** (React Three Fiber): full 3D groove + spinning medium + light. Code-split and lazy-loaded so it never blocks first paint.
- **Tier B — 2D canvas / CSS**: richly animated 2D groove + medium + grain (the prototype is Tier B).
- **Tier C — static SVG**: crisp static groove + medium, no continuous animation; this is also the `prefers-reduced-motion` target.
Expose a `tier` value from a `useRenderTier()` hook; every component must render correctly in all three.

## The morph state machine
Model era as explicit state (`'1950s' | '1960s' | '1970s' | '1980s' | '1990s'`) in the Zustand store. On era change, transition (≈0.9–1.2s, analog easing) the following in lockstep:
- **Palette**: swap the era's CSS-variable token set (stage gradient, accent, ink, glow, grain).
- **Medium**: crossfade `Disc`/`Cassette`/`CompactDisc` to the era's artifact.
- **Typography**: shift display personality (art-deco spacing in 50s → tighter by 90s); render the era's seed title in its correct script.
- **RPM / medium badge**: `78 → 33⅓ → 33⅓ → TAPE → 1×`.
- **Sound bed** (post-gesture, honoring mute): shellac crackle → vinyl noise → tape hiss → near-silence.
Transitions must be interruptible (rapid era changes shouldn't desync layers).

## Data it consumes
`GrooveStage` reads from `CatalogRepository`. Extend `Track` with synesthetic params if not already present: `raga?: string`, `mood: string`, `tempoBucket: 'slow'|'mid'|'fast'`, `timeOfDay?: 'dawn'|'day'|'dusk'|'night'`. Era metadata (palette tokens, medium, label) lives in an `Era` config object, not hardcoded in components.

## Synesthetic layer — build it correctly (important)
A YouTube IFrame embed does **not** expose the raw audio stream, so **do not** attempt Web-Audio FFT on the player — it will fail cross-origin. `SynestheticBloom` is **procedural**: drive it from the track's `raga`/`mood`/`tempoBucket`/`timeOfDay` tags plus the player's `currentTime` and play-state (from the `AudioProvider` events). For Indian tracks, map the raga's traditional time-of-day to the ambient light so the space breathes on a dawn-to-night cycle; Western tracks use a mood-spectrum bloom. (Real FFT is reserved for any future `LocalProvider` royalty-free tracks.)

## Performance & accessibility (gates)
- Code-split the WebGL tier; lazy-load; no layout shift; preload only the fonts the first view needs.
- Lighthouse 90+ (Perf/A11y/Best-practices/SEO) on the hero route.
- `EraTimeline` is fully keyboard-navigable with visible, on-brand focus; announce era/track changes politely (aria-live).
- `prefers-reduced-motion` → Tier C (no spin/grain/bloom animation; era change is an instant cross-cut).
- A calm "list mode" browse view is reachable in one action (also serves older listeners).

## Definition of done
- Hero loads fast and looks award-worthy on mobile + desktop in the best available tier.
- Travelling the era timeline morphs palette + medium + typography + RPM + sound in lockstep, smoothly and interruptibly.
- The medium visibly changes artifact (disc → cassette → CD) across eras.
- All three tiers render correctly; reduced-motion path is clean.
- Playback drives the needle/medium spin; pause stops it; no visible iframe.
- Lighthouse 90+ on the route; keyboard + screen-reader paths pass.

## Build note
Start this phase in **plan mode**: have Claude read this file plus the v2 brief and art-direction doc, propose a component + tier plan, let me review/edit it, then implement against the Definition of done and commit in logical chunks.
