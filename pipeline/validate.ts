import type { Hospital } from "../src/types";

export function validate(hospitals: Hospital[], prevCount: number | undefined, duplicatesRemoved: number) {
  const count = hospitals.length;
  const withPin = hospitals.filter((h) => /^[1-9]\d{5}$/.test(h.pincode)).length;
  const pinPct = count ? (withPin / count) * 100 : 0;
  const errors: string[] = [];

  if (count < 1) errors.push("No hospitals parsed.");
  if (prevCount && count < prevCount * 0.7) errors.push(`Count dropped more than 30%: ${prevCount} → ${count}.`);
  if (pinPct < 80) errors.push(`Only ${pinPct.toFixed(1)}% have a valid pincode (need 80%).`);
  const noName = hospitals.filter((h) => !h.name).length;
  if (noName) errors.push(`${noName} hospitals have an empty name.`);

  const sample = [...hospitals].sort(() => Math.random() - 0.5).slice(0, 5);
  const report = [
    `Total: ${count}${prevCount ? ` (previous ${prevCount})` : ""}`,
    `With pincode: ${pinPct.toFixed(1)}%`,
    `Duplicates removed: ${duplicatesRemoved}`,
    "Sample:",
    ...sample.map((h) => `  ${h.name} | ${h.address} | ${h.city} | ${h.state} | ${h.pincode}`),
    ...errors.map((e) => `FAIL: ${e}`),
  ].join("\n");

  return { ok: errors.length === 0, errors, report };
}
