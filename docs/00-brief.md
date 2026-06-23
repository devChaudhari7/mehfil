# MEHFIL — Claude Code Build Brief (v2)

*MEHFIL docs set — build (this file): `docs/00-brief.md` · design: `docs/01-art-direction.md` ("The Groove", authoritative for art direction) · hero: `docs/02-groove-hero.md`.*
> A retro music listening experience for golden-age Indian (Hindi · Punjabi · Bengali) and classic Western ("Hollywood") records — built with the warmth, texture, and tactility of analog media, and the craft of a modern, award-caliber web build. Catalog is **legally sourced via official-label embeds** and grows from a hand-curated seed into thousands of tracks through an automated ingestion pipeline.

*Working name: **MEHFIL** (मेहफ़िल — an intimate gathering for music). Swappable: Gramophone, Sur, Taraana, Gulmohar, The B-Side.*

---

## 0. How to use this brief (read first, Claude Code)

You are building a production-quality, design-forward music web app **plus** a catalog-ingestion pipeline. This brief is the single source of truth. Build in the phased sequence in **§15** and treat each phase's "Definition of done" as a gate. Prefer concrete, opinionated choices in service of the thesis (§3). Note any judgement calls in a comment.

**Non-negotiable:** we do **not** host, download, rip, or re-encode any copyrighted audio/video. Playback happens only through the **YouTube IFrame Player API**, streaming from the rights holders' own official channels. We store only **metadata and video IDs**. See §6e for the guardrails — follow them exactly.

---

## 1. The concept / creative thesis

**One line:** every digital interaction mimics the tactile, warm, slightly imperfect feel of analog music media — vinyl, cassette, radio dial — rendered with modern web craft.

Music used to be ceremonial: pulling a record from its sleeve, dropping the needle, the warm crackle before the first note, flipping a cassette, tuning a dial between stations. **MEHFIL turns that ritual into the interface.** It should *feel* like a beautifully made analog object that happens to live in a browser. If a feature doesn't reinforce "analog warmth made digital," reconsider it.

---

## 2. Audience & the multilingual bridge

Two audiences, one product:
- **Older listeners (45+):** the songs they grew up with; *legibility and ease* (large targets, high contrast, readable type, optional reduced motion). Accessibility is a first-class requirement here, not an afterthought.
- **Younger listeners (18–35):** "vintage cool," shareability, distinctive aesthetics, the novelty of the analog metaphors.

The bridge is **warmth + craft + authenticity**. Because the catalog spans four cultures, the product is genuinely **multilingual**: titles, artists, and key UI render in **Devanagari, Gurmukhi, Bengali, and Latin** scripts (see §10 typography). Never hardcode an English-only title where a native-script one exists.

---

## 3. Scope of the catalog ("old music")

