/*
 * MEHFIL ingestion — quota-aware, resumable checkpoint (brief §6.9).
 * Persists the last pageToken per source, units spent (scoped to a Pacific-Time
 * date so the tally resets with YouTube's midnight-PT quota reset), and cached
 * @handle→channelId resolutions. Live runs only.
 *
 * Phase 17: lives at a COMMITTED path (scripts/ingest/state/) so the scheduled
 * GitHub Action resumes paging deterministically across weekly runs — a fresh CI
 * checkout would otherwise restart every source from page 1 forever.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Checkpoint } from "./types";

const FILE = path.join(process.cwd(), "scripts", "ingest", "state", "checkpoint.json");

/** Current date in America/Los_Angeles (YYYY-MM-DD) — the quota day. */
export function ptDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function loadCheckpoint(): Promise<Checkpoint> {
  const today = ptDate();
  try {
    const raw = JSON.parse(await fs.readFile(FILE, "utf8")) as Checkpoint;
    // New quota day → reset the unit tally (pageTokens are still valid to resume).
    if (raw.quotaDate !== today) return { ...raw, quotaDate: today, unitsSpent: 0 };
    return raw;
  } catch {
    return { quotaDate: today, unitsSpent: 0, perSource: {} };
  }
}

export async function saveCheckpoint(cp: Checkpoint): Promise<void> {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, `${JSON.stringify(cp, null, 2)}\n`, "utf8");
}
