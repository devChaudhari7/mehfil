"use client";

import { useState, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import { ERAS } from "@/lib/eras";
import type { Script } from "@/lib/fonts";
import { ONE_PER_SCRIPT } from "@/lib/samples";
import {
  Body,
  Button,
  Card,
  Dial,
  Display,
  Halftone,
  Heading,
  Mono,
  NativeText,
  ReadingModeToggle,
  Sleeve,
  Vinyl,
} from "@/components/ui";

/* ----------------------------- layout helpers ---------------------------- */

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-16">
      <Heading level={2}>{title}</Heading>
      {blurb && <Body className="text-ink/70 mt-2 max-w-2xl">{blurb}</Body>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** A per-era panel: paints its own [data-era] stage so tokens visibly re-theme. */
function Zone({
  era,
  label,
  children,
}: {
  era: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <div
      data-era={era}
      className="surface-stage relative overflow-hidden rounded-2xl border border-white/10 p-6"
    >
      <Mono className="text-accent">{label}</Mono>
      <div className="mt-5">{children}</div>
    </div>
  );
}

/** Warm (1970s) + disco-neon (1980s) side by side — the Phase 1 DoD layout. */
function WarmAndNeon({ render }: { render: () => ReactNode }) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <Zone era="70s" label="Warm · 1970s">
        {render()}
      </Zone>
      <Zone era="80s" label="Disco-neon · 1980s">
        {render()}
      </Zone>
    </div>
  );
}

/* ------------------------------ demo content ----------------------------- */

function TypeSpecimen() {
  return (
    <div className="space-y-3">
      <Display>Mehfil</Display>
      <Heading level={1}>Travel the groove</Heading>
      <Heading level={2}>The medium is the map</Heading>
      <Heading level={3}>Don&rsquo;t scroll the library</Heading>
      <Body>
        Body copy in Familjen Grotesk — warm, legible, and calm enough for a long
        listening session.
      </Body>
      <Mono className="text-ink/70 block">MONO · 00:00 / 03:14 · 33⅓ RPM</Mono>
    </div>
  );
}

function ScriptSpecimen() {
  const scripts: Script[] = ["devanagari", "gurmukhi", "bengali", "latin"];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {scripts.map((s) => {
        const t = ONE_PER_SCRIPT[s];
        return (
          <div key={s}>
            <Mono className="text-accent">{s}</Mono>
            <div className="mt-2">
              <NativeText native={t.native} latin={t.latin} script={s} size="h2" />
            </div>
            <Mono className="text-ink/55 mt-2 block">{t.artist}</Mono>
          </div>
        );
      })}
    </div>
  );
}

function ButtonSpecimen() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="solid">Solid</Button>
      <Button variant="raised" led>
        Raised
      </Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="solid" size="sm">
        Small
      </Button>
      <Button variant="solid" size="lg">
        Large
      </Button>
      <Button variant="raised" disabled>
        Disabled
      </Button>
    </div>
  );
}

function CardSpecimen() {
  const t = ONE_PER_SCRIPT.devanagari;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card surface="stage">
        <Mono className="text-accent">Stage · glass</Mono>
        <div className="mt-3">
          <NativeText native={t.native} latin={t.latin} script="devanagari" size="h3" />
        </div>
        <Body className="text-ink/70 mt-2">
          Translucent dark panel over the era stage.
        </Body>
      </Card>
      <Card surface="paper">
        <Mono className="text-accent">Paper · cardboard</Mono>
        <div className="mt-3">
          <NativeText native={t.native} latin={t.latin} script="devanagari" size="h3" />
        </div>
        <Body className="text-ink/80 mt-2">
          Ink + accent auto-flip dark — AA-safe on light paper.
        </Body>
        <div className="mt-4">
          <Button variant="solid" size="sm">
            On paper
          </Button>
        </div>
      </Card>
    </div>
  );
}

