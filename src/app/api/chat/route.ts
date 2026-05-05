import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { ResponseInputItem } from "openai/resources/responses/responses";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { logAgentLog, logEvent } from "@/lib/logging";
import {
  consumeRateLimit,
  createRateLimitKey,
  createRateLimitedResponse,
} from "@/lib/rate-limit";
import {
  cleanupStaleChatBookingState,
  getChatBookingState,
  touchChatBookingState,
} from "@/lib/openai/chat-booking-state";
import { buildBookingAgentInstructions } from "@/lib/openai/booking-agent-prompt";
import { runBookingAgentTool } from "@/lib/openai/booking-agent-tool-handlers";
import { bookingAgentTools } from "@/lib/openai/booking-agent-tools";
import { getOpenAIResponsesApi } from "@/lib/openai/client";

const chatRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1).max(5000),
  language: z.enum(["it", "en"]).optional(),
});

const MAX_TOOL_ROUNDS = 8;
const DEFAULT_CHAT_MODEL = process.env.OPENAI_BOOKING_AGENT_MODEL || "gpt-4.1-mini";

type ResponseFunctionCall = {
  type: "function_call";
  name: string;
  arguments: string;
  call_id: string;
};

function getResponseFunctionCalls(response: { output?: unknown[] }) {
  return (response.output ?? []).filter(
    (item): item is ResponseFunctionCall =>
      typeof item === "object" &&
      item !== null &&
      "type" in item &&
      item.type === "function_call" &&
      "name" in item &&
      "arguments" in item &&
      "call_id" in item,
  );
}

function getAssistantMessage(response: { output_text?: string | null }) {
  const message = response.output_text?.trim();

  if (message) {
    return message;
  }

  return "Mi dispiace, al momento non riesco a completare la risposta.";
}

async function logChatTurn({
  sessionId,
  userMessage,
  assistantMessage,
  toolNames,
}: {
  sessionId: string;
  userMessage: string;
  assistantMessage: string;
  toolNames: string[];
}) {
  await logAgentLog({
    channel: "website_chat",
    sessionId,
    userMessage,
    assistantMessage,
    toolName: toolNames.length > 0 ? toolNames.join(",") : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    await cleanupStaleChatBookingState().catch((error) => {
      console.error("Failed to clean stale chat booking state:", error);
    });

    const json = await request.json().catch(() => undefined);
    const result = chatRequestSchema.safeParse(json);

    if (!result.success) {
      logValidationFailure("/api/chat", result.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/chat",
        message: "Chat request validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(result.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid chat payload.", 400);
    }

    const payload = result.data;
    const rateLimit = consumeRateLimit({
      key: createRateLimitKey("/api/chat", request),
      limit: 20,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      await logEvent({
        type: "rate_limit_blocked",
        source: "/api/chat",
        message: "Chat request rate limited.",
        metadata: {
          sessionId: payload.sessionId,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
      return createRateLimitedResponse(rateLimit.retryAfterSeconds);
    }

      const currentDraft = await getChatBookingState(payload.sessionId);
      const responsesApi = getOpenAIResponsesApi();
      const toolNamesUsed = new Set<string>();
      const instructions = buildBookingAgentInstructions({
        language: payload.language,
        currentDraft,
      });

      let response = await responsesApi.create({
        model: DEFAULT_CHAT_MODEL,
        instructions,
        input: payload.message,
        tools: bookingAgentTools,
        previous_response_id: currentDraft?.lastResponseId ?? undefined,
      });

      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        const toolCalls = getResponseFunctionCalls(response);

      if (toolCalls.length === 0) {
        break;
      }

      const toolOutputs: ResponseInputItem[] = [];

        for (const toolCall of toolCalls) {
          const parsedArgs = JSON.parse(toolCall.arguments) as unknown;
          let toolResult: unknown;

          try {
            toolResult = await runBookingAgentTool(
              toolCall.name,
              parsedArgs,
              payload.sessionId,
              "chat",
            );
          } catch (toolError) {
            console.error(`Booking chat tool failed: ${toolCall.name}`, toolError);
            toolResult = {
              ok: false,
              error:
                toolError instanceof Error
                  ? toolError.message
                  : "Tool execution failed.",
            };
          }

          toolNamesUsed.add(toolCall.name);
          await logEvent({
            type: "ai_tool_called",
            source: "website_chat",
            message: `Chat tool ${toolCall.name} executed.`,
            metadata: {
              sessionId: payload.sessionId,
              toolName: toolCall.name,
            },
          });
          toolOutputs.push({
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify(toolResult),
            status: "completed",
          });
        }

      response = await responsesApi.create({
        model: DEFAULT_CHAT_MODEL,
        previous_response_id: response.id,
        input: toolOutputs,
      });
    }

      const assistantMessage = getAssistantMessage(response);

      await touchChatBookingState(payload.sessionId, {
        language: payload.language ?? currentDraft?.language ?? "it",
        lastResponseId: response.id,
      });

      await logChatTurn({
        sessionId: payload.sessionId,
      userMessage: payload.message,
      assistantMessage,
      toolNames: [...toolNamesUsed],
    });

    await logEvent({
      type: "ai_chat_message_logged",
      source: "website_chat",
      message: "Chat turn completed.",
      metadata: {
        sessionId: payload.sessionId,
        toolNames: [...toolNamesUsed],
      },
    });

    return NextResponse.json(
      {
        message: assistantMessage,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to handle chat request.", error);

    return createApiErrorResponse("INTERNAL_ERROR", "Failed to handle chat request.", 500);
  }
}
