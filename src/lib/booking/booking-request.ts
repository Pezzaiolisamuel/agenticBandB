import { z } from "zod";

import { getAvailabilitySnapshot } from "@/lib/booking/availability";
import { generateBookingCode } from "@/lib/booking/code";
import {
  calculateNights,
  parseIsoDate,
  validateBookingDateRange,
} from "@/lib/booking/date";
import { logEvent } from "@/lib/logging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export class BookingRequestValidationError extends Error {}
export class BookingRequestConflictError extends Error {}

export const bookingRequestSchema = z
  .object({
    roomId: z.uuid(),
    guestFullName: z.string().trim().min(1).max(200),
    guestEmail: z.email().trim().max(320),
    guestPhone: z.string().trim().max(50).optional().or(z.literal("")),
    language: z.enum(["it", "en"]),
    guestsCount: z.number().int().min(1),
    checkIn: z.string(),
    checkOut: z.string(),
    notes: z.string().trim().max(5000).optional().or(z.literal("")),
    consentPrivacy: z.boolean(),
    consentCookies: z.boolean(),
    source: z.enum(["website", "phone", "admin"]).default("website"),
  })
  .superRefine((value, ctx) => {
    const checkIn = parseIsoDate(value.checkIn);
    const checkOut = parseIsoDate(value.checkOut);

    if (!checkIn) {
      ctx.addIssue({
        code: "custom",
        path: ["checkIn"],
        message: "checkIn must be a valid date in YYYY-MM-DD format.",
      });
    }

    if (!checkOut) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "checkOut must be a valid date in YYYY-MM-DD format.",
      });
    }

    if (checkIn && checkOut) {
      try {
        validateBookingDateRange(checkIn, checkOut);
      } catch (error) {
        ctx.addIssue({
          code: "custom",
          path: ["checkOut"],
          message: error instanceof Error ? error.message : "Invalid booking date range.",
        });
      }
    }
  });

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;

type PolicyRecord = {
  key: string;
  value_it: string;
  value_en: string;
};

type BookingInsert = {
  room_id: string;
  booking_code: string;
  source: "website" | "phone" | "admin";
  status: "confirmed" | "pending_admin_confirmation";
  guest_full_name: string;
  guest_email: string;
  guest_phone: string | null;
  language: "it" | "en";
  guests_count: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  price_total_eur: number;
  notes: string | null;
  cancellation_policy_snapshot_it: string;
  cancellation_policy_snapshot_en: string;
  consent_privacy: boolean;
  consent_cookies: boolean;
  auto_confirmed: boolean;
};

export type CreatedBookingResult = {
  bookingId: string;
  bookingCode: string;
  roomId: string;
  source: "website" | "phone" | "admin";
  status: "confirmed" | "pending_admin_confirmation";
  autoConfirmed: boolean;
  nights: number;
  totalPriceEur: number;
};

async function getCancellationPolicySnapshot() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("policies")
    .select("key, value_it, value_en")
    .eq("key", "cancellation_policy")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Missing required policy record with key "cancellation_policy".');
  }

  const policy = data as PolicyRecord;

  return {
    it: policy.value_it,
    en: policy.value_en,
  };
}

async function insertBookingWithUniqueCode(booking: Omit<BookingInsert, "booking_code">) {
  const supabase = createSupabaseAdminClient();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const bookingCode = generateBookingCode();
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        ...booking,
        booking_code: bookingCode,
      })
      .select("id, booking_code, status, auto_confirmed, price_total_eur, nights")
      .single();

    if (!error) {
      return data;
    }

    const isDuplicateBookingCode =
      "code" in error &&
      error.code === "23505" &&
      typeof error.message === "string" &&
      error.message.includes("booking_code");

    if (!isDuplicateBookingCode) {
      throw error;
    }
  }

  throw new Error("Failed to generate a unique booking code.");
}

export async function createBookingRequest(payload: BookingRequestInput) {
  try {
    const checkIn = parseIsoDate(payload.checkIn);
    const checkOut = parseIsoDate(payload.checkOut);

    if (!checkIn || !checkOut) {
      throw new BookingRequestValidationError("checkIn and checkOut must be valid ISO dates.");
    }

    const nights = calculateNights(checkIn, checkOut);
    const availability = await getAvailabilitySnapshot({
      checkIn,
      checkOut,
      guestsCount: payload.guestsCount,
      supabase: createSupabaseAdminClient(),
    });
    const requestedRoom = availability.rooms.find((room) => room.roomId === payload.roomId);

    if (!requestedRoom) {
      throw new BookingRequestValidationError(
        "Requested room is not active or does not support the requested guest count.",
      );
    }

    if (!requestedRoom.available || requestedRoom.totalPriceEur === null) {
      throw new BookingRequestConflictError(
        requestedRoom.reason || "Requested room is no longer available for the selected dates.",
      );
    }

    const cancellationPolicySnapshot = await getCancellationPolicySnapshot();
    const autoConfirmed = availability.availableRoomsCount > 2;
    const status = autoConfirmed ? "confirmed" : "pending_admin_confirmation";

    const booking = await insertBookingWithUniqueCode({
      room_id: payload.roomId,
      source: payload.source,
      status,
      guest_full_name: payload.guestFullName,
      guest_email: payload.guestEmail.trim().toLowerCase(),
      guest_phone: payload.guestPhone?.trim() ? payload.guestPhone.trim() : null,
      language: payload.language,
      guests_count: payload.guestsCount,
      check_in_date: payload.checkIn,
      check_out_date: payload.checkOut,
      nights,
      price_total_eur: requestedRoom.totalPriceEur,
      notes: payload.notes?.trim() ? payload.notes.trim() : null,
      cancellation_policy_snapshot_it: cancellationPolicySnapshot.it,
      cancellation_policy_snapshot_en: cancellationPolicySnapshot.en,
      consent_privacy: payload.consentPrivacy,
      consent_cookies: payload.consentCookies,
      auto_confirmed: autoConfirmed,
    });

    await logEvent({
      type: "booking_created",
      source: "booking_request",
      message: `Booking ${booking.booking_code} created.`,
      metadata: {
        bookingId: booking.id,
        bookingCode: booking.booking_code,
        status: booking.status,
        source: payload.source,
        roomId: payload.roomId,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
      },
    });

    return {
      bookingId: booking.id,
      bookingCode: booking.booking_code,
      roomId: payload.roomId,
      source: payload.source,
      status: booking.status,
      autoConfirmed: booking.auto_confirmed,
      nights: booking.nights,
      totalPriceEur: booking.price_total_eur,
    } satisfies CreatedBookingResult;
  } catch (error) {
    await logEvent({
      type: "booking_creation_failed",
      source: "booking_request",
      message: "Booking creation failed.",
      metadata: {
        roomId: payload.roomId,
        source: payload.source,
        checkIn: payload.checkIn,
        checkOut: payload.checkOut,
      },
    });
    console.error("Booking creation service failed:", error);
    throw error;
  }
}
