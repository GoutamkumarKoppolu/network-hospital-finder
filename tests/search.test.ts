import { describe, expect, it } from "vitest";
import { search } from "../src/search";
import type { Hospital } from "../src/types";

const h = (name: string, pincode: string): Hospital => ({ insurer: "star", name, address: "", city: "", state: "", pincode });

describe("search", () => {
  const data = [h("Zeta", "500001"), h("Alpha", "500001"), h("Beta", "500044"), h("Far", "600001"), h("NoPin", "")];

  it("returns null for invalid pincodes", () => {
    for (const p of ["", "50001", "5000011", "050001", "50a001"]) expect(search(data, p)).toBeNull();
  });

  it("puts exact matches first, then nearby by first 3 digits, each sorted by name", () => {
    expect(search(data, "500001")!.map((r) => [r.name, r.nearby])).toEqual([
      ["Alpha", false],
      ["Zeta", false],
      ["Beta", true],
    ]);
  });

  it("skips nearby when there are 5+ exact matches", () => {
    const many = [...["A", "B", "C", "D", "E"].map((n) => h(n, "500001")), h("Near", "500002")];
    expect(search(many, "500001")!.some((r) => r.nearby)).toBe(false);
  });

  it("returns empty when nothing matches", () => expect(search(data, "110001")).toEqual([]));
});
