import type { Locale } from "../locales";

import { buildBookingAgentInstructions } from "./booking-agent-prompt";
import type { ResolvedBookingDraft } from "./chat-booking-state";

const defaultVoiceModel = "gpt-realtime";
const defaultVoiceName = "alloy";

type RawRealtimeClientSecretResponse = {
  client_secret?: {
    value?: string | null;
  } | null;
  value?: string | null;
};

export type VoiceSessionPayload = {
  clientSecret: string;
};

export function getVoiceRealtimeModel() {
  return process.env.OPENAI_REALTIME_MODEL?.trim() || defaultVoiceModel;
}

export function getVoiceName() {
  return process.env.OPENAI_REALTIME_VOICE?.trim() || defaultVoiceName;
}

export function buildVoiceAssistantInstructions(locale: Locale) {
  const languageInstruction =
    locale === "en"
      ? "Respond in English unless the user explicitly switches language."
      : "Respond in Italian unless the user explicitly switches language.";

  return `${buildBookingAgentInstructions({
    language: locale,
    currentDraft: null,
  })}\n\nVoice channel rules:\n- ${languageInstruction}\n- Speak naturally and keep replies short enough for voice.\n- If audio is unclear, politely ask the user to repeat only the missing part.\n- Never expose internal tool names or technical details about the realtime connection.`;
}

export function buildVoiceAssistantInstructionsWithDraft(
  locale: Locale,
  currentDraft: ResolvedBookingDraft | null,
) {
  const languageInstruction =
    locale === "en"
      ? "Respond in English unless the user explicitly switches language."
      : "Respond in Italian unless the user explicitly switches language.";

  return `${buildBookingAgentInstructions({
    language: locale,
    currentDraft,
  })}\n\nVoice channel rules:\n- ${languageInstruction}\n- Speak naturally and keep replies short enough for voice.\n- If audio is unclear, politely ask the user to repeat only the missing part.\n- Never expose internal tool names or technical details about the realtime connection.`;
}

export function normalizeVoiceSessionPayload(
  payload: RawRealtimeClientSecretResponse,
): VoiceSessionPayload {
  const clientSecret = payload.client_secret?.value ?? payload.value;

  if (!clientSecret) {
    throw new Error("Realtime session response did not include an ephemeral client secret.");
  }

  return {
    clientSecret,
  };
}
