import { GrooveStage } from "@/components/groove/GrooveStage";

/*
 * Home — the Groove hero (Phase 4). Replaces the Phase 0 boot specimen.
 * GrooveStage is the client orchestrator; the persistent player bar + hidden
 * audio host live in World (root layout).
 */
export default function Home() {
  return <GrooveStage />;
}
