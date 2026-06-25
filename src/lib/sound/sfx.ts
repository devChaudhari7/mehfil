/*
 * MEHFIL — sound-design SFX (brief §10/§6 sound design).
 *
 * The analog sound layer: a soft needle-drop on track start and an optional
 * vinyl-crackle ambient loop. Per the decided approach these are SYNTHESIZED at
 * runtime as small WAV data URIs and played through Howler — no committed audio,
 * no licensing. Gated by the autoplay policy: nothing sounds until unlockAudio()
 * runs inside the first user gesture, and never while muted.
 *
 * Audio ≠ motion, so this layer is intentionally independent of reduced-motion.
 */
import { Howl, Howler } from "howler";

const SAMPLE_RATE = 44100;

const clamp = (v: number) => Math.max(-1, Math.min(1, v));

function bytesToBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** Encode mono Float32 PCM as a 16-bit WAV data URI. */
export function samplesToWavDataUri(samples: Float32Array, sampleRate = SAMPLE_RATE): string {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = clamp(samples[i] ?? 0);
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return `data:audio/wav;base64,${bytesToBase64(new Uint8Array(buffer))}`;
}

/** Soft needle-drop: a low thump + a brief contact click + surface settle. */
export function buildNeedleDrop(): string {
  const dur = 0.45;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const thump = Math.sin(2 * Math.PI * 70 * t) * Math.exp(-t * 9) * 0.8;
    const click = t < 0.012 ? (Math.random() * 2 - 1) * (1 - t / 0.012) * 0.6 : 0;
    const settle = (Math.random() * 2 - 1) * Math.exp(-t * 6) * 0.05;
    s[i] = clamp(thump + click + settle);
  }
  return samplesToWavDataUri(s);
}

/** Loopable vinyl crackle: low hiss bed + sparse decaying pops. */
export function buildCrackle(): string {
  const dur = 2.2;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = (Math.random() * 2 - 1) * 0.015;
  const pops = 90;
  for (let p = 0; p < pops; p++) {
    const at = Math.floor(Math.random() * n);
    const amp = 0.2 + Math.random() * 0.5;
    const len = 30 + Math.floor(Math.random() * 60);
    for (let j = 0; j < len && at + j < n; j++) {
      s[at + j] = (s[at + j] ?? 0) + (Math.random() * 2 - 1) * amp * Math.exp(-j / 12);
    }
  }
  for (let i = 0; i < n; i++) s[i] = clamp(s[i] ?? 0);
  return samplesToWavDataUri(s);
}

/** Heavy shellac crackle (50s): denser, louder pops over a hiss bed. */
export function buildShellacCrackle(): string {
  const dur = 2.4;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = (Math.random() * 2 - 1) * 0.022;
  const pops = 170;
  for (let p = 0; p < pops; p++) {
    const at = Math.floor(Math.random() * n);
    const amp = 0.25 + Math.random() * 0.55;
    const len = 30 + Math.floor(Math.random() * 70);
    for (let j = 0; j < len && at + j < n; j++) {
      s[at + j] = (s[at + j] ?? 0) + (Math.random() * 2 - 1) * amp * Math.exp(-j / 11);
    }
  }
  for (let i = 0; i < n; i++) s[i] = clamp(s[i] ?? 0);
  return samplesToWavDataUri(s);
}

/** Warm vinyl hiss (70s): a low-passed (warmer) noise bed with sparse soft pops. */
export function buildVinylWarmHiss(): string {
  const dur = 2.2;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = (Math.random() * 2 - 1) * 0.03;
  const pops = 36;
  for (let p = 0; p < pops; p++) {
    const at = Math.floor(Math.random() * n);
    const amp = 0.08 + Math.random() * 0.22;
    for (let j = 0; j < 28 && at + j < n; j++) {
      s[at + j] = (s[at + j] ?? 0) + (Math.random() * 2 - 1) * amp * Math.exp(-j / 12);
    }
  }
  // one-pole low-pass for "warmth"
  let prev = 0;
  for (let i = 0; i < n; i++) {
    prev += 0.22 * ((s[i] ?? 0) - prev);
    s[i] = clamp(prev * 1.6);
  }
  return samplesToWavDataUri(s);
}

/** Tape hiss (80s): steady high hiss with a slow wow/flutter amplitude wobble. */
export function buildTapeHiss(): string {
  const dur = 2.2;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const wobble = 0.82 + 0.18 * Math.sin(2 * Math.PI * 1.3 * t + Math.sin(t * 0.7));
    s[i] = clamp((Math.random() * 2 - 1) * 0.032 * wobble);
  }
  return samplesToWavDataUri(s);
}

