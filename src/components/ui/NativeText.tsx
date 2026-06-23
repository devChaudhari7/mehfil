import { scriptFont, type Script } from "@/lib/fonts";
import { cx } from "@/lib/cx";

/*
 * NativeText — renders a title in its OWN script first (via scriptFont), with
 * the Latin transliteration muted beneath (art-direction §3: "Song titles
 * render in their own script first, Latin transliteration second").
 *
 * The native line carries a `lang` attribute so the browser shapes the script
 * correctly and assistive tech announces it in the right language.
 */

const LANG: Record<Script, string> = {
  devanagari: "hi",
  gurmukhi: "pa",
  bengali: "bn",
  latin: "en",
};

const SIZE = {
  display: "text-display",
  h1: "text-h1",
  h2: "text-h2",
  h3: "text-h3",
  body: "text-body",
} as const;

export interface NativeTextProps {
  native: string;
  latin: string;
  script: Script;
  size?: keyof typeof SIZE;
  showLatin?: boolean;
  className?: string;
}

export function NativeText({
  native,
  latin,
  script,
  size = "h2",
  showLatin = true,
  className,
}: NativeTextProps) {
  const font = scriptFont(script);
  // For a Latin-script title the "native" already is the Latin form — don't
  // print it twice.
  const latinIsRedundant = script === "latin" || latin === native;

  return (
    <span className={cx("block", className)}>
      <span
        lang={LANG[script]}
        className={cx("text-ink block leading-tight", font.display, SIZE[size])}
      >
        {native}
      </span>
      {showLatin && !latinIsRedundant && (
        <span lang="en" className="font-display text-small text-ink/70 mt-1 block">
          {latin}
        </span>
      )}
    </span>
  );
}
