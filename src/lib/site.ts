/*
 * MEHFIL — canonical site URL for metadata / OG / sitemap / robots.
 * Override with NEXT_PUBLIC_SITE_URL once the production domain is known; on Vercel it
 * falls back to the project's production URL, then to a sensible default.
 */
export const SITE_URL: string =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://mehfil-groove.vercel.app");

export const SITE_NAME = "MEHFIL";
export const SITE_TAGLINE = "Don’t scroll the library. Travel the groove.";
export const SITE_DESCRIPTION =
  "A retro music listening experience for golden-age Indian (Hindi · Punjabi · Bengali) and classic Western records — analog warmth, made digital. Scroll the groove and travel through the eras.";
