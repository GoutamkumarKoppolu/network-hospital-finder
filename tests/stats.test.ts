import fs from "node:fs";
import { expect, it } from "vitest";
import { nextReportDue } from "../pipeline/stats";
import type { Insurer, StatsFile } from "../src/types";

it("expects the next IRDAI report by December of the year after the period ends", () => {
  expect(nextReportDue("2024-25").toISOString().slice(0, 10)).toBe("2026-12-01");
  expect(nextReportDue("")).toEqual(new Date(0));
});

it("insurer-stats.json has known insurers, plausible values and an IRDAI source", () => {
  const stats: StatsFile = JSON.parse(fs.readFileSync("public/data/insurer-stats.json", "utf8"));
  const ids = new Set((JSON.parse(fs.readFileSync("public/data/insurers.json", "utf8")) as Insurer[]).map((i) => i.id));
  const entries = Object.entries(stats.insurers);
  if (!entries.length) return; // not entered yet
  expect(stats.period).toMatch(/^\d{4}-\d{2}$/);
  for (const src of stats.sources) expect(src.url).toMatch(/^https:\/\/(www\.)?irdai\.gov\.in\//);
  expect(Number.isNaN(Date.parse(stats.updatedAt))).toBe(false);
  for (const [id, s] of entries) {
    expect(ids.has(id as Insurer["id"])).toBe(true);
    expect(Object.keys(s.healthIcr)).toContain(stats.period);
    for (const v of Object.values(s.healthIcr)) if (v !== null) expect(v > 0 && v < 300).toBe(true);
    expect(s.solvency > -10 && s.solvency < 100).toBe(true); // public sector insurers can be negative
    if (s.claims) expect(s.claims.paid + s.claims.repudiated).toBeLessThanOrEqual(s.claims.openAtStart + s.claims.reported);
    if (s.complaints) expect(s.complaints.reportedInclOpening - s.complaints.attended).toBe(s.complaints.closingBalance);
  }
});
