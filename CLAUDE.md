# MEHFIL — retro music web app

Award-caliber retro music player for golden-age Indian (Hindi · Punjabi · Bengali)
and classic Western retro, built with analog warmth and modern web craft.

## Docs (read the relevant one before a phase — reference with @docs/..., don't paste)
- `docs/00-brief.md` — full build brief: scope, catalog seed + growth pipeline, data model, build phases.
- `docs/01-art-direction.md` — "The Groove": the design concept. **Authoritative for all art direction.**
- `docs/02-groove-hero.md` — Phase 4 hero build spec.
- `docs/concept/groove-concept.html` — visual reference (the medium-morph tease; open in a browser).

## Stack
Next.js (App Router) · TypeScript (strict) · Tailwind · Zustand · Motion + GSAP · Lenis.
Audio = YouTube IFrame Player API behind an `AudioProvider` abstraction (embed-only).
Catalog ingestion = a Node/TS service using the YouTube Data API v3.

## Rules
- IMPORTANT: never download, rip, or re-encode audio/video. Store metadata + video IDs only.
- IMPORTANT: no autoplay; audio and SFX play only after a user gesture.
- Every motion/texture effect must have a `prefers-reduced-motion` fallback.
- All user-facing titles render in native script (Devanagari/Gurmukhi/Bengali) + Latin.
- Ingestion: use `playlistItems.list` + batched `videos.list` (1 unit each); never bulk `search.list`.
- Maintain WCAG AA contrast over textured surfaces; mobile-first (360px → 1440px+).
- Don't attempt Web-Audio FFT on the YouTube embed (cross-origin, will fail); synesthetic visuals are procedural.
- Run typecheck + build after each change. Commit per logical change, never one mega-commit.
- When two approaches are reasonable, show both and let me choose.

## Build order
Work one phase at a time (see `docs/00-brief.md` §15). Start each phase in **plan mode**,
get the plan approved, implement, verify that phase's "Definition of done", commit, then `/clear`.

## Commands
- dev: `npm run dev`
- build: `npm run build`
- typecheck: `npm run typecheck`
