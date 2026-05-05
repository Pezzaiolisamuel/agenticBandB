import { describe, expect, it } from "vitest";

import { calculateRoomPrice } from "./pricing";

describe("calculateRoomPrice", () => {
  it("calculates price using only the base nightly rate when guests are included", () => {
    expect(
      calculateRoomPrice({
        base_price_eur: 120,
        included_guests: 2,
        extra_guest_price_eur: 25,
        guests_count: 2,
        nights: 3,
      }),
    ).toBe(360);
  });

  it("adds extra guest pricing for each night", () => {
    expect(
      calculateRoomPrice({
        base_price_eur: 120,
        included_guests: 2,
        extra_guest_price_eur: 25,
        guests_count: 4,
        nights: 3,
      }),
    ).toBe(510);
  });

  it("does not subtract when the guest count is below the included amount", () => {
    expect(
      calculateRoomPrice({
        base_price_eur: 120,
        included_guests: 3,
        extra_guest_price_eur: 25,
        guests_count: 1,
        nights: 2,
      }),
    ).toBe(240);
  });
});
