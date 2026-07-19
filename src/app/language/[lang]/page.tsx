import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  catalogRepository,
  LANGUAGES,
  representativeEra,
  type Language,
} from "@/lib/catalog";
import { Heading, Mono } from "@/components/ui";
import { BrowseCollection, BrowseShell, SetEra } from "@/components/browse";

/*
 * /language/[lang] — browse by language (Hindi · Punjabi · Bengali · English).
 * The zone palette settles on the language's most-common era. Statically
 * generated for all four languages.
 */
const LABEL: Record<Language, string> = {
  hindi: "Hindi",
  punjabi: "Punjabi",
  bengali: "Bengali",
  english: "English",
};

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

function isLanguage(lang: string): lang is Language {
  return (LANGUAGES as readonly string[]).includes(lang);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLanguage(lang) ? `${LABEL[lang]} — MEHFIL` : "MEHFIL" };
}

export default async function LanguagePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLanguage(lang)) notFound();

  // server-only: pick the zone era + count; the lists render client-side (windowed)
  const tracks = catalogRepository.tracksByLanguage(lang);

  return (
    <>
      <SetEra era={representativeEra(tracks)} />
      <BrowseShell
        header={
          <>
            <Mono className="text-accent">Language</Mono>
            <Heading level={1} className="mt-4">
              {LABEL[lang]}
            </Heading>
            <p className="text-ink/70 mt-3 font-body">
              {tracks.length} records across the eras, in native script and Latin.
            </p>
          </>
        }
      >
        <BrowseCollection
          source={{ kind: "language", value: lang }}
          recordLabel={`${LABEL[lang]} records`}
        />
      </BrowseShell>
    </>
  );
}
