import { describe, it, expect } from "vitest";

describe("Vitest setup", () => {
  it("runs a basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("handles string operations", () => {
    expect("HappiKid".toLowerCase()).toBe("happikid");
  });

  it("works with arrays", () => {
    const providers = ["daycare", "afterschool", "camp", "school"];
    expect(providers).toHaveLength(4);
    expect(providers).toContain("daycare");
  });
});
