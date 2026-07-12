# MEHFIL — The Re-imagination (Phase 18 concept document)

*Docs set: build `00-brief.md` · art direction `01-art-direction.md` · hero `02-groove-hero.md` ·
**re-imagination (this file)**. The scroll world, GrooveGL light, generative sleeves, the
player spine, and the 1950→now era system are EQUITY — every direction below builds on
them; none deletes them.*

> The home is cinema. The rest of the app — Library, album, artist, search, the deck — is
> still a polite utility layer from an earlier chapter. This document proposes three
> complete, buildable directions for making EVERY surface feel like it belongs to the same
> world-class object. The director picks one (or a hybrid); only then do we build.

---

## Direction 1 — THE ARCHIVE EDITION

**Essence.** MEHFIL as a museum retrospective of recorded sound. Editorial, typographic,
reverent. Every page reads like a plate from an oversized exhibition catalog: massive serif
numerals, catalog-card metadata set like letterpress, generous margins, paper textures used
sparingly against the era-dark stage. The generative sleeves become *the collection*.

**Layout language.** A strict editorial grid (12-col, wide gutters). Every page opens with
an oversized *plate number* (the era year or catalog number, 20vw serif, ghosted) behind a
tight content column. Metadata is beauty: matrix numbers, pressing years, label credits
rendered as museum wall-text.

**Type system.** Marcellus at extreme scale for numerals/titles (clamp 4–14rem); mono for
all metadata (small caps, wide tracking); native scripts get equal display billing —
Devanagari/Gurmukhi/Bengali titles set LARGE, Latin beneath as the catalog transliteration.

**Per-surface.**
- **Library** → *the crate.* A horizontally-dug record crate: full-height generative
  sleeves standing in a row, perspective-skewed like real crates; wheel/drag flips through
  them one by one (snap), each flip a soft card-flick sound; facets become drawer labels.
- **Album** → *the gatefold plate.* Sleeve LARGE left; wall-text right (film, year, raga,
  moods as exhibition copy); tracklist as a pressing sheet — side A/B, matrix numbers.
- **Artist** → *the retrospective.* A dated career wall: releases on a vertical timeline
  with era-tinted plate numbers.
- **Search** → *the card catalog.* Results as index cards in a drawer that slides open.
- **Deck** → keep the Phase-15 stage; add plate-style metadata typography.
- **Chrome** → a thin museum-label header: MEHFIL wordmark small, section title huge.

```
LIBRARY (the crate)                          ALBUM (the plate)
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│ THE LIBRARY            1 9 6 0 s │         │  ┌────────┐   PLATE Nº MFL-1964  │
│ ┌─┐┌─┐┌──┐╱▔▔╲┌──┐┌─┐┌─┐         │         │  │ SLEEVE │   लग जा गले          │
│ │ ││ ││  │▏◉ ▕│  ││ ││ │  → dig  │         │  │  ART   │   Lag Ja Gale        │
│ └─┘└─┘└──┘╲▁▁╱└──┘└─┘└─┘         │         │  └────────┘   wall-text metadata │
│  drawer labels: ERA · LANG · REGION        │  SIDE A  1. …  matrix 45-RPM-047 │
└──────────────────────────────────┘         └──────────────────────────────────┘
```

**Motion identity.** Slow, weighty, archival: plates settle like paper; the crate flip is
the one showpiece physics. Least motion of the three — the *stillness* is the luxury.
**Risk/effort.** Medium. Biggest wins: Library + album. Strongest fit with existing brand.

---

## Direction 2 — THE INSTRUMENT

**Essence.** Every surface is playable hardware. Not skeuomorphic kitsch — precision
instrument design (Teenage Engineering / Braun): machined panels, engraved labels, LEDs,
detented knobs. You don't browse MEHFIL; you *operate* it.

**Layout language.** Panels and modules: each page a faceplate with functional groups,
engraved captions (mono, 9–10px, letter-spaced), LED state dots, real switch/knob controls
mapped to existing interactions.

**Type system.** Mono promoted to co-lead (engravings everywhere); Marcellus reserved for
the few "printed" moments (sleeve titles, era names). Native scripts on the sleeve/label
surfaces where print belongs.

**Per-surface.**
- **Library** → *the console.* A mixing-desk: each record a channel strip (sleeve swatch,
  VU-style era meter, PLAY as an illuminated button); faceted by bank switches (ERA /
  LANG / REGION as physical toggle rows).
- **Album** → *the gatefold jacket.* The sleeve physically OPENS on click (3D fold, CSS
  perspective) revealing the tracklist printed inside; the vinyl slides out to play.
