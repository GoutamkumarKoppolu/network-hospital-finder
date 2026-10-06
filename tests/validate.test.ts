import { describe, expect, it } from "vitest";
import { validate } from "../pipeline/validate";
import { processInsurer } from "../pipeline/update";
import type { Hospital, Insurer } from "../src/types";

const make = (n: number, withPin = n): Hospital[] =>
  Array.from({ length: n }, (_, i) => ({
    insurer: "star",
    name: `Hospital ${i}`,
    address: "",
    city: "",
    state: "",
    pincode: i < withPin ? "500001" : "",
  }));

describe("validate", () => {
  it("passes good data and prints a report", () => {
    const r = validate(make(100), 100, 3);
    expect(r.ok).toBe(true);
    expect(r.report).toContain("Duplicates removed: 3");
  });
  it("fails on more than 30% drop", () => expect(validate(make(69), 100, 0).ok).toBe(false));
  it("allows exactly 30% drop", () => expect(validate(make(70), 100, 0).ok).toBe(true));
  it("fails when under 80% have pincodes", () => expect(validate(make(100, 79), undefined, 0).ok).toBe(false));
  it("fails on empty list", () => expect(validate([], undefined, 0).ok).toBe(false));
  it("fails on an empty name", () => {
    const list = make(10);
    list[0].name = "";
    expect(validate(list, undefined, 0).ok).toBe(false);
  });
});

describe("processInsurer", () => {
  const insurer: Insurer = {
    id: "star", displayName: "Star", officialSite: "", hospitalSourceUrl: "https://example.org/list",
    download: "manual", newsQuery: "", note: "",
  };
  const parse = async () => [
    { name: "A HOSPITAL", address: "Hyd 500001", city: "", state: "", pincode: "" },
    { name: "a hospital", address: "dup", city: "", state: "", pincode: "500001" },
  ];

  it("cleans, dedupes and builds the file", async () => {
    const r = await processInsurer(insurer, "x", parse, []);
    expect(r.ok).toBe(true);
    expect(r.file).toMatchObject({ insurer: "star", sourceUrl: "https://example.org/list", count: 1 });
    expect(r.file.hospitals[0].name).toBe("A Hospital");
  });

  it("rejects a big drop versus the previous file", async () => {
    const prev = { insurer: "star" as const, sourceUrl: "", fetchedAt: "", count: 10, hospitals: [] };
    expect((await processInsurer(insurer, "x", parse, [], prev)).ok).toBe(false);
  });
});
