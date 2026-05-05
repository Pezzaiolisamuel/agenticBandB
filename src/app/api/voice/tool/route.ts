import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { logAgentLog, logEvent } from "@/lib/logging";
import { runBookingAgentTool } from "@/lib/openai/booking-agent-tool-handlers";
import { bookingAgentToolsByName } from "@/lib/openai/booking-agent-tools";

const voiceToolRequestSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
  name: z.string().trim().min(1).max(100),
  args: z.unknown(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = voiceToolRequestSchema.safeParse(body);

    if (!parsed.success) {
      logValidationFailure("/api/voice/tool", parsed.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/voice/tool",
        message: "Voice tool request validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(parsed.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid voice tool request.", 400);
    }

    if (!bookingAgentToolsByName[parsed.data.name]) {
      return NextResponse.json(
        {
          output: {
            ok: false,
            error: "Questo assistente vocale puo aiutare solo con camere, disponibilita e prenotazioni.",
          },
        },
        { status: 200 },
      );
    }

    try {
      const output = await runBookingAgentTool(
        parsed.data.name,
        parsed.data.args,
        parsed.data.sessionId,
        "voice",
      );

      await logAgentLog({
        channel: "website_voice",
        sessionId: parsed.data.sessionId,
        assistantMessage: `Voice tool executed: ${parsed.data.name}`,
        toolName: parsed.data.name,
      });

      await logEvent({
        type: "ai_tool_called",
        source: "website_voice",
        message: `Voice tool ${parsed.data.name} executed.`,
        metadata: {
          sessionId: parsed.data.sessionId,
          toolName: parsed.data.name,
        },
      });

      return NextResponse.json(
        {
          output,
        },
        { status: 200 },
      );
    } catch (error) {
      console.error("Voice tool execution failed:", error);

      await logEvent({
        type: "ai_tool_call_failed",
        source: "website_voice",
        message: `Voice tool ${parsed.data.name} failed.`,
        metadata: {
          sessionId: parsed.data.sessionId,
          toolName: parsed.data.name,
        },
      });

      return NextResponse.json(
        {
          output: {
            ok: false,
            error:
              "Non riesco a completare questa operazione in questo momento, ma posso ancora aiutarti a verificare una prenotazione.",
          },
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Voice tool route failed:", error);

    return createApiErrorResponse("INTERNAL_ERROR", "Impossibile usare il tool voce in questo momento.", 500);
  }
}
