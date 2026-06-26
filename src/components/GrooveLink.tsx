"use client";

/*
 * GrooveLink — the explicit navigation primitive (Phase 12). Wraps next/link so it
 * keeps prefetch + a real <a> (no-JS + a11y), and on a plain left-click routes the
 * navigation through the View-Transition controller with an intent (auto-derived
 * from the destination, or overridden via `intent`). Chosen over a global click
 * interceptor for explicit intent, debuggability, and fewer edge cases.
 */
import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";
import { travel, type Intent } from "@/lib/useGrooveTransition";

type GrooveLinkProps = ComponentProps<typeof Link> & { intent?: Intent };

export function GrooveLink({ intent, onClick, ...props }: GrooveLinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented) return;
    // Let the browser handle modified clicks / new-tab / non-internal targets.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (props.target && props.target !== "_self") return;
    if (typeof props.href !== "string" || !props.href.startsWith("/")) return;
    e.preventDefault();
    travel(props.href, intent);
  }
  return <Link {...props} onClick={handleClick} />;
}
