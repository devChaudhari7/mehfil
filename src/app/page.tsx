import { GrooveStage } from "@/components/groove/GrooveStage";
import { HeroIntro } from "@/components/groove/HeroIntro";
import { HeroNav } from "@/components/groove/HeroNav";

/*
 * Home — the Groove hero (Phase 4). GrooveStage is the client orchestrator; the
 * static header + entry links are server components passed in so they stay out of
 * the client hydration chunk (Phase 8 perf). The persistent player bar + hidden
 * audio host live in World (root layout).
 */
export default function Home() {
  return <GrooveStage intro={<HeroIntro />} nav={<HeroNav />} />;
}
