import { describe, expect, it } from "vitest";

import {
  calculateNights,
  datesOverlap,
  parseIsoDate,
  validateBookingDateRange,
} from "./date";

describe("parseIsoDate", () => {
  it("parses a valid ISO date safely", () => {
    const date = parseIsoDate("2026-06-15");

    expect(date).toBeInstanceOf(Date);
    expect(date?.toISOString()).toBe("2026-06-15T00:00:00.000Z");
  });

  it("returns null for an invalid calendar date", () => {
    expect(parseIsoDate("2026-02-30")).toBeNull();
  });

  it("returns null for a non-ISO input", () => {
    expect(parseIsoDate("15/06/2026")).toBeNull();
  });
});

describe("validateBookingDateRange", () => {
  it("allows a check-out date after check-in", () => {
    expect(() =>
      validateBookingDateRange(
        new Date("2026-06-15T00:00:00.000Z"),
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).not.toThrow();
  });

  it("throws when check-out is not later than check-in", () => {
    expect(() =>
      validateBookingDateRange(
        new Date("2026-06-18T00:00:00.000Z"),
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toThrow("check_out must be later than check_in.");
  });
});

describe("calculateNights", () => {
  it("calculates the number of nights between dates", () => {
    expect(
      calculateNights(
        new Date("2026-06-15T00:00:00.000Z"),
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toBe(3);
  });
});

describe("datesOverlap", () => {
  it("returns true when the requested dates overlap an existing booking", () => {
    expect(
      datesOverlap(
        new Date("2026-06-10T00:00:00.000Z"),
        new Date("2026-06-15T00:00:00.000Z"),
        new Date("2026-06-14T00:00:00.000Z"),
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toBe(true);
  });

  it("returns false when the requested dates only touch the boundary", () => {
    expect(
      datesOverlap(
        new Date("2026-06-10T00:00:00.000Z"),
        new Date("2026-06-15T00:00:00.000Z"),
        new Date("2026-06-15T00:00:00.000Z"),
        new Date("2026-06-18T00:00:00.000Z"),
      ),
    ).toBe(false);
  });
});
