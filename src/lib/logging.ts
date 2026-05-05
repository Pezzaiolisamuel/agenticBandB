import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type LogMetadata =
  | string
  | number
  | boolean
  | null
  | { [key: string]: LogMetadata }
  | LogMetadata[];

type LogEventInput = {
  type: string;
  source: string;
  message: string;
  metadata?: LogMetadata;
};

type AgentLogInput = {
  channel: "website_chat" | "website_voice" | "phone";
  sessionId: string;
  userMessage?: string | null;
  assistantMessage?: string | null;
  toolName?: string | null;
};

const sensitiveKeyPattern =
  /(api[-_]?key|service[-_]?role|authorization|token|secret|password|credit|card|payment)/i;

function sanitizeString(value: string) {
  if (value.length > 1000) {
    return `${value.slice(0, 997)}...`;
  }

  return value;
}

function sanitizeMetadataValue(value: LogMetadata): LogMetadata {
  if (value === null) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMetadataValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[redacted]" : sanitizeMetadataValue(nestedValue),
      ]),
    );
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  return value;
}

export async function logEvent({ type, source, message, metadata }: LogEventInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("app_events").insert({
      event_type: type,
      source,
      message,
      metadata: metadata ? sanitizeMetadataValue(metadata) : null,
    });

    if (error) {
      console.error("Failed to write app event log:", error);
    }
  } catch (error) {
    console.error("Failed to write app event log:", error);
  }
}

export async function logAgentLog({
  channel,
  sessionId,
  userMessage,
  assistantMessage,
  toolName,
}: AgentLogInput) {
  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("agent_logs").insert({
      channel,
      session_id: sessionId,
      user_message: userMessage ?? null,
      assistant_message: assistantMessage ?? null,
      tool_name: toolName ?? null,
    });

    if (error) {
      console.error("Failed to write agent log:", error);
    }
  } catch (error) {
    console.error("Failed to write agent log:", error);
  }
}