Four buckets, all in scope:
1. **Bollywood golden age (1950s–1970s)** — Lata, Rafi, Kishore, Mukesh, Manna Dey, Geeta Dutt, Hemant Kumar, Talat Mahmood; composers S.D./R.D. Burman, Shankar-Jaikishan, Madan Mohan, Naushad.
2. **Bollywood retro (1980s–1990s)** — disco/Bappi, Kishore/Asha late era, Kumar Sanu, Alka Yagnik, Udit Narayan, Nadeem-Shravan, Anu Malik.
3. **Western / "Hollywood" retro (1950s–1980s)** — rock'n'roll, Motown, disco, soft rock, new wave, synth-pop.
4. **Regional Indian** — **Punjabi** (folk & film: Surinder Kaur, Asa Singh Mastana, Kuldeep Manak, Amar Singh Chamkila, Gurdas Maan) and **Bengali** (adhunik/film/Rabindra Sangeet: Hemanta Mukherjee, Manna Dey, Sandhya Mukherjee, Kishore Kumar's Bengali work). Architect language/region as data so Tamil/Telugu/Marathi etc. can be added later without code changes.

---

## 4. Reality check baked into the plan

"Every old song, nothing missed" is not achievable by anyone — catalogs are enormous, split across many rights holders, and cannot be legally hosted without licenses no individual can obtain. **What this build delivers instead:** an extensive, legally-sourced catalog that *feels* limitless and **grows continuously** — seeded by hand now, expanded into thousands of tracks by an automated pipeline that reads official-label channels (§6). That is genuinely achievable and is the correct, lawful architecture.

---

## 5. Audio architecture (runtime)

All playback flows through one abstraction so the source is swappable; ship the YouTube provider first.

```ts
type AudioSource = 'youtube' | 'spotify' | 'local';

interface PlayableTrack {
  id: string;
  source: AudioSource;
  sourceId: string;     // YouTube videoId (default), Spotify uri, or local path
  // + metadata (see §8)
}

interface AudioProvider {
  load(track: PlayableTrack): Promise<void>;
  play(): void; pause(): void; seek(seconds: number): void;
  getCurrentTime(): number; getDuration(): number;
  on(e: 'ready'|'play'|'pause'|'ended'|'timeupdate'|'error', cb: Fn): void;
  destroy(): void;
}
```

- `YouTubeProvider` wraps the **IFrame Player API**. The iframe is **visually hidden**; all UI state (the spinning record, the cassette reels, the scrubber) is driven from the API's player-state and time events. The user never sees a YouTube chrome — they see *our* analog player.
- `SpotifyProvider` (Web Playback SDK — full playback needs Premium; 30s previews otherwise) and `LocalProvider` (for royalty-free/public-domain tracks) are stubs implementing the same interface.
- The Zustand player store talks only to `AudioProvider`.
- **No autoplay.** First playback requires a user gesture; that same gesture unlocks the sound-design SFX layer.

---

## 6. Catalog strategy — seed now + growth pipeline (the core of this build)

### 6a. Principle
Every track is an **embed**, not a file. The catalog is a table of metadata + `videoId`s pointing at content the rights holders themselves uploaded. This is lawful, free, and lets the design be the star.

### 6b. Source registry
Maintain a typed registry of **official label / artist channels and curated playlists**, each tagged with language/region/era hints. The pipeline reads only from these. Verified official channel IDs to seed the registry:

| Source | Type | ID / handle | Covers |
|---|---|---|---|
| Saregama Music (ex-HMV) | channel | `UC_A7K2dXFsTMAciGmnNxy-Q` | Hindi + regional golden age (largest vintage catalog in India) |
| Saregama Carvaan | channel | `@SaregamaCarvaan` | Curated golden-era Hindi |
| Saregama Ghazal | channel | `@saregamaghazal` | Ghazals (Jagjit, Talat, Rafi) |
| Shemaroo Filmi Gaane | channel | `UCP6uH_XlsxrXwZQ4DlqbqPg` | Old Hindi film songs (60s–90s) |
| Shemaroo 4K Hindi Songs | channel | `UCsuSg5nYeDwNJQ4_TKsZa8w` | Restored Hindi hits |

> Saregama (founded 1901 as The Gramophone Co. of India / HMV) holds the rights to the bulk of golden-age Hindi **and** regional catalogs (Bengali, Punjabi, Tamil, Telugu, Marathi, etc.) — make it the primary spine. Add T-Series, Tips, Ultra for Hindi; **Punjabi** via Saregama's Punjabi catalog + T-Series Apna Punjab; **Bengali** via Saregama Bengali + Hindustan Records/Asha Audio; **Western** via official artist/label channels, **Vevo**, and auto-generated **"Topic"** channels (label-fed "Art Tracks" — legitimate and usually embeddable), e.g. Rhino (WMG catalog), UMG, Sony catalog channels.

For each source also curate a few **playlist IDs** (e.g. "Old Hindi Songs | Saregama", decade and artist playlists). Treat specific playlist IDs as TODO to verify at build time — they change. Registry entry shape:

```ts
interface CatalogSource {
  kind: 'channel' | 'playlist';
  id: string;               // channelId or playlistId
  label: string;            // e.g. 'Saregama'
  language: 'hindi'|'punjabi'|'bengali'|'english'|'multi';
  region: 'india'|'west';
  eraHint?: string;         // '1950s-1970s'
  trusted: boolean;         // official rights-holder?
}
```

### 6c. Ingestion pipeline (Node + TypeScript service; run locally or as a cron job)

Use the **YouTube Data API v3** with an **API key** (read-only public data — no OAuth needed). Endpoints and the cheap path:

1. **Channel → uploads playlist.** `channels.list(part=contentDetails)` → `contentDetails.relatedPlaylists.uploads`. *Cost: 1 unit.*
2. **Enumerate cheaply.** Page through `playlistItems.list(part=contentDetails,snippet, maxResults=50, pageToken=…)` to collect `videoId`s. *Cost: 1 unit per 50 items.* **Do NOT use `search.list` for bulk — it costs 100 units/call and is capped ~100/day.** `playlistItems.list` is the 1-unit bulk path; use it.
3. **Batch-enrich.** `videos.list(part=snippet,contentDetails,status,statistics, id=<up to 50 comma-joined ids>)`. *Cost: 1 unit per 50 videos.* Pull: title, channelTitle, ISO-8601 `duration` (→ seconds), `status.embeddable`, `status.privacyStatus`, `statistics.viewCount`, `publishedAt`, thumbnails.
4. **Filter.** Keep only `embeddable === true` && `privacyStatus === 'public'`. Drop Shorts/clips (duration heuristics), trailers, interviews, jhankar/remix unless wanted, and karaoke.
5. **Parse metadata.** Titles look like `Lag Ja Gale | Woh Kaun Thi (1964) | Lata Mangeshkar`. Write a title parser (split on `|`/`-`, extract song / film / year / artist) plus a manual-override map for messy cases. Infer **era** from film year; tag **language/region** from the source registry.
6. **Dedupe.** The same song recurs across channels. Dedupe on a normalized `(song + primaryArtist)` key; keep the best candidate (prefer `trusted` channel, then highest `viewCount`). Assign stable internal IDs.
7. **Covers.** Use the video thumbnail as the cover fallback; allow manual album-art overrides for hero/featured items.
8. **Persist.** Write to a versioned **`/data/catalog.json`** for v1, behind a `CatalogRepository` interface so it can move to **SQLite/Postgres** later without touching the UI. Store source provenance per track.
9. **Quota-aware & resumable.** Track units spent; checkpoint the last `pageToken` per source so a run resumes after the **midnight Pacific-Time** quota reset. Because steps 2–3 are ~1 unit each, **thousands of tracks/day fit inside the default 10,000-unit quota** — the only expensive call (`search.list`) is avoided entirely.
10. **Availability re-check job.** Periodically re-run `videos.list(part=status)` over known IDs to drop anything that became private / region-blocked / non-embeddable, keeping the catalog clean.

Default quota is **10,000 units/day per Google Cloud project**, resets midnight PT; increases require a manual audit form (often slow/denied), so design to live within the default via the 1-unit path + caching.

### 6d. Scaling pattern
Seed (~200 hand-picked tracks, §9) ships in `catalog.json` immediately. Then point the pipeline at the registry and let it grow the catalog incrementally over successive daily runs. Cache aggressively; never re-fetch unchanged items except on the availability re-check.

### 6e. ToS / legal guardrails (follow exactly)
- **Embed only** via the IFrame Player API. **Never** download, scrape the media stream, proxy, or re-encode audio/video. Store **metadata + IDs** only.
- Respect `status.embeddable` and region availability; surface/skip unavailable tracks gracefully.
- Show attribution and a link back to the source video on YouTube where appropriate; honor takedowns by removing IDs.
- Don't strip or hide required player affordances beyond what the IFrame API officially allows. Keep usage within YouTube API ToS and quota.

---

## 7. (reserved — merged into §5/§6)

---

## 8. Data model

```ts
interface Track {
  id: string;
  title: { native: string; latin: string };   // native = Devanagari/Gurmukhi/Bengali
  script: 'devanagari'|'gurmukhi'|'bengali'|'latin';
  artists: string[];                            // artist ids
  film?: string; albumId?: string;
  year: number;
  era: '1950s'|'1960s'|'1970s'|'1980s'|'1990s';
  language: 'hindi'|'punjabi'|'bengali'|'english';
  region: 'india'|'west';
  durationSec: number;
  moods: string[]; genres: string[];
  cover: string;
  source: 'youtube'|'spotify'|'local';
  sourceId: string;                             // videoId
  provenance: { channelId: string; label: string; embeddable: boolean };
}

interface Artist { id: string; name: { native?: string; latin: string }; language: string; era: string; bio: string; photo?: string; }
interface Album  { id: string; title: { native?: string; latin: string }; artistId: string; year: number; cover: string; trackIds: string[]; }
interface Era    { decade: string; label: { native: string; latin: string }; palette: Record<string,string>; blurb: string; }
interface Mixtape{ id: string; name: string; trackIds: string[]; coverStyle: string; }  // stretch
```

Everything typed; expose typed selectors/hooks; UI reads through `CatalogRepository`.

---

## 9. Seed content (~200 tracks — placeholders to verify against available embeds)

Real, iconic, instantly recognizable starting points per bucket. Verify each resolves to an available, embeddable official upload before shipping.

**Bollywood golden age (50s–70s):** Lag Ja Gale (Lata, 1964) · Pyar Hua Ikrar Hua (Manna Dey & Lata, 1955) · Chura Liya Hai Tumne (Asha & Rafi, 1973) · Dum Maro Dum (Asha, 1971) · Yeh Shaam Mastani (Kishore, 1971) · Roop Tera Mastana (Kishore, 1969) · Mehbooba Mehbooba (R.D. Burman, 1975) · Kabhi Kabhie (Mukesh & Lata, 1976) · Mera Joota Hai Japani (Mukesh, 1955) · Aap Ki Nazron Ne Samjha (Lata, 1962) · Pukarta Chala Hoon Main (Rafi, 1965) · Lag Jaa Gale, Ajeeb Dastan Hai Yeh (Lata) · Hemant Kumar / Geeta Dutt / Talat Mahmood essentials.

**Bollywood retro (80s–90s):** I Am A Disco Dancer (Bappi/Vijay Benedict, 1982) · Jimmy Jimmy Aaja (Parvati Khan, 1982) · Ek Do Teen (1988) · Tujhe Dekha To (DDLJ, 1995) · Pehla Nasha (1992) · Tip Tip Barsa Pani (1994) · Kumar Sanu / Alka Yagnik / Udit Narayan signatures.

**Western / "Hollywood" retro (50s–80s):** Hotel California (Eagles, 1976) · Stayin' Alive (Bee Gees, 1977) · Take On Me (a-ha, 1985) · Dancing Queen (ABBA, 1976) · Sweet Dreams (Eurythmics, 1983) · Billie Jean (MJ, 1982) · Take Me Home Country Roads (John Denver, 1971) · I Will Survive (Gloria Gaynor, 1978) · Elvis / Beatles / Motown classics (via official/Topic channels).

**Punjabi (folk & film):** Lathe Di Chadar, Madhaniya, Kala Doria, Jutti Kasuri (Surinder Kaur — HMV/Saregama) · Asa Singh Mastana classics · Tere Tille Ton (Kuldeep Manak) · Amar Singh Chamkila essentials · Dil Da Mamla Hai (Gurdas Maan, 1981) · 80s Punjabi folk hits.

**Bengali (adhunik / film / Rabindra Sangeet):** Tumi Je Amar (Hemanta Mukherjee, 1959) · Ei Raat Tomar Amar · Ami Dur Hote Tomarei Dekhechi (Hemanta) · Coffee Houser Sei Adda, Jibone Ki Pabona (Manna Dey) · Sandhya Mukherjee classics · Purano Sei Diner Kotha, Tumi Robe Nirobe (Rabindra Sangeet) · Kishore Kumar's Bengali Puja songs.

(The pipeline expands each bucket to hundreds/thousands from the §6b registry.)

---

## 10. Art direction

> **Superseded by `docs/01-art-direction.md` ("The Groove").** Follow that document for all art direction and the hero concept — it is authoritative. §10–11 here are earlier background; where they differ, 01 wins.

**Mood:** warm, analog, golden-hour, slightly imperfect — sunlit record room, paper sleeves, brass and walnut, glowing valve amps, faded film. Not cold streaming. Neon only inside the disco/80s zone.

**Palette (CSS variables / Tailwind tokens):**
`--paper #F3E9D2` · `--paper-deep #E7D8B8` · `--ink #211A12` · `--amber #D98E2B` · `--terracotta #C0532E` · `--petrol #1E4546` · `--valve #F0A847` (reserved for *now-playing*) · `--rust #9C3B26`. Disco zone may layer `--neon-magenta #FF3D7F` / `--neon-cyan #00E0FF` over `--night #1A1238`, kept warm and grainy. Always check WCAG AA over textures.

**Typography — multilingual (use coherent super-families):**
- **Display:** Recoleta (Latin); **Baloo** per-script cuts for native display — *Baloo 2* (Devanagari), *Baloo Paaji 2* (Gurmukhi), *Baloo Da 2* (Bengali).
- **Body/UI:** *General Sans* / *Familjen Grotesk* (Latin); **Hind** family for native body — *Hind* (Devanagari), *Mukta Mahee* (Gurmukhi), *Hind Siliguri* (Bengali). Noto Sans/Serif {Devanagari,Gurmukhi,Bengali} as robust fallbacks.
- **Mono:** Space Mono / Martian Mono for timestamps + the cassette "tape counter."
- Offer a **comfortable reading** mode (larger base + line-height) for the older audience.

**Texture:** animated film grain (SVG `feTurbulence` or tiny canvas), paper/cardboard surfaces, real vinyl grooves + light sweep, halftone dividers, warm vignette, sparing CRT chromatic aberration on hover. All gated by `prefers-reduced-motion`.

**Motion:** mechanical and weighty, never bouncy. Records spin at a believable 33⅓ feel and pause when paused; starting a track = a needle-drop; scrubbing = scrubbing a record/tape; transitions crossfade like a DJ; custom easings feel like a switch throwing or a cassette door closing.

**Sound design (key differentiator for a music app):** optional, never autoplaying — vinyl-crackle ambient loop, mechanical button clicks, a soft needle-drop on track start. Honor a global mute toggle and the autoplay policy (sound only after a gesture).

---

## 11. Signature interactions (the "wow" moments — build ≥ the first three)

1. **Hero turntable** — beautifully rendered vinyl; spins on playback; "drop the needle" to start (3D optional, gorgeous 2D fallback).
2. **Cassette "Now Playing"** — full-screen deck; reels turn and tape redistributes with progress; bilingual J-card (native + Latin).
3. **Radio-dial navigation between eras** — tune the dial to "stations" (50s/60s/70s/80s/90s); sweep crossfades the catalog and shifts the zone palette.
4. **Album as physical object** — slide the record partway out of its sleeve on hover/tap.
5. **Mixtape builder (stretch)** — playlist visualized as a labeled, decoratable cassette you can name and share.
6. **Decade time-travel** — art direction subtly shifts per decade, unified by grain + warmth.

---

## 12. Information architecture (pages)

`/` Lobby (hero turntable, featured, "tune in" entries) · `/era/[decade]` (radio-dial browse + decade shift) · `/language/[lang]` and `/region/[region]` (Hindi/Punjabi/Bengali/Western) · `/mood/[mood]` · `/artist/[id]` · `/album/[id]` · `/now-playing` (full-screen cassette; also an overlay) · `/mixtapes` *(stretch)* · `/search` (multilingual: matches native scripts + Latin transliteration) · `/about` (the story/design statement — useful for award submissions). A **persistent player bar** sits on every route and expands into `/now-playing`.

---

## 13. Tech stack

Next.js (App Router) + **TypeScript strict** · **Tailwind** + custom CSS for textures/effects (tokens from §10) · **Motion (Framer Motion)** for UI, **GSAP** for scroll/timeline choreography, **Lenis** for smooth scroll · **Zustand** for player/queue/source/sound state · audio via **YouTube IFrame API** behind the §5 abstraction, **Howler.js** for SFX/crackle · optional **React Three Fiber** hero with 2D fallback · **lucide-react** + custom retro SVGs · ingestion service in Node/TS using `googleapis` (YouTube Data API v3) · ESLint + Prettier, conventional commits.

---

## 14. Performance, accessibility & adaptive rendering

**Targets:** Lighthouse **90+** across Performance, Accessibility, Best Practices, SEO; green Core Web Vitals; lazy-load imagery; code-split 3D; subset + preload the (many) fonts — load native-script fonts on demand by route/content to avoid bloat.

**Accessibility (first-class):** WCAG **AA** contrast on every text/surface combo (test over textures); full keyboard nav + visible on-brand focus; generous touch targets; comfortable-reading toggle; `prefers-reduced-motion` disables spinning/grain/parallax/aberration → static/crossfade; proper roles/labels for the custom player; announce track changes politely.

**Adaptive rendering tiers:** A) WebGL turntable + full motion → B) animated 2D canvas/CSS → C) static SVG. Pick by capability + reduced-motion/data-saver.

