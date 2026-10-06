import type { Hospital } from "./types";

export type Result = Hospital & { nearby: boolean };

export const isValidPincode = (p: string) => /^[1-9]\d{5}$/.test(p);

const byName = (a: Hospital, b: Hospital) => a.name.localeCompare(b.name);

/** Exact pincode matches; if fewer than 5, add "Nearby" ones sharing the first 3 digits. Null if pincode is invalid. */
export function search(hospitals: Hospital[], pincode: string): Result[] | null {
  if (!isValidPincode(pincode)) return null;
  const exact = hospitals.filter((h) => h.pincode === pincode).sort(byName);
  const region = pincode.slice(0, 3);
  const nearby =
    exact.length < 5 ? hospitals.filter((h) => h.pincode !== pincode && h.pincode.startsWith(region)).sort(byName) : [];
  return [...exact.map((h) => ({ ...h, nearby: false })), ...nearby.map((h) => ({ ...h, nearby: true }))];
}
