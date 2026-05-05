import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createApiErrorResponse, logValidationFailure } from "@/lib/api/errors";
import { logEvent } from "@/lib/logging";
import {
  consumeRateLimit,
  createRateLimitKey,
  createRateLimitedResponse,
} from "@/lib/rate-limit";
import {
  bookingRequestSchema,
  BookingRequestConflictError,
  BookingRequestValidationError,
  createBookingRequest,
} from "@/lib/booking/booking-request";

const bookingBotProtectionSchema = z.object({
  website: z.string().max(0).optional().default(""),
  formStartedAt: z.number().int().nonnegative(),
});

const bookingApiRequestSchema = bookingRequestSchema.and(bookingBotProtectionSchema);

export async function GET() {
  return createApiErrorResponse("METHOD_NOT_ALLOWED", "Method not allowed.", 405);
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = consumeRateLimit({
      key: createRateLimitKey("/api/bookings", request),
      limit: 5,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      await logEvent({
        type: "rate_limit_blocked",
        source: "/api/bookings",
        message: "Booking request rate limited.",
        metadata: {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      });
      return createRateLimitedResponse(rateLimit.retryAfterSeconds);
    }

    const json = await request.json().catch(() => undefined);
    const result = bookingApiRequestSchema.safeParse(json);

    if (!result.success) {
      logValidationFailure("/api/bookings", result.error);
      await logEvent({
        type: "validation_failed",
        source: "/api/bookings",
        message: "Booking request validation failed.",
        metadata: {
          fields: Object.keys(z.flattenError(result.error).fieldErrors),
        },
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid booking payload.", 400);
    }

    const submissionDurationMs = Date.now() - result.data.formStartedAt;

    if (result.data.website.trim() || submissionDurationMs < 2000) {
      await logEvent({
        type: "bot_detected",
        source: "/api/bookings",
        message: "Booking request rejected as invalid submission.",
        metadata: {
          roomId: result.data.roomId,
          checkIn: result.data.checkIn,
          checkOut: result.data.checkOut,
          source: result.data.source,
        },
      });
      return createApiErrorResponse("bot_detected", "Invalid submission.", 400);
    }

    const booking = await createBookingRequest({
      roomId: result.data.roomId,
      guestFullName: result.data.guestFullName,
      guestEmail: result.data.guestEmail,
      guestPhone: result.data.guestPhone,
      language: result.data.language,
      guestsCount: result.data.guestsCount,
      checkIn: result.data.checkIn,
      checkOut: result.data.checkOut,
      notes: result.data.notes,
      consentPrivacy: result.data.consentPrivacy,
      consentCookies: result.data.consentCookies,
      source: result.data.source,
    });

    return NextResponse.json(
      {
        bookingId: booking.bookingId,
        bookingCode: booking.bookingCode,
        roomId: booking.roomId,
        source: booking.source,
        status: booking.status,
        autoConfirmed: booking.autoConfirmed,
        nights: booking.nights,
        totalPriceEur: booking.totalPriceEur,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof BookingRequestValidationError) {
      logValidationFailure("/api/bookings", error.message);
      await logEvent({
        type: "validation_failed",
        source: "/api/bookings",
        message: "Booking request rejected after validation.",
      });
      return createApiErrorResponse("INVALID_INPUT", "Invalid booking payload.", 400);
    }

    if (error instanceof BookingRequestConflictError) {
      await logEvent({
        type: "booking_creation_failed",
        source: "/api/bookings",
        message: "Booking request conflicted with current availability.",
      });
      return createApiErrorResponse("BOOKING_CONFLICT", "Booking could not be created.", 409);
    }

    console.error("Failed to create booking.", error);

    await logEvent({
      type: "booking_creation_failed",
      source: "/api/bookings",
      message: "Booking request failed unexpectedly.",
    });

    return createApiErrorResponse("INTERNAL_ERROR", "Failed to create booking.", 500);
  }
}
