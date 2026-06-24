// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildCrackle, buildNeedleDrop, samplesToWavDataUri } from "./sfx";

function decodeHeader(dataUri: string): { prefixOk: boolean; riff: string; wave: string } {
  const prefix = "data:audio/wav;base64,";
  const prefixOk = dataUri.startsWith(prefix);
  const bin = atob(dataUri.slice(prefix.length));
  return { prefixOk, riff: bin.slice(0, 4), wave: bin.slice(8, 12) };
}

describe("samplesToWavDataUri", () => {
  it("emits a base64 WAV data URI with a valid RIFF/WAVE header", () => {
    const uri = samplesToWavDataUri(new Float32Array([0, 0.5, -0.5, 1, -1]));
    const { prefixOk, riff, wave } = decodeHeader(uri);
    expect(prefixOk).toBe(true);
    expect(riff).toBe("RIFF");
    expect(wave).toBe("WAVE");
  });
});

describe("SFX synthesis", () => {
  it("builds a needle-drop WAV", () => {
    const { prefixOk, riff, wave } = decodeHeader(buildNeedleDrop());
    expect(prefixOk).toBe(true);
    expect(riff).toBe("RIFF");
    expect(wave).toBe("WAVE");
  });

  it("builds a crackle WAV", () => {
    const { prefixOk, riff, wave } = decodeHeader(buildCrackle());
    expect(prefixOk).toBe(true);
    expect(riff).toBe("RIFF");
    expect(wave).toBe("WAVE");
  });
});
