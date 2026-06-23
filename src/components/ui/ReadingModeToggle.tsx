"use client";

import { useEffect } from "react";
import { ALargeSmall } from "lucide-react";
import { useReadingMode } from "@/lib/useReadingMode";
import { Button } from "@/components/ui/Button";

/*
 * Comfortable-reading toggle. The store hydrates from the DOM attribute the
 * no-flash script set, so the control reflects the real (persisted) state after
 * mount without causing a layout flash.
 */
export function ReadingModeToggle({ className }: { className?: string }) {
  const mode = useReadingMode((s) => s.mode);
  const hydrated = useReadingMode((s) => s.hydrated);
  const hydrate = useReadingMode((s) => s.hydrate);
  const toggle = useReadingMode((s) => s.toggle);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const comfortable = mode === "comfortable";

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-pressed={hydrated ? comfortable : undefined}
      aria-label="Toggle comfortable reading size"
      className={className}
    >
      <ALargeSmall className="h-4 w-4" aria-hidden="true" />
      Reading: {comfortable ? "Comfortable" : "Standard"}
    </Button>
  );
}
