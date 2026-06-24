"use client";

/*
 * SearchView — the /search route's client view. Reads the initial `?q`, and syncs
 * the debounced query back to the URL (shareable searches). Wrapped in <Suspense>
 * by the page so useSearchParams doesn't force the route to be dynamic.
 */
import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SearchBox } from "./SearchBox";

export function SearchView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const initial = params.get("q") ?? "";

  const onQueryChange = useCallback(
    (q: string) => {
      const next = q ? `${pathname}?q=${encodeURIComponent(q)}` : pathname;
      router.replace(next, { scroll: false });
    },
    [router, pathname],
  );

  return <SearchBox initialQuery={initial} autoFocus onQueryChange={onQueryChange} />;
}
