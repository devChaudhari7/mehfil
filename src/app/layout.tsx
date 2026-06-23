import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_ERA } from "@/lib/eras";
import { READING_NO_FLASH_SCRIPT } from "@/lib/useReadingMode";
import { World } from "@/components/World";
import "./globals.css";

export const metadata: Metadata = {
  title: "MEHFIL — मेहफ़िल",
  description:
    "A retro music listening experience for golden-age Indian and classic Western records — analog warmth, made digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // `data-era` on <html> selects the active era token set ([data-era] in
  // tokens.css), so the whole tree inherits its palette + grain.
  return (
    <html lang="en" data-era={DEFAULT_ERA} className={`${fontVariables} antialiased`}>
      <head>
        {/* No-flash: apply comfortable-reading before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: READING_NO_FLASH_SCRIPT }} />
      </head>
      <body>
        <World>{children}</World>
      </body>
    </html>
  );
}
