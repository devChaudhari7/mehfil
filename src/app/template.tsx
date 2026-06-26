/*
 * Route entrance (Phase 10). Unlike layout.tsx, a template.tsx RE-MOUNTS on every
 * navigation, so wrapping the page content here replays a subtle rise-in on each
 * route change. The persistent World (stage / grain / player bar) lives in
 * layout.tsx and does NOT re-mount — only the page content animates, so the
 * background and transport stay continuous. Reduced-motion: the global
 * prefers-reduced-motion block zeroes the animation → an instant cross-cut
 * (docs/01 §7).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="route-enter">{children}</div>;
}
