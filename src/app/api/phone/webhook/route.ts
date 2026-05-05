import { NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { logAgentLog, logEvent } from "@/lib/logging";
import {
  consumeRateLimit,
  createRateLimitKey,
  createRateLimitedResponse,
} from "@/lib/rate-limit";

type ParsedBody = Record<string, string | string[]>;
const parsedBodySchema = z.record(z.string(), z.union([z.string(), z.array(z.string())]));

class InvalidPhoneWebhookPayloadError extends Error {}

function sanitizeValue(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "[empty]";
  }

  if (trimmed.includes("@")) {
    return "[redacted-email]";
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length >= 6) {
    return "[redacted-phone]";
  }

  if (trimmed.length > 120) {
    return `${trimmed.slice(0, 117)}...`;
  }

  return trimmed;
}

function sanitizeBodyEntries(body: ParsedBody) {
  return Object.fromEntries(
    Object.entries(body)
      .slice(0, 12)
      .map(([key, value]) => [
        key,
        Array.isArray(value) ? value.map((item) => sanitizeValue(item)) : sanitizeValue(value),
      ]),
  );
}

async function parseRequestBody(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    const json = (await request.json().catch(() => {
      throw new InvalidPhoneWebhookPayloadError("Invalid JSON payload.");
    })) as unknown;

    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(json as Record<string, unknown>).map(([key, value]) => {
        if (Array.isArray(value)) {
          return [key, value.map((item) => String(item))];
        }

        return [key, String(value ?? "")];
      }),
    ) satisfies ParsedBody;
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const parsed: ParsedBody = {};

    for (const [key, value] of formData.entries()) {
      const nextValue = String(value);
      const currentValue = parsed[key];

      if (typeof currentValue === "undefined") {
        parsed[key] = nextValue;
        continue;
      }

      if (Array.isArray(currentValue)) {
        currentValue.push(nextValue);
        parsed[key] = currentValue;
        continue;
      }

      parsed[key] = [currentValue, nextValue];
    }

    return parsed;
  }

  return {};
}

export async function POST(request: Request) {
  try {
    const rateLimit = consumeRateLimit({
      key: createRateLimitKey("/api/phone/webhook", request),
      limit: 30,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      await logEvent({
        type: "rate_limit_blocked",
        source: "/api/phone/webhook",
        message: "Phone webhook rate limited.",
        metadata: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
      return createRateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const body = await parseRequestBody(request);
    const parsedBody = parsedBodySchema.safeParse(body);

    if (!parsedBody.success) {
      logValidationFailure("/api/phone/webhook", parsedBody.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/phone/webhook",
        message: "Phone webhook validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(parsedBody.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid phone webhook payload.", 400);
    }

    const userAgent = request.headers.get("user-agent") ?? "unknown";
    const requestId = request.headers.get("x-request-id") ?? null;
    const eventType =
      (typeof parsedBody.data.event === "string" && parsedBody.data.event) ||
      (typeof parsedBody.data.type === "string" && parsedBody.data.type) ||
      "unknown";

    console.info("Phone webhook received:", {
      eventType,
      contentType: request.headers.get("content-type") ?? "unknown",
      userAgent: sanitizeValue(userAgent),
      requestId,
      body: sanitizeBodyEntries(parsedBody.data),
    });

    await logAgentLog({
      channel: "phone",
      sessionId: requestId ?? `phone-${Date.now()}`,
      assistantMessage: "Phone webhook received. Phone agent not enabled yet.",
      toolName: eventType,
    });

    await logEvent({
      type: "phone_webhook_received",
      source: "/api/phone/webhook",
      message: "Phone webhook placeholder event received.",
      metadata: {
        eventType,
        requestId,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        message: "Phone webhook received. Phone agent not enabled yet.",
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof InvalidPhoneWebhookPayloadError) {
      logValidationFailure("/api/phone/webhook", error.message);
      await logEvent({
        type: "validation_failed",
        source: "/api/phone/webhook",
        message: "Phone webhook JSON parsing failed.",
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid phone webhook payload.", 400);
    }

    console.error("Phone webhook handler failed:", error);

    return createApiErrorResponse(
      "INTERNAL_ERROR",
      "Unable to process phone webhook right now.",
      500,
    );
  }
}
