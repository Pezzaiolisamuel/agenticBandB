import { describe, expect, it } from "vitest";

import { generateBookingCode } from "./code";

describe("generateBookingCode", () => {
  it("creates readable codes with the expected prefix and date", () => {
    const code = generateBookingCode(new Date("2026-04-28T00:00:00.000Z"));

    expect(code).toMatch(/^BNB-20260428-[0-9A-Z]{4}$/);
  });

  it("creates uppercase suffixes", () => {
    const code = generateBookingCode(new Date("2026-04-28T00:00:00.000Z"));
    const suffix = code.split("-")[2];

    expect(suffix).toBe(suffix.toUpperCase());
  });
});
