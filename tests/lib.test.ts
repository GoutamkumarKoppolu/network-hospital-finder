import { describe, expect, it } from "vitest";
import { applyFixes, clean, cleanName, dedupe, extractPincode } from "../pipeline/lib";

describe("extractPincode", () => {
  it("takes the pincode column first", () => expect(extractPincode("500001", "Road, Chennai 600001")).toBe("500001"));
  it("falls back to the address", () => expect(extractPincode("", "Nallakunta, Hyderabad - 500044")).toBe("500044"));
  it("takes the last match when the address has two", () =>
    expect(extractPincode("", "Plot 123456, MG Road, Hyderabad 500001")).toBe("500001"));
  it("returns empty when none", () => expect(extractPincode("", "MG Road, Hyderabad")).toBe(""));
  it("ignores 5-digit numbers and longer phone numbers", () =>
    expect(extractPincode("", "Sector 12345, Ph 9876543210")).toBe(""));
  it("rejects pincodes starting with 0", () => expect(extractPincode("012345", "")).toBe(""));
});

describe("cleanName", () => {
  it("title-cases ALL CAPS, collapses spaces, drops trailing punctuation", () =>
    expect(cleanName("  APOLLO   HOSPITALS (JUBILEE HILLS). ")).toBe("Apollo Hospitals (Jubilee Hills)"));
  it("keeps mixed case as is", () => expect(cleanName("KIMS Hospital")).toBe("KIMS Hospital"));
});

describe("clean / dedupe / fixes", () => {
  const raw = [
    { name: "CITY HOSPITAL", address: "1 Main Rd,\n Hyderabad 500001,", city: "HYDERABAD", state: "telangana", pincode: "" },
    { name: "City Hospital", address: "Another copy", city: "", state: "", pincode: "500001" },
    { name: "Other Clinic", address: "Somewhere", city: "", state: "", pincode: "" },
  ];

  it("cleans fields and never invents data", () => {
    const [h, , o] = clean(raw, "star");
    expect(h).toEqual({
      insurer: "star",
      name: "City Hospital",
      address: "1 Main Rd, Hyderabad 500001",
      city: "Hyderabad",
      state: "Telangana",
      pincode: "500001",
    });
    expect(o.city + o.state + o.pincode).toBe("");
  });

  it("dedupes by lowercase name + pincode, keeping the first", () => {
    const { hospitals, removed } = dedupe(clean(raw, "star"));
    expect(removed).toBe(1);
    expect(hospitals.map((h) => h.address)).toEqual(["1 Main Rd, Hyderabad 500001", "Somewhere"]);
  });

  it("applies manual fixes for the matching insurer only", () => {
    const fixes = [
      { insurer: "star" as const, name: "Other Clinic", pincode: "", patch: { pincode: "500002" } },
      { insurer: "care" as const, name: "City Hospital", pincode: "500001", patch: { name: "Wrong" } },
    ];
    const out = applyFixes(clean(raw, "star"), fixes, "star");
    expect(out[2].pincode).toBe("500002");
    expect(out[0].name).toBe("City Hospital");
  });
});
