# MEHFIL — Art Direction: "THE GROOVE"

*MEHFIL docs set — build: `docs/00-brief.md` · design (this file): `docs/01-art-direction.md` · hero: `docs/02-groove-hero.md`. This document is authoritative for all art direction and supersedes §10–11 of the build brief.*
> The award-caliber design concept. This replaces and expands §10–11 of the v2 build brief. Everything here exists to make MEHFIL feel like nothing else — a singular, ownable idea, not a skin over a streaming grid.

**Tagline:** *Don't scroll the library. Travel the groove.*

---

## 1. The one idea (the signature)

MEHFIL is not a grid of albums. It is **a single, endless record groove you travel along** — and as you travel, the groove carries you through the entire physical and emotional history of recorded sound. The groove is the **navigation, the timeline, and the playhead, all one continuous line.** The needle is *you*.

Spend all the boldness here. Everything else (album, artist, search pages) stays quiet and disciplined in the same world.

Three layers make it unrepeatable:

### Layer 1 — The groove is the spine
One continuous spiral is the entire home/browse experience. You travel inward/outward along it to move through decades, regions, and moods. No menu-first navigation — the groove *is* the menu. The line is alive: it carries the visible "vibration" of whatever is playing, so you see the sound in the groove. Zooming the spiral changes scale (eras → years → a single record).

### Layer 2 — The medium is the map (the retro core)
As you travel the groove through time, **the physical format of the world changes** — and with it the palette, grain, typography, and sound design:

| Era | Medium | World | Accent | Sound texture |
|---|---|---|---|---|
| 1950s | Shellac 78 | roasted sepia, candle-amber, art-deco | brass `#C9962E` | heavy crackle |
| 1960s | Vinyl 33⅓ | warm walnut + petrol teal | amber `#E0A13A` · teal `#1E4A48` | soft surface noise |
| 1970s | Vinyl 33⅓ | oxblood + golden dusk, faint psychedelia | terracotta `#D9602B` | warm hiss |
| 1980s | Cassette | indigo night, neon | magenta `#F0407F` · cyan `#2BD6E6` | tape hiss, mechanical clunk |
| 1990s | Compact Disc | cool slate, chrome iridescence | cyan `#2BD6E6` · magenta-chrome `#C060D0` | clean, near-silent |

You are not "filtering by decade." You are time-traveling through the **artifacts of recorded sound**. This is the retro touch done as an organizing principle, not decoration — and it's why a multi-era, multilingual catalog *wants* to exist as a journey.

> Deliberately avoid the default "warm cream + serif + terracotta" AI look by making the palette **shift across materials** rather than sitting in one warm scheme. Each era is derived from its physical medium, so no single generic palette dominates.

### Layer 3 — Synesthetic raga-light (the part nobody has seen)
Every track blooms off the groove as **generative light**. For Indian classical/film tracks, the bloom and the ambient light follow the song's **raga and its traditional time-of-day**, so the whole space breathes on a living **dawn-to-night cycle**: a morning raga (e.g. Bhairav) bathes the room in sunrise; an evening raga (Yaman) in amber dusk; a midnight raga (Malkauns) in deep indigo. Western retro tracks get a parallel mood-spectrum bloom (warmth/energy/melancholy). No mainstream music product visualizes the Indian temporal-raga cosmology — this is the culturally-rooted "unseen" layer, and it ties straight to the golden-age Indian heart of the catalog.

**Critical technical note (build this correctly):** a YouTube IFrame embed does **not** expose the raw audio stream, so real-time FFT/frequency analysis of the playing track is **not possible** from the embed. Therefore the synesthetic visuals are **procedural/generative** — parameterized by per-track metadata you tag in the catalog (raga, mood, tempo, era) and driven by the player's `currentTime` and play-state. This looks alive and is fully buildable. Reserve true Web-Audio FFT for any royalty-free `LocalProvider` tracks only. Do not attempt to analyze a cross-origin YouTube stream — it will fail.

---

