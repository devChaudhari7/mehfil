"use client";

/*
 * SearchBox — the debounced multilingual search input + results. Shared by the
 * /search route and the ⌘K palette. Holds the raw query, debounces it, and renders
 * grouped results. `onQueryChange` (route only) syncs the debounced query to the URL;
 * `onSelect` (palette) closes after a choice.
 */
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cx } from "@/lib/cx";
import { useDebouncedValue } from "./useDebouncedValue";
import { useCatalogSearch } from "./useCatalogSearch";
import { SearchResults } from "./SearchResults";

export function SearchBox({
  initialQuery = "",
  autoFocus = false,
  onSelect,
  onQueryChange,
  className,
}: {
  initialQuery?: string;
  autoFocus?: boolean;
  onSelect?: () => void;
  onQueryChange?: (q: string) => void;
  className?: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const debounced = useDebouncedValue(query, 150);
  const results = useCatalogSearch(debounced);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    onQueryChange?.(debounced);
  }, [debounced, onQueryChange]);

  return (
    <div className={cx("w-full", className)}>
      <div className="focus-within:border-accent/60 flex items-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3 transition-colors duration-[var(--dur-1)] ease-[var(--ease-out)]">
        <Search size={18} className="text-ink/50 shrink-0" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, artists, films — any script"
          aria-label="Search the catalog"
          autoComplete="off"
          className="text-ink placeholder:text-ink/40 w-full bg-transparent font-body outline-none"
        />
      </div>
      <div className="mt-6">
        <SearchResults results={results} query={debounced} onSelect={onSelect} />
      </div>
    </div>
  );
}