- **Artist** → *the tape shelf:* labeled reels/cassettes per release on a rack.
- **Search** → *the tuner.* The existing Dial promoted to hero: type OR tune; results
  print on a backlit LCD strip with a needle meter twitching per keystroke.
- **Deck** → already the instrument — unify its faceplate with the new panel language.
- **Chrome** → a persistent thin "rack rail" with engraved MEHFIL plate + power LED.

```
LIBRARY (the console)                        ALBUM (the gatefold)
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│ MEHFIL ▣ rack rail        ● PWR  │         │   ┌───────┬╌╌╌╌╌╌╌╌┐  ← opens    │
│ [ERA ▾][LANG ▾][REGION ▾] switches         │   │SLEEVE │ SIDE A │             │
│ ┌───┬───┬───┬───┬───┐             │        │   │ front │ 1. …   │  ◉ vinyl    │
│ │▓▓ │▓▓ │▓▓ │▓▓ │▓▓ │ ch. strips │        │   └───────┴╌╌╌╌╌╌╌╌┘   slides out │
│ │▁▃▅│▂▄▂│▅▃▁│▃▃▃│▄▂▄│ era meters │        └──────────────────────────────────┘
│ │(▶)│(▶)│(▶)│(▶)│(▶)│ lit PLAY   │
└──────────────────────────────────┘
```

**Motion identity.** Mechanical everything: detents, spring-loaded switches, needle
ballistics; the gatefold open is the showpiece. Sound design gets richer (switch clicks
per control family).
**Risk/effort.** Highest. The gatefold + console are substantial builds; the payoff is the
most *interactive* identity of the three — judges love touchable.

---

## Direction 3 — THE BROADCAST

**Essence.** MEHFIL as a station that has been on air since 1950. Everything is programme:
era channels, ON AIR lights, schedules, sign-off cards. The catalog isn't a library — it's
*what's playing tonight across seven decades of radio.*

**Layout language.** Broadcast graphics: channel idents, lower-thirds, programme grids,
test-card geometry. The era system becomes literal CHANNELS (CH 50 … CH NOW).

**Type system.** Mono-forward with ident numerals; Marcellus for programme names; native
scripts in the lower-third style (big native line, Latin ticker beneath).

**Per-surface.**
- **Library** → *the programme guide.* A grid: channels (eras) × languages; cells are
  shows ("Golden Hour — Lata", "Disco Nights"); a LIVE row mirrors what's playing.
- **Album** → *the feature broadcast:* film-as-programme with an ident card and airtime
  typography; tracklist as a running order with timestamps.
- **Artist** → *the anthology:* "A Retrospective in N parts", parts = releases.
- **Search** → *teletext.* Type and results paint in teletext rows with channel numbers.
- **Deck** → ON AIR: the deck gains a subtle red ON AIR lamp + a ticker of the raga/mood.
- **Chrome** → station clock (the odometer year), channel indicator, signal meter.

```
LIBRARY (programme guide)                    NOW PLAYING (on air)
┌──────────────────────────────────┐         ┌──────────────────────────────────┐
│ MEHFIL  ⏲ 1964   CH 60  ▂▄▆ sig  │         │  ● ON AIR            CH 60       │
│        HINDI  PUNJABI  BENGALI  W│         │   [deck stage as built]          │
│ CH 50 │ ▓▓▓▓  ▓▓    ▓▓▓    ▓     │         │  ─ lower third ─────────────     │
│ CH 60 │ ▓▓▓▓▓ ▓▓▓   ▓▓     ▓▓    │         │  लग जा गले  · Lata · Raga Pahadi │
│ CH 70 │ ▓▓▓   ▓▓▓▓  ▓      ▓▓▓   │         └──────────────────────────────────┘
│  LIVE │ ▶ now: Kabira — CH NOW   │
└──────────────────────────────────┘
```

**Motion identity.** Broadcast cuts: idents wipe, lower-thirds slide, teletext paints in
scanline order. The era-flash system already speaks this language.
**Risk/effort.** Medium-high. The most *conceptually* novel; slight tension with the
"groove/vinyl" spine (radio vs record) — mitigated by framing channels AS grooves.

---

## Recommendation

**The Archive Edition as the base, with The Instrument's two best organs transplanted:**
the **gatefold album** and the **tuner search**. Archive gives every page museum-grade
typographic confidence at medium effort; the gatefold + tuner add the touchable showpieces
judges remember. Broadcast's station clock (odometer chrome) can ride along for free.

## Process after the choice

Build order (each surface its own judged beat): Library → Album → Artist → Search →
chrome/deck unification → copy pass. Standard gates throughout (typecheck/lint/test/build,
AA, native-script, reduced-motion, no new deps).
