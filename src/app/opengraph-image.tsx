import { ImageResponse } from "next/og";
import { SITE_TAGLINE } from "@/lib/site";

/* Generated social-share card (1200×630). Rendered at build by next/og (Satori). */
export const alt = "MEHFIL — Travel the groove";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(125% 120% at 50% 32%, #241809 0%, #0d0805 62%, #050507 100%)",
          color: "#f3e7cf",
        }}
      >
        {/* a record */}
        <div
          style={{
            width: 230,
            height: 230,
            borderRadius: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle at 50% 50%, #1a130b 0%, #0c0905 70%)",
            border: "2px solid #2a2014",
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
            marginBottom: 56,
          }}
        >
          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: 9999,
              background: "#d9a441",
              border: "6px solid #0d0805",
            }}
          />
        </div>

        <div style={{ fontSize: 132, letterSpacing: 14, fontWeight: 600 }}>MEHFIL</div>
        <div style={{ fontSize: 34, color: "#d9a441", marginTop: 18, letterSpacing: 1 }}>
          {SITE_TAGLINE}
        </div>
      </div>
    ),
    { ...size },
  );
}
