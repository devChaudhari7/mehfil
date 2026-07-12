/*
 * MEHFIL ingestion — bits shared by the CLI runners (ingest + recheck).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { assertCatalogShape, type CatalogData } from "@/lib/catalog/types";

export const ROOT = process.cwd();
export const CATALOG_PATH = path.join(ROOT, "src", "data", "catalog.json");

export async function readCatalog(): Promise<CatalogData> {
  const data: unknown = JSON.parse(await fs.readFile(CATALOG_PATH, "utf8"));
  assertCatalogShape(data);
  return data;
}

/**
 * Minimal, dependency-free .env.local loader (KEY=VALUE per line). Keeps the
 * npm scripts plain `tsx` (no reliance on Node's --env-file flag) while still
 * giving live runs a place to put YOUTUBE_API_KEY. Absent file ⇒ dry-run.
 */
export async function loadEnvLocal(): Promise<void> {
  if (process.env.YOUTUBE_API_KEY) return;
  try {
    const text = await fs.readFile(path.join(ROOT, ".env.local"), "utf8");
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (!m) continue;
      const key = m[1] as string;
      let value = m[2] as string;
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    /* no .env.local — fall through to dry-run */
  }
}