## 2. Why this wins Awwwards
A singular, ownable concept (not the Nth vinyl skin); a navigation paradigm nobody else uses; deep cultural originality (raga-time cosmology); audio-visual synesthesia plus real sound design (rare and rewarded); orchestrated motion with restraint; and a genuine reason for the catalog's breadth. Pair it with technical polish (performance, accessibility) and it competes for Site of the Day / Developer + Design awards.

---

## 3. Typography
- **Latin display:** a characterful retro serif used with restraint — *Marcellus* or *Recoleta* (avoid the over-used high-contrast-serif default). Big, quiet, confident.
- **Latin body/UI:** a clean grotesk — *General Sans* / *Familjen Grotesk*.
- **Native scripts (first-class):** Devanagari, Gurmukhi, Bengali — use the **Baloo** display cuts (*Baloo 2*, *Baloo Paaji 2*, *Baloo Da 2*) for headers and **Noto Sans {Devanagari, Gurmukhi, Bengali}** for body. Song titles render in their **own script first**, Latin transliteration second.
- **Utility/mono:** *Space Mono* / *Martian Mono* for the tape counter, RPM marks, timestamps.
- A **comfortable reading** mode (larger base + line-height) for older listeners.
- Per-era type personality: art-deco letter-spacing in the 50s zone; cleaner, tighter setting by the 90s.

---

## 4. Texture & material (per medium)
Layered, subtle, performance-conscious, all gated by `prefers-reduced-motion`:
- **Film grain** (animated SVG `feTurbulence`), intensity rising in the shellac era, near-zero by CD.
- **Surface noise** appropriate to the format (shellac dust, vinyl groove sheen, tape scanlines/wow-flutter, CD iridescence).
- Warm **vignette**; sparing CRT chromatic aberration on hover in the 80s zone only.
- Light **bloom** behind the playhead, colored by the synesthetic layer.

---

## 5. Motion language
Mechanical and weighty, never bouncy. The groove scrolls with analog inertia; the medium-morph is a **crossfade of physical objects** (record dissolves into cassette dissolves into CD), not a hard swap. Records spin at a believable RPM and pause when paused; starting a track is a **needle-drop**; scrubbing is scrubbing the groove/tape. One orchestrated page-load sequence (needle lowers, groove ignites) beats scattered effects.

---

## 6. Sound design (a music app must sound designed)
Optional, never autoplaying, unlocked by first gesture, honoring a global mute:
- Era-appropriate ambient bed (shellac crackle → tape hiss → CD silence).
- Mechanical button/switch/cassette-door clicks.
- A soft needle-drop on track start.

---

## 7. Navigation mechanics + accessibility fallback
- **Primary:** the spiral groove (hero + browse). Travel = move through eras/years; branch points open region/mood; a record on the groove expands to its tracklist.
- **Secondary structured pages** (album, artist, search, about) live inside the same world, styled per the current era zone.
- **List mode:** a calm, conventional browse/search view is always one tap away — better for older listeners *and* for Awwwards "best practices."
- **Reduced-motion:** spiral becomes a static, navigable timeline; spinning/grain/bloom freeze to tasteful static; medium-morph becomes an instant cross-cut. Full keyboard nav and visible focus throughout.

---

## 8. How this maps onto the v2 build brief
- Replaces brief §10–11; keeps everything else (tech stack, catalog seed+pipeline, data model, phases).
- **Data model additions:** per `Track`, add `raga?`, `mood`, `tempoBucket`, and `timeOfDay?` so the synesthetic layer has parameters to read. (Tag these during ingestion / curation.)
- **Phase order:** build the groove + medium-morph as the Phase 4 hero (replacing the plain turntable), then layer the synesthetic raga-light in Phase 8 polish. Keep adaptive tiers (WebGL → 2D canvas → static) so it still hits Lighthouse 90+.
- **Signature for award submission:** lead the `/about` page and the case study with "the medium is the map" + the living raga day-cycle.

---

## 9. The prototype
The accompanying `mehfil_groove_concept.html` is a 60-second tease: it auto-travels the decades and you can watch the medium morph (shellac → vinyl → cassette → CD) with the palette, grain, RPM, title, and script all transforming. It is intentionally a fraction of the idea — the spiral navigation and the synesthetic raga-light are described above and belong in the full build.
