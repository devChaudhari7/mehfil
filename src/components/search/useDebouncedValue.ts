"use client";

import { useEffect, useState } from "react";

/** Returns `value` after it has stopped changing for `ms` (search input debounce). */
export function useDebouncedValue<T>(value: T, ms = 150): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}
