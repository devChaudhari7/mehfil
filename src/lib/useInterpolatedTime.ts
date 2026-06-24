"use client";

/*
 * MEHFIL — interpolated playback clock (Phase 4 instruction #1).
 *
 * The YouTube provider emits `timeupdate` only ~every 250ms, so driving spins /
 * needle / reels off the raw store value looks steppy. This hook extrapolates a
 * smooth time between polls and exposes stable getTime()/getProgress() that any
 * animation loop (2D-canvas rAF, R3F useFrame, the DOM Needle) calls per frame —
 * with NO per-frame React re-renders.
 */
import { useCallback, useEffect, useRef } from "react";
import { usePlayerStore } from "@/lib/player/usePlayerStore";

export interface InterpolateInput {
  lastTime: number;
  lastWall: number;
  now: number;
  playing: boolean;
  duration: number;
}

/** Pure extrapolation: advance from the last poll while playing; freeze when not. */
export function interpolate({ lastTime, lastWall, now, playing, duration }: InterpolateInput): number {
  if (!playing) return lastTime;
  const t = lastTime + (now - lastWall) / 1000;
  return duration > 0 ? Math.min(t, duration) : t;
}

export interface InterpolatedClock {
  getTime: () => number;
  getProgress: () => number;
}

export function useInterpolatedTime(): InterpolatedClock {
  const ref = useRef({ lastTime: 0, lastWall: 0, playing: false, duration: 0 });

  useEffect(() => {
    const s = usePlayerStore.getState();
    ref.current = {
      lastTime: s.currentTime,
      lastWall: performance.now(),
      playing: s.status === "playing",
      duration: s.duration,
    };
    return usePlayerStore.subscribe((st) => {
      const prev = ref.current;
      const playing = st.status === "playing";
      // Re-baseline the wall clock only when the time or play-state actually moved.
      if (st.currentTime !== prev.lastTime || playing !== prev.playing) {
        ref.current = {
          lastTime: st.currentTime,
          lastWall: performance.now(),
          playing,
          duration: st.duration,
        };
      } else if (st.duration !== prev.duration) {
        ref.current = { ...prev, duration: st.duration };
      }
    });
  }, []);

  const getTime = useCallback(
    () => interpolate({ ...ref.current, now: performance.now() }),
    [],
  );
  const getProgress = useCallback(() => {
    const { duration } = ref.current;
    return duration > 0 ? Math.min(getTime() / duration, 1) : 0;
  }, [getTime]);

  return { getTime, getProgress };
}
