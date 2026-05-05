import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import {
  parseIsoDate,
  validateBookingDateRange,
} from "@/lib/booking/date";
import { getAvailabilitySnapshot } from "@/lib/booking/availability";
import { logEvent } from "@/lib/logging";
import {
  consumeRateLimit,
  createRateLimitKey,
  createRateLimitedResponse,
} from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const availabilityQuerySchema = z.object({
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkIn must be in YYYY-MM-DD format."),
  checkOut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "checkOut must be in YYYY-MM-DD format."),
  guestsCount: z.coerce.number().int().min(1, "guestsCount must be at least 1."),
});

export async function GET(request: NextRequest) {
  try {
    const rateLimit = consumeRateLimit({
      key: createRateLimitKey("/api/availability", request),
      limit: 60,
      windowMs: 5 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      await logEvent({
        type: "rate_limit_blocked",
        source: "/api/availability",
        message: "Availability request rate limited.",
        metadata: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
      return createRateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const parsedQuery = availabilityQuerySchema.safeParse({
      checkIn: request.nextUrl.searchParams.get("checkIn"),
      checkOut: request.nextUrl.searchParams.get("checkOut"),
      guestsCount: request.nextUrl.searchParams.get("guestsCount"),
    });

    if (!parsedQuery.success) {
      logValidationFailure("/api/availability", parsedQuery.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/availability",
        message: "Availability request validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(parsedQuery.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid availability request.", 400);
    }

    const checkIn = parseIsoDate(parsedQuery.data.checkIn);
    const checkOut = parseIsoDate(parsedQuery.data.checkOut);

    if (!checkIn || !checkOut) {
      logValidationFailure("/api/availability", "Invalid ISO date values.");
      await logEvent({
        type: "validation_failed",
        source: "/api/availability",
        message: "Availability request had invalid ISO dates.",
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid availability request.", 400);
    }

    try {
      validateBookingDateRange(checkIn, checkOut);
    } catch (error) {
      logValidationFailure(
        "/api/availability",
        error instanceof Error ? error.message : "Invalid date range.",
      );
      await logEvent({
        type: "validation_failed",
        source: "/api/availability",
        message: "Availability request had invalid date range.",
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid availability request.", 400);
    }

    const availability = await getAvailabilitySnapshot({
      checkIn,
      checkOut,
      guestsCount: parsedQuery.data.guestsCount,
      supabase: createSupabaseAdminClient(),
    });

    return NextResponse.json(availability);
  } catch (error) {
    console.error("Failed to fetch availability.", error);

    return createApiErrorResponse("INTERNAL_ERROR", "Failed to fetch availability.", 500);
  }
}

export async function POST() {
  return createApiErrorResponse("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
}