**Responsive:** mobile-first (most listening is on phones); hero reflows to a centered tappable record; era dial becomes a swipeable tuner; test 360px → 1440px+, respect safe-area insets.

---

## 15. Build sequence (phases — each gated by its Definition of done)

**Phase 0 — Scaffold & tokens.** Next.js + TS strict + Tailwind + Motion + GSAP + Lenis + Zustand; fonts (Latin + Devanagari + Gurmukhi + Bengali + mono, loaded on demand); CSS-variable tokens; base layout; grain overlay + reduced-motion plumbing. *Done:* app boots; tokens/fonts render; grain respects reduced-motion; lint clean.

**Phase 1 — Design system.** Buttons (mechanical states), cards, sleeve surface, vinyl, dial, type scale + comfortable-reading toggle, texture/vignette layers. *Done:* a `/styleguide` route shows every primitive in warm + disco-neon variants, all AA-contrast, across all four scripts.

**Phase 2 — Catalog data layer + ingestion pipeline (§6).** Types (§8); `CatalogRepository` over `catalog.json`; the Node/TS ingestion service (channels→uploads→`playlistItems.list`→batched `videos.list`→filter/parse/dedupe/persist), quota-aware + resumable, with the §6b source registry and the §6e guardrails. *Done:* a single command ingests N hundred embeddable tracks across all four buckets into `catalog.json`, deduped and era/language-tagged, well under daily quota.

