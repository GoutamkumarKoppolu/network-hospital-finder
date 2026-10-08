import fs from "node:fs";
import { describe, expect, it } from "vitest";
import type { Insurer } from "../src/types";

const insurers: Insurer[] = JSON.parse(fs.readFileSync("public/data/insurers.json", "utf8"));

describe("insurers.json", () => {
  it.each(insurers.map((i) => [i.id, i] as const))("%s has valid facts and links", (_, i) => {
    expect(i.irdaiRegNo).toMatch(/^\d{3}$/);
    expect(["Standalone health insurer", "General insurer"]).toContain(i.kind);
    expect(["Private sector", "Public sector"]).toContain(i.sector);
    expect(typeof i.listed).toBe("boolean");
    for (const url of [i.officialSite, i.hospitalSourceUrl, i.docsUrl, i.claimsUrl, i.grievanceUrl])
      if (url) expect(url).toMatch(/^https:\/\//);
  });
  it("has unique registration numbers", () =>
    expect(new Set(insurers.map((i) => i.irdaiRegNo)).size).toBe(insurers.length));
});