/** CD near-silence (90s): a whisper of digital-floor hiss. */
export function buildCdSilence(): string {
  const dur = 2.2;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) s[i] = clamp((Math.random() * 2 - 1) * 0.004);
  return samplesToWavDataUri(s);
}

/** Mechanical cassette-door clunk: a thud + two contact clicks. */
export function buildCassetteClunk(): string {
  const dur = 0.3;
  const n = Math.floor(SAMPLE_RATE * dur);
  const s = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const thud = Math.sin(2 * Math.PI * 105 * t) * Math.exp(-t * 26) * 0.5;
    const body = Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 38) * 0.18;
    const click1 = t < 0.006 ? (Math.random() * 2 - 1) * (1 - t / 0.006) * 0.5 : 0;
    const click2 = t > 0.085 && t < 0.097 ? (Math.random() * 2 - 1) * 0.4 : 0;
    s[i] = clamp(thud + body + click1 + click2);
  }
  return samplesToWavDataUri(s);
}

// --- runtime SFX manager -------------------------------------------------

/** Era-appropriate ambient bed (shellac crackle → vinyl noise → warm hiss → tape
 *  hiss → CD near-silence). Driven by the current era zone while a track plays. */
export type AmbienceKind = "shellac" | "vinyl" | "vinylWarm" | "tape" | "cd";

const BED_BUILD: Record<AmbienceKind, () => string> = {
  shellac: buildShellacCrackle,
  vinyl: buildCrackle,
  vinylWarm: buildVinylWarmHiss,
  tape: buildTapeHiss,
  cd: buildCdSilence,
};
const BED_VOLUME: Record<AmbienceKind, number> = {
  shellac: 0.24,
  vinyl: 0.18,
  vinylWarm: 0.16,
  tape: 0.2,
  cd: 0.06,
};

let needleUri: string | null = null;
let clunkUri: string | null = null;
let needle: Howl | null = null;
let clunk: Howl | null = null;
const bedHowls: Partial<Record<AmbienceKind, Howl>> = {};
let currentBed: AmbienceKind | null = null;
let unlocked = false;
let muted = false;

function ensureNeedle(): void {
  needleUri ??= buildNeedleDrop();
  needle ??= new Howl({ src: [needleUri], format: ["wav"], volume: 0.7 });
}
function ensureClunk(): void {
  clunkUri ??= buildCassetteClunk();
  clunk ??= new Howl({ src: [clunkUri], format: ["wav"], volume: 0.55 });
}
function ensureBed(kind: AmbienceKind): Howl {
  let h = bedHowls[kind];
  if (!h) {
    h = new Howl({ src: [BED_BUILD[kind]()], format: ["wav"], loop: true, volume: BED_VOLUME[kind] });
    bedHowls[kind] = h;
  }
  return h;
}

/** Call inside the first user gesture: resume the audio context + prime SFX. */
export function unlockAudio(): void {
  unlocked = true;
  try {
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== "running") void ctx.resume();
    ensureNeedle();
    // resume any ambience requested before the gesture unlocked audio
    if (currentBed && !muted) ensureBed(currentBed).play();
  } catch {
    /* audio unavailable — non-fatal */
  }
}

export function playNeedleDrop(): void {
  if (!unlocked || muted) return;
  try {
    ensureNeedle();
    needle?.play();
  } catch {
    /* non-fatal */
  }
}

/** Mechanical cassette-door clunk (Now Playing deck open / cassette transition). */
export function playCassetteClunk(): void {
  if (!unlocked || muted) return;
  try {
    ensureClunk();
    clunk?.play();
  } catch {
    /* non-fatal */
  }
}

/** Crossfade the looping ambient bed to an era kind (null = silence). Remembers the
 *  request even before unlock / while muted, so unlock + unmute can resume it. */
export function setAmbience(kind: AmbienceKind | null): void {
  for (const [k, h] of Object.entries(bedHowls)) {
    if (k !== kind) {
      try {
        h?.stop();
      } catch {
        /* non-fatal */
      }
    }
  }
  currentBed = kind;
  if (!kind || !unlocked || muted) return;
  try {
    const h = ensureBed(kind);
    if (!h.playing()) h.play();
  } catch {
    /* non-fatal */
  }
}

export function stopAmbience(): void {
  currentBed = null;
  for (const h of Object.values(bedHowls)) {
    try {
      h?.stop();
    } catch {
      /* non-fatal */
    }
  }
}

export function applyMuted(value: boolean): void {
  muted = value;
  try {
    Howler.mute(value);
    if (value) {
      for (const h of Object.values(bedHowls)) {
        try {
          h?.stop();
        } catch {
          /* non-fatal */
        }
      }
    } else if (currentBed && unlocked) {
      ensureBed(currentBed).play();
    }
  } catch {
    /* non-fatal */
  }
}