**Phase 3 — Audio abstraction + global player.** `AudioProvider` + working `YouTubeProvider` (hidden iframe; UI driven by API events); Zustand player store (track/queue/status/time/sound); persistent bottom bar (mini turntable + scrubber + controls); needle-drop SFX post-gesture. *Done:* play any catalog track from anywhere; queue/next/prev/seek work; spin pauses on pause; no visible iframe; survives route changes.

**Phase 4 — Home / Lobby + the Groove hero** (full spec: `docs/02-groove-hero.md`). Best available tier; featured records; "tune in" entries; concept line. *Done:* the era timeline morphs medium + palette + type + RPM in lockstep; hero looks award-worthy on mobile + desktop and degrades gracefully across tiers.

**Phase 5 — Browse: era dial + language/region + album/artist.** Radio-dial era nav with decade art-direction shift; language/region browse; album (pull-record-out) and artist pages. *Done:* tuning crossfades catalog + shifts palette; language/region filters work; album/artist pages play tracks.

**Phase 6 — Now Playing (cassette).** Full-screen deck: reels turn, tape redistributes with progress, bilingual J-card, scrub-as-tape. *Done:* reels animate to real progress; scrub works; opens from bar; reduced-motion variant clean.

**Phase 7 — Multilingual search.** Native-script + Latin/transliteration search across tracks/artists/albums. *Done:* typing in any of the four scripts (or romanized) returns correct, fast results.

