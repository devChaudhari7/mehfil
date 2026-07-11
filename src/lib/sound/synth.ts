/*
 * MEHFIL — the era drone engine (Phase 15.7). The score of the idle world.
 *
 * A real-time Web Audio synth (zero audio files) that breathes under the journey:
 * a tanpura-like Sa–Pa–Sa′ for the golden decades (detuned partials swelling in
 * slow strum cycles through a warm lowpass), a detuned analog pad for the 80s,
 * near-silent glass air for the 90s. Built on Howler's AudioContext and routed
 * THROUGH Howler.masterGain, so the global mute/volume govern it like every
 * other sound. Crossfades ~2.5s between eras.
 *
 * Playback etiquette: the caller keeps the drone active only while the world is
 * idle (unlocked, no track playing) — the moment the needle drops, the drone bows
 * out and the era ambience beds take over. Nothing sounds before the first
 * gesture (the context doesn't exist until then).
 */
import { Howler } from "howler";
import type { EraId } from "@/lib/eras";

export interface DroneVoice {
  type: OscillatorType;
  /** Hz. */
  freq: number;
  /** Cents. */
  detune?: number;
  /** Relative voice gain 0..1. */
  gain: number;
  /** Strum/breath cycle rate in Hz (very slow). */
  lfoRate: number;
  /** How much of the voice the breath modulates, 0..1. */
  lfoDepth: number;
}

export interface DronePatch {
  /** Lowpass cutoff in Hz — the warmth of the era. */
  cutoff: number;
  /** Overall patch level (kept whisper-quiet). */
  level: number;
  voices: DroneVoice[];
}

/** A ≈ Sa. Sa–Pa–Sa′ (1 · 3/2 · 2) for the tanpura eras. */
export const DRONE_PATCHES: Record<EraId, DronePatch> = {
  "50s": {
    cutoff: 620,
    level: 0.05,
    voices: [
      { type: "triangle", freq: 110, gain: 0.5, lfoRate: 0.11, lfoDepth: 0.55 },
      { type: "triangle", freq: 165, gain: 0.32, lfoRate: 0.14, lfoDepth: 0.6 },
      { type: "sine", freq: 220, gain: 0.36, lfoRate: 0.09, lfoDepth: 0.5 },
    ],
  },
  "60s": {
    cutoff: 900,
    level: 0.05,
    voices: [
      { type: "triangle", freq: 110, gain: 0.46, lfoRate: 0.1, lfoDepth: 0.5 },
      { type: "triangle", freq: 165, gain: 0.34, lfoRate: 0.13, lfoDepth: 0.55 },
      { type: "sine", freq: 220, gain: 0.4, lfoRate: 0.08, lfoDepth: 0.45 },
    ],
  },
  "70s": {
    cutoff: 1100,
    level: 0.05,
    voices: [
      { type: "triangle", freq: 110, gain: 0.44, lfoRate: 0.1, lfoDepth: 0.5 },
      { type: "triangle", freq: 165, gain: 0.3, lfoRate: 0.12, lfoDepth: 0.55 },
      { type: "sine", freq: 220, gain: 0.36, lfoRate: 0.08, lfoDepth: 0.5 },
      { type: "sine", freq: 330, gain: 0.14, lfoRate: 0.06, lfoDepth: 0.7 },
    ],
  },
  "80s": {
    cutoff: 520,
    level: 0.045,
    voices: [
      { type: "sawtooth", freq: 110, detune: -7, gain: 0.34, lfoRate: 0.05, lfoDepth: 0.35 },
      { type: "sawtooth", freq: 110, detune: 7, gain: 0.34, lfoRate: 0.045, lfoDepth: 0.35 },
      { type: "sawtooth", freq: 220, detune: 3, gain: 0.18, lfoRate: 0.06, lfoDepth: 0.4 },
    ],
  },
  "90s": {
    cutoff: 2400,
    level: 0.02,
    voices: [
      { type: "sine", freq: 440, gain: 0.5, lfoRate: 0.04, lfoDepth: 0.9 },
      { type: "sine", freq: 880, gain: 0.16, lfoRate: 0.05, lfoDepth: 0.9 },
    ],
  },
};

interface ActiveDrone {
  era: EraId;
  gain: GainNode;
  stop: () => void;
}

let desiredEra: EraId | null = null;
let desiredActive = false;
let current: ActiveDrone | null = null;
let master: GainNode | null = null;

function audioCtx(): AudioContext | null {
  const c = (Howler as unknown as { ctx?: AudioContext }).ctx;
  return c ?? null;
}

function ensureMaster(c: AudioContext): GainNode {
  if (master) return master;
  master = c.createGain();
  master.gain.value = 0;
  const howlerMaster = (Howler as unknown as { masterGain?: GainNode }).masterGain;
  master.connect(howlerMaster ?? c.destination);
  return master;
}

function buildPatch(c: AudioContext, patch: DronePatch): { gain: GainNode; stop: () => void } {
  const out = c.createGain();
  out.gain.value = 0;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = patch.cutoff;
  filter.Q.value = 0.4;
  filter.connect(out);
  const stops: (() => void)[] = [];
  for (const v of patch.voices) {
    const osc = c.createOscillator();
    osc.type = v.type;
    osc.frequency.value = v.freq;
    osc.detune.value = v.detune ?? 0;
    const g = c.createGain();
    g.gain.value = v.gain * (1 - v.lfoDepth);
    const lfo = c.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = v.lfoRate;
    const lfoAmt = c.createGain();
    lfoAmt.gain.value = v.gain * v.lfoDepth * 0.5; // breathe around the base
    lfo.connect(lfoAmt);
    lfoAmt.connect(g.gain);
    osc.connect(g);
    g.connect(filter);
    osc.start();
    lfo.start(c.currentTime + Math.random() * 4); // strum phases drift apart
    stops.push(() => {
      try {
        osc.stop();
        lfo.stop();
        osc.disconnect();
        lfo.disconnect();
        lfoAmt.disconnect();
        g.disconnect();
      } catch {
        /* already stopped */
      }
    });
  }
  out.connect(ensureMaster(c));
  return {
    gain: out,
    stop: () => {
      for (const s of stops) s();
      try {
        filter.disconnect();
        out.disconnect();
      } catch {
        /* already disconnected */
      }
    },
  };
}

function sync(): void {
  const c = audioCtx();
  if (!c || !desiredEra) return;
  try {
    const m = ensureMaster(c);
    if (desiredActive) {
      if (!current || current.era !== desiredEra) {
        const patch = DRONE_PATCHES[desiredEra];
        const next = buildPatch(c, patch);
        next.gain.gain.setTargetAtTime(patch.level, c.currentTime, 1.1);
        const prev = current;
        current = { era: desiredEra, gain: next.gain, stop: next.stop };
        if (prev) {
          prev.gain.gain.setTargetAtTime(0, c.currentTime, 0.8);
          window.setTimeout(prev.stop, 3500);
        }
      }
      m.gain.setTargetAtTime(1, c.currentTime, 0.9);
    } else {
      m.gain.setTargetAtTime(0, c.currentTime, 0.6);
    }
  } catch {
    /* audio unavailable — non-fatal */
  }
}

/** The era whose drone should color the idle world. */
export function setDroneEra(era: EraId): void {
  desiredEra = era;
  sync();
}

/** Whether the drone should sound at all (idle world only — never over a track). */
export function setDroneActive(active: boolean): void {
  desiredActive = active;
  sync();
}
