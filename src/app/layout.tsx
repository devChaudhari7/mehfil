import type { Metadata, Viewport } from "next";
import { fontVariables } from "@/lib/fonts";
import { DEFAULT_ERA } from "@/lib/eras";
import { READING_NO_FLASH_SCRIPT } from "@/lib/useReadingMode";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import { World } from "@/components/World";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "MEHFIL — मेहफ़िल · Travel the groove",
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "retro music",
    "vinyl",
    "Bollywood golden age",
    "Hindi songs",
    "Punjabi",
    "Bengali",
    "classic Western retro",
    "turntable",
    "MEHFIL",
  ],
  authors: [{ name: "Dev Chaudhari", url: "https://dc-taupe.vercel.app/" }],
  creator: "Dev Chaudhari",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "MEHFIL — Travel the groove",
    description: SITE_TAGLINE,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "MEHFIL — Travel the groove",
    description: SITE_TAGLINE,
    creator: "@devchaudhari",
  },
};

export const viewport: Viewport = {
  themeColor: "#050507",
  colorScheme: "dark",
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
