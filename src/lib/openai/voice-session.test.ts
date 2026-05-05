import { describe, expect, it } from "vitest";

import {
  buildVoiceAssistantInstructions,
  buildVoiceAssistantInstructionsWithDraft,
  normalizeVoiceSessionPayload,
} from "./voice-session";

describe("normalizeVoiceSessionPayload", () => {
  it("supports the nested client_secret response shape", () => {
    expect(
      normalizeVoiceSessionPayload(
        {
          client_secret: {
            value: "ephemeral-secret",
          },
        },
      ),
    ).toEqual({
      clientSecret: "ephemeral-secret",
    });
  });

  it("supports a flat value response shape", () => {
    expect(
      normalizeVoiceSessionPayload(
        {
          value: "flat-secret",
        },
      ),
    ).toEqual({
      clientSecret: "flat-secret",
    });
  });

  it("throws when the secret is missing", () => {
    expect(() => normalizeVoiceSessionPayload({})).toThrow(/ephemeral client secret/i);
  });
});

describe("buildVoiceAssistantInstructions", () => {
  it("biases the instructions to Italian by default", () => {
    expect(buildVoiceAssistantInstructions("it")).toContain(
      "Respond in Italian unless the user explicitly switches language.",
    );
  });

  it("adds an English voice rule for English sessions", () => {
    expect(buildVoiceAssistantInstructions("en")).toContain(
      "Respond in English unless the user explicitly switches language.",
    );
  });

  it("includes the current booking draft when provided", () => {
    expect(
      buildVoiceAssistantInstructionsWithDraft("it", {
        checkIn: "2026-06-10",
        checkOut: "2026-06-12",
        guestsCount: 2,
        roomsCount: null,
        roomId: null,
        guestFullName: null,
        guestEmail: null,
        guestPhone: null,
        notes: null,
        language: "it",
        lastResponseId: null,
        updatedAt: null,
      }),
    ).toContain('"checkIn": "2026-06-10"');
  });
});
