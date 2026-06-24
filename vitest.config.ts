import path from "node:path";
import { defineConfig } from "vitest/config";

/*
 * Vitest config for the Phase 2 catalog data layer + ingestion pipeline.
 * Node environment (pure logic — no DOM); the `@` alias mirrors tsconfig so
 * tests can import "@/lib/catalog" and "@/data/catalog.json".
 */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(process.cwd(), "src") },
  },
  test: {
    environment: "node",
    include: ["scripts/**/*.test.ts", "src/**/*.test.ts"],
  },
});
