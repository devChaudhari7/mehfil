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

// --- runtime SFX manager -------------------------------------------------

let needleUri: string | null = null;
let crackleUri: string | null = null;
let needle: Howl | null = null;
let crackle: Howl | null = null;
let unlocked = false;
let muted = false;

function ensureHowls(): void {
  needleUri ??= buildNeedleDrop();
  crackleUri ??= buildCrackle();
  needle ??= new Howl({ src: [needleUri], format: ["wav"], volume: 0.7 });
  crackle ??= new Howl({ src: [crackleUri], format: ["wav"], loop: true, volume: 0.22 });
}

/** Call inside the first user gesture: resume the audio context + prime Howls. */
export function unlockAudio(): void {
  unlocked = true;
  try {
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== "running") void ctx.resume();
    ensureHowls();
  } catch {
    /* audio unavailable — non-fatal */
  }
}

export function playNeedleDrop(): void {
  if (!unlocked || muted) return;
  try {
    ensureHowls();
    needle?.play();
  } catch {
    /* non-fatal */
  }
}

export function startCrackle(): void {
  if (!unlocked || muted) return;
  try {
    ensureHowls();
    if (crackle && !crackle.playing()) crackle.play();
  } catch {
    /* non-fatal */
  }
}

export function stopCrackle(): void {
  try {
    crackle?.stop();
  } catch {
    /* non-fatal */
  }
}

export function applyMuted(value: boolean): void {
  muted = value;
  try {
    Howler.mute(value);
    if (value) stopCrackle();
  } catch {
    /* non-fatal */
  }
}
