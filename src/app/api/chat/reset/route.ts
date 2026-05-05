import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { logEvent } from "@/lib/logging";
import { resetChatBookingState } from "@/lib/openai/chat-booking-state";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const chatResetSchema = z.object({
  sessionId: z.string().trim().min(1).max(255),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => undefined);
    const parsed = chatResetSchema.safeParse(body);

    if (!parsed.success) {
      logValidationFailure("/api/chat/reset", parsed.error);
      return createApiErrorResponse("INVALID_INPUT", "Invalid reset request.", 400);
    }

    await resetChatBookingState(parsed.data.sessionId);

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("agent_logs")
      .delete()
      .eq("session_id", parsed.data.sessionId)
      .eq("channel", "website_chat");

    if (error) {
      console.error("Failed to clean chat agent logs during reset:", error);
    }

    await logEvent({
      type: "chat_session_reset",
      source: "/api/chat/reset",
      message: "Chat session reset completed.",
      metadata: {
        sessionId: parsed.data.sessionId,
      },
    });

    return NextResponse.json(
      {
        ok: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to reset chat session.", error);
    return createApiErrorResponse("INTERNAL_ERROR", "Failed to reset chat session.", 500);
  }
}