**Phase 8 — Polish & audit.** Sound-design pass, micro-interactions, motion choreography, full a11y audit, Lighthouse/perf to targets, font-loading optimization. *Done:* Lighthouse 90+ all categories; a11y passes; motion feels mechanical and intentional.

**Phase 9 — Availability re-check job + Mixtape builder (stretch).** Scheduled `videos.list(part=status)` cleanup; cassette-style playlist builder with labeling/decoration and a shareable view. *Done:* stale IDs auto-pruned; users can create, name, decorate, save, and share a mixtape cassette.

---

## 16. Global rules for Claude Code

- TypeScript **strict**; component-driven, reusable; no unjustified `any`.
- **Embed-only** playback via the §5 abstraction; **never** download/rip/re-encode media; store metadata + IDs only (§6e).
- Read catalog through `CatalogRepository`; keep `catalog.json` swappable for a DB later.
- Ingestion stays quota-aware: use the **1-unit** `playlistItems.list`/batched `videos.list` path, **never** bulk `search.list`; checkpoint + resume across the midnight-PT reset.
- **No autoplay**; audio + SFX only after a user gesture.
- Every motion/texture effect has a `prefers-reduced-motion` fallback.
- **Multilingual everywhere user-facing** (native script + Latin); load script fonts on demand.
- Maintain AA contrast on textured surfaces; never trade legibility for vibe.
- Mobile-first; verify 360px → 1440px+. Commit in logical, reviewable chunks.
- The thesis (§1) is the tiebreaker for every design micro-decision.

---

## 17. Definition of "award-caliber"
A juror should immediately feel the analog-warmth thesis; hit at least one memorable, novel interaction (turntable / dial / cassette); experience smooth, mechanical, intentional motion and tasteful sound; browse a catalog deep enough to feel limitless; and find it fast, accessible, and flawless on a phone — nostalgic enough for a 60-year-old, cool enough for a 25-year-old, across four musical cultures.
