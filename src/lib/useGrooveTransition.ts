"use client";

/*
 * MEHFIL — Groove transition controller (Phase 12).
 *
 * Navigation must never feel like changing pages — it's travel through one vinyl
 * world, the record the anchor between scenes. This wires the browser-native View
 * Transitions API to the Next App Router (React 19 doesn't ship <ViewTransition>,
 * but `document.startViewTransition` is available). The App-Router pattern: the VT
 * update callback returns a promise resolved when the new route commits (the next
 * `pathname` change); a `data-vt` attribute on <html> selects the look in CSS.
 *
 * One mechanism, three intents:
 *   journey   — the record is the protagonist (/ ↔ /browse ↔ /album): shared
 *               `groove-record` morph + a settling camera.
 *   veil      — reserved, sparingly: era changes (a groove-iris wipe).
 *   crossfade — utility routes: a near-invisible ~180ms blur-fade.
 *
 * Degrades to a plain soft `router.push` when VT is unavailable or reduced-motion
 * is on. Navigation flows through the explicit <GrooveLink> (or `travel()` for
 * programmatic triggers) — deliberately NOT a global click interceptor.
 */
import { startTransition, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type Intent = "journey" | "veil" | "crossfade";

type VTDocument = Document & {
  startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> };
};

interface Controller {
  push: (href: string) => void;
  reduced: boolean;
}

// Module singleton so <GrooveLink>, the EraDial, and the hero ENTER all drive the
// same router instance without prop-drilling. Set by <GrooveTransitionRoot>.
let controller: Controller | null = null;
let resolvePending: (() => void) | null = null;

/** Default intent from the destination path (overridable per call). */
export function intentFor(href: string): Intent {
  const path = (href.split("?")[0] ?? href).split("#")[0] ?? href;
  if (path === "/" || path === "/browse" || path.startsWith("/album/")) return "journey";
  if (path.startsWith("/era/")) return "veil";
  return "crossfade";
}

/** Optional per-intent sound hook, wired up by GrooveTransitionRoot (Phase 12 C3/C4). */
let sound: ((intent: Intent) => void) | null = null;
export function setTransitionSound(fn: ((intent: Intent) => void) | null): void {
  sound = fn;
}

/** Travel to an internal route through the View Transition (or plain push). */
export function travel(href: string, intent?: Intent): void {
  const c = controller;
  if (!c) {
    if (typeof window !== "undefined") window.location.assign(href);
    return;
  }
  const i = intent ?? intentFor(href);
  const d = typeof document !== "undefined" ? (document as VTDocument) : null;
  const start = d?.startViewTransition?.bind(d);
  if (c.reduced || !start) {
    c.push(href);
    return;
  }
  sound?.(i);
  document.documentElement.dataset.vt = i;
  const vt = start(
    () =>
      new Promise<void>((resolve) => {
        resolvePending = resolve;
        startTransition(() => c.push(href));
        // Safety: a no-op navigation must never hang the transition.
        window.setTimeout(() => {
          if (resolvePending === resolve) {
            resolvePending = null;
            resolve();
          }
        }, 700);
      }),
  );
  vt.finished
    .finally(() => {
      if (document.documentElement.dataset.vt === i) delete document.documentElement.dataset.vt;
    })
    .catch(() => {});
}

/** Mounted once in World: keeps the controller fresh + resolves the VT on commit. */
export function GrooveTransitionRoot(): null {
  const router = useRouter();
  const pathname = usePathname();
  const reduced = useReducedMotion();

  // Keep the module singleton fresh in an effect (never during render).
  useEffect(() => {
    controller = { push: (href) => router.push(href), reduced };
    return () => {
      controller = null;
    };
  }, [router, reduced]);

  // Resolve the in-flight View Transition once the new route commits.
  useEffect(() => {
    if (resolvePending) {
      const resolve = resolvePending;
      resolvePending = null;
      resolve();
    }
  }, [pathname]);

  return null;
}
