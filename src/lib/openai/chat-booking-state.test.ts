import { describe, expect, it } from "vitest";

import {
  formatBookingDraftForPrompt,
  mapChatBookingStateRow,
  mergeBookingDraftPatch,
} from "./chat-booking-state-utils";

describe("mergeBookingDraftPatch", () => {
  it("keeps existing values when patch values are null", () => {
    const currentState = {
      checkIn: "2026-06-10",
      checkOut: "2026-06-12",
      guestsCount: 2,
      roomsCount: 1,
      roomId: "room-1",
      guestFullName: "Mario Rossi",
      guestEmail: "mario@example.com",
      guestPhone: "123456",
      notes: "Late arrival",
      language: "it",
      lastResponseId: "resp_123",
      updatedAt: "2026-05-04T10:00:00.000Z",
    };

    const merged = mergeBookingDraftPatch(currentState, {
      checkIn: null,
      checkOut: null,
      guestsCount: null,
      roomsCount: null,
      roomId: null,
      guestFullName: null,
      guestEmail: null,
      guestPhone: null,
      notes: null,
    });

    expect(merged).toEqual(currentState);
  });

  it("overrides only non-null patch values", () => {
    const currentState = mapChatBookingStateRow(null);

    const merged = mergeBookingDraftPatch(currentState, {
      checkIn: "2026-06-10",
      checkOut: "2026-06-12",
      guestsCount: 3,
      roomsCount: null,
      roomId: "room-2",
      guestFullName: null,
      guestEmail: "guest@example.com",
      guestPhone: null,
      notes: "Quiet room",
    });

    expect(merged.checkIn).toBe("2026-06-10");
    expect(merged.checkOut).toBe("2026-06-12");
    expect(merged.guestsCount).toBe(3);
    expect(merged.roomId).toBe("room-2");
    expect(merged.guestEmail).toBe("guest@example.com");
    expect(merged.notes).toBe("Quiet room");
    expect(merged.roomsCount).toBeNull();
  });
});

describe("formatBookingDraftForPrompt", () => {
  it("renders an empty label when no state exists", () => {
    expect(formatBookingDraftForPrompt(null)).toBe("Current booking draft: empty");
  });

  it("renders the serialized draft fields", () => {
    const text = formatBookingDraftForPrompt({
      checkIn: "2026-06-10",
      checkOut: "2026-06-12",
      guestsCount: 2,
      roomsCount: 1,
      roomId: "room-1",
      guestFullName: "Mario Rossi",
      guestEmail: "mario@example.com",
      guestPhone: "123456",
      notes: "Late arrival",
      language: "it",
      lastResponseId: "resp_123",
      updatedAt: "2026-05-04T10:00:00.000Z",
    });

    expect(text).toContain('"checkIn": "2026-06-10"');
    expect(text).toContain('"guestsCount": 2');
    expect(text).toContain('"guestEmail": "mario@example.com"');
  });
});
