import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { getOpenAIApiKey } from "@/lib/env";
import type { Locale } from "@/lib/locales";
import { logEvent } from "@/lib/logging";
import {
  cleanupStaleChatBookingState,
  getChatBookingState,
  touchChatBookingState,
} from "@/lib/openai/chat-booking-state";
import { realtimeBookingAgentTools } from "@/lib/openai/booking-agent-tools";
import {
  buildVoiceAssistantInstructionsWithDraft,
  getVoiceName,
  getVoiceRealtimeModel,
  normalizeVoiceSessionPayload,
} from "@/lib/openai/voice-session";
import {
  consumeRateLimit,
  createRateLimitKey,
  createRateLimitedResponse,
} from "@/lib/rate-limit";

const voiceSessionRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
  language: z.enum(["it", "en"]).optional(),
});

function removeUnsupportedRealtimeToolFields(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(removeUnsupportedRealtimeToolFields);
  }

  if (value && typeof value === "object") {
    const cleaned: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "strict") {
        continue;
      }

      cleaned[key] = removeUnsupportedRealtimeToolFields(nestedValue);
    }

    return cleaned;
  }

  return value;
}

export async function POST(request: Request) {
  let language: Locale = "it";

  try {
    await cleanupStaleChatBookingState().catch((error) => {
      console.error("Failed to clean stale chat booking state:", error);
    });

    const rateLimit = consumeRateLimit({
      key: createRateLimitKey("/api/voice/session", request),
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      await logEvent({
        type: "rate_limit_blocked",
        source: "/api/voice/session",
        message: "Voice session request rate limited.",
        metadata: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
      return createRateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const body = await request.json().catch(() => ({}));
    const parsed = voiceSessionRequestSchema.safeParse(body);

    if (!parsed.success) {
      logValidationFailure("/api/voice/session", parsed.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/voice/session",
        message: "Voice session validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(parsed.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid voice session request.", 400);
    }

    language = parsed.data.language ?? "it";

    const currentDraft = await getChatBookingState(parsed.data.sessionId);

    await touchChatBookingState(parsed.data.sessionId, {
      language,
      lastResponseId: currentDraft?.lastResponseId ?? null,
    });

    const model = getVoiceRealtimeModel();
    const tools = removeUnsupportedRealtimeToolFields(realtimeBookingAgentTools);

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getOpenAIApiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model,
          instructions: buildVoiceAssistantInstructionsWithDraft(language, currentDraft),
          tools,
          tool_choice: "auto",
          audio: {
            input: {
              turn_detection: {
                type: "server_vad",
              },
            },
            output: {
              voice: getVoiceName(),
            },
          },
        },
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI realtime client secret request failed:", errorText);

      return createApiErrorResponse(
        "UPSTREAM_ERROR",
        "Unable to start the voice assistant right now.",
        502,
      );
    }

    const payload = normalizeVoiceSessionPayload(
      (await response.json()) as {
        client_secret?: { value?: string | null } | null;
        value?: string | null;
      },
    );

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Voice session route failed:", error);

    return createApiErrorResponse(
      "INTERNAL_ERROR",
      language === "en"
        ? "Unable to start the voice assistant right now."
        : "Impossibile avviare l'assistente vocale in questo momento.",
      500,
    );
  }
}
