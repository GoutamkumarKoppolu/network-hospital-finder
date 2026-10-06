import { createHash } from "node:crypto";
import fs from "node:fs";
import type { Hospital, InsurerId } from "../src/types";

export type RawHospital = Omit<Hospital, "insurer">;
export type Fix = { insurer: InsurerId; name: string; pincode: string; patch: Partial<RawHospital> };

export const USER_AGENT = "network-hospital-finder (+https://github.com/GoutamkumarKoppolu/network-hospital-finder)";

const PIN = /\b[1-9]\d{5}\b/g;

/** Prefer the pincode column; else the last 6-digit match in the address; else "". */
export function extractPincode(pinField: string, address: string): string {
  return pinField.match(PIN)?.[0] ?? address.match(PIN)?.at(-1) ?? "";
}

const oneLine = (s: string) => s.replace(/\s+/g, " ").trim();

export function titleCase(s: string): string {
  return oneLine(s).toLowerCase().replace(/(^|[\s(\-/.])\p{L}/gu, (m) => m.toUpperCase());
}

/** Trim, collapse spaces, ALL CAPS → Title Case, drop trailing punctuation. */
export function cleanName(s: string): string {
  const n = oneLine(s);
  const cased = /\p{L}/u.test(n) && n === n.toUpperCase() ? titleCase(n) : n;
  return cased.replace(/[\s.,;:\-]+$/, "");
}

export function clean(rows: RawHospital[], insurer: InsurerId): Hospital[] {
  return rows.map((r) => ({
    insurer,
    name: cleanName(r.name),
    address: oneLine(r.address).replace(/,+$/, ""),
    city: titleCase(r.city),
    state: titleCase(r.state),
    pincode: extractPincode(r.pincode, r.address),
  }));
}

export function applyFixes(hospitals: Hospital[], fixes: Fix[], insurer: InsurerId): Hospital[] {
  const mine = fixes.filter((f) => f.insurer === insurer);
  return hospitals.map((h) => {
    const fix = mine.find((f) => f.name === h.name && f.pincode === h.pincode);
    return fix ? { ...h, ...fix.patch } : h;
  });
}

/** Key = lowercase(name) + pincode. Keeps the first. */
export function dedupe(hospitals: Hospital[]): { hospitals: Hospital[]; removed: number } {
  const seen = new Set<string>();
  const kept = hospitals.filter((h) => {
    const key = h.name.toLowerCase() + h.pincode;
    return !seen.has(key) && !!seen.add(key);
  });
  return { hospitals: kept, removed: hospitals.length - kept.length };
}

export const hashFile = (path: string) => createHash("sha256").update(fs.readFileSync(path)).digest("hex");
