// Says when IRDAI's next Annual Report should be out, so the figures in insurer-stats.json can be updated by hand.
// It never contacts irdai.gov.in: its robots.txt disallows all bots (checked 2026-10-09). Exit code 1 = update due.
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import type { StatsFile } from "../src/types";

/** The report for the year after `period` usually comes out by December of the following year. */
export function nextReportDue(period: string): Date {
  const start = Number(period.slice(0, 4)); // "2024-25" → 2024
  if (!start) return new Date(0); // nothing entered yet: due now
  return new Date(Date.UTC(start + 2, 11, 1)); // FY 2025-26 report → 1 Dec 2026
}

function main() {
  const stats: StatsFile = JSON.parse(fs.readFileSync("public/data/insurer-stats.json", "utf8"));
  const due = nextReportDue(stats.period);
  if (new Date() < due) {
    console.log(`IRDAI figures are for FY ${stats.period}. Next report expected after ${due.toISOString().slice(0, 10)}.`);
    return;
  }
  console.log(`IRDAI figures need an update (now: ${stats.period ? `FY ${stats.period}` : "none entered"}).

1. In a browser, download from irdai.gov.in (bots are not allowed there, so do this by hand):
   the latest Annual Report PDF and the latest Handbook on Indian Insurance Statistics (Excel files).
2. Annual Report: Statement 10 (incurred claims ratio, Health columns) and Statement 12 (solvency ratio, March).
   The plain text copy of these tables can shift rows; check each number against the printed page.
3. Handbook: Table 53 (status of claims), Table 56 (grievances), Table 58 (number of health policies, TOTAL).
   Standalone health insurers only: for general insurers these tables mix all lines of business.
4. Update public/data/insurer-stats.json: sources, period, updatedAt (now), and each insurer's figures
   (healthIcr: both years in the report, null where it prints NA or -).
5. Run npm test, then commit. Close this issue once the new figures are live.`);
  process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
