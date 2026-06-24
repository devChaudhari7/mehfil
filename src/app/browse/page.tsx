import type { Metadata } from "next";
import Link from "next/link";
import { Heading, Mono } from "@/components/ui";
import { SpiralNavigator } from "@/components/browse";

/*
 * /browse — the spiral navigator (art-direction Layer 1): travel the groove,
 * zooming era → records → tracks. The client navigator owns the interaction;
 * this server shell provides the heading + the always-available list parallel.
 */
export const metadata: Metadata = {
  title: "Travel the groove — MEHFIL",
};

export default function BrowsePage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-12 sm:py-16">
      <header className="max-w-2xl text-center">
        <Mono className="text-accent">Don&rsquo;t scroll the library</Mono>
        <Heading level={1} className="mt-4">
          Travel the groove
        </Heading>
        <p className="text-ink/70 mt-3 font-body">
          Zoom the groove from eras into a film&rsquo;s records, then its tracks. Use the dial,
          arrow keys, or your wheel — or{" "}
          <Link href="/catalog" className="hover:text-accent underline underline-offset-4">
            browse the full list
          </Link>
          .
        </p>
      </header>

      <div className="mt-12 w-full">
        <SpiralNavigator />
      </div>
    </main>
  );
}