function MediaSpecimen() {
  return (
    <div className="flex flex-wrap items-end gap-10">
      <div className="relative w-44">
        <div className="absolute top-8 -right-12 z-0">
          <Vinyl size={140} spinning label="33⅓" />
        </div>
        <div className="relative z-10">
          <Sleeve hole>
            <NativeText
              native="लग जा गले"
              latin="Lag Ja Gale"
              script="devanagari"
              size="h3"
            />
            <Mono className="mt-1 block">Saregama · 1964</Mono>
          </Sleeve>
        </div>
      </div>

      <div className="text-center">
        <Vinyl size={130} label="78" />
        <Mono className="text-ink/60 mt-3 block">static</Mono>
      </div>
      <div className="text-center">
        <Vinyl size={130} spinning label="33⅓" />
        <Mono className="text-ink/60 mt-3 block">spinning</Mono>
      </div>
    </div>
  );
}

function DialSpecimen() {
  const [v, setV] = useState(2);
  const labels = ERAS.map((e) => e.decade);
  return (
    <div className="flex flex-wrap items-center gap-8">
      <Dial
        value={v}
        positions={ERAS.length}
        labels={labels}
        onChange={setV}
        size={180}
        ariaLabel="Tune the era"
      />
      <div>
        <Mono className="text-accent">Tuned to</Mono>
        <Heading level={3} className="mt-1">
          {ERAS[v]?.decade ?? "—"}
        </Heading>
        <Body className="text-ink/60 mt-1">Focus + arrow keys / Home / End</Body>
      </div>
    </div>
  );
}

function Palette() {
  const swatches = [
    ["bg-ink", "ink"],
    ["bg-accent", "accent"],
    ["bg-glow", "glow"],
    ["bg-btn", "btn"],
  ] as const;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ERAS.map((e) => (
        <div
          key={e.id}
          data-era={e.id}
          className="surface-stage rounded-xl border border-white/10 p-4"
        >
          <Mono className="text-accent">{e.decade}</Mono>
          <div className="mt-3 flex gap-1.5">
            {swatches.map(([cls, name]) => (
              <span key={name} title={name} className={cx("h-6 w-6 rounded", cls)} />
            ))}
          </div>
          <Mono className="text-ink/55 mt-3 block">{e.mediumLabel}</Mono>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------- page ----------------------------------- */

export default function StyleguidePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <Mono className="text-accent">Mehfil · Phase 1 — Design System</Mono>
          <Heading level={1} className="mt-4">
            Styleguide
          </Heading>
          <Body className="text-ink/75 mt-3">
            Every primitive shown in a warm variant and the disco-neon (80s) variant,
            across all four scripts. All text is AA-contrast over each era&rsquo;s stage;
            motion honors reduced-motion.
          </Body>
        </div>
        <ReadingModeToggle />
      </header>

      <Halftone className="mt-8" />

      <Section
        title="Palette — the medium is the map"
        blurb="Each era derives its world from a physical medium. ink ≥ 14:1, accent/glow ≥ 3:1 over every stage."
      >
        <Palette />
      </Section>

      <Section
        title="Typography & type scale"
        blurb="Marcellus display · Familjen Grotesk body · Space Mono utility. Toggle comfortable reading (top-right) to bump base size + leading — it persists with no flash."
      >
        <WarmAndNeon render={() => <TypeSpecimen />} />
      </Section>

      <Section
        title="NativeText — four scripts"
        blurb="Native script first (with the right lang for shaping), Latin transliteration beneath."
      >
        <WarmAndNeon render={() => <ScriptSpecimen />} />
      </Section>

      <Section
        title="Button — mechanical press"
        blurb="solid / raised / ghost. Press throws the switch (translate + edge-shadow). Tab to see the on-brand focus ring."
      >
        <WarmAndNeon render={() => <ButtonSpecimen />} />
      </Section>

      <Section title="Card — stage glass & paper cardboard">
        <WarmAndNeon render={() => <CardSpecimen />} />
      </Section>

      <Section
        title="Sleeve & Vinyl"
        blurb="Cardboard jacket + record. Spin runs at a believable 33⅓ and freezes under reduced-motion."
      >
        <WarmAndNeon render={() => <MediaSpecimen />} />
      </Section>

      <Section
        title="Dial — radio tuner"
        blurb="Presentational + accessible (role=slider). The Phase 5 era-dial wires it to the catalog."
      >
        <WarmAndNeon render={() => <DialSpecimen />} />
      </Section>

      <footer className="mt-20 border-t border-white/10 pt-6">
        <Mono className="text-ink/55 block">
          Phase 1 design system · presentational primitives · Phase 4 composes these into
          the GrooveStage.
        </Mono>
      </footer>
    </main>
  );
}
