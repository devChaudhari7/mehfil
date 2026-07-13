// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_ERA } from "@/lib/eras";
import { useEraStore } from "./useEraStore";

beforeEach(() => {
  useEraStore.getState().setEra(DEFAULT_ERA);
});

describe("useEraStore", () => {
  it("setEra updates state and writes data-era on <html>", () => {
    useEraStore.getState().setEra("80s");
    expect(useEraStore.getState().era).toBe("80s");
    expect(document.documentElement.dataset.era).toBe("80s");
  });

  it("next/prev clamp at the ends (now 50s ↔ 20s)", () => {
    useEraStore.getState().setEra("20s");
    useEraStore.getState().next();
    expect(useEraStore.getState().era).toBe("20s");

    useEraStore.getState().setEra("50s");
    useEraStore.getState().prev();
    expect(useEraStore.getState().era).toBe("50s");

    useEraStore.getState().next();
    expect(useEraStore.getState().era).toBe("60s");

    useEraStore.getState().setEra("10s");
    useEraStore.getState().next();
    expect(useEraStore.getState().era).toBe("20s"); // the timeline reaches today
  });
});
