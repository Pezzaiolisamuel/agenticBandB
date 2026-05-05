import "server-only";

import { z } from "zod";

import {
  BookingRequestValidationError,
  bookingRequestSchema,
  createBookingRequest,
} from "@/lib/booking/booking-request";
import { getAvailabilitySnapshot } from "@/lib/booking/availability";
import { parseIsoDate, validateBookingDateRange } from "@/lib/booking/date";
import { getLocalizedWithItalianFallback, type Locale } from "@/lib/i18n";
import {
  getChatBookingState,
  resetChatBookingState,
  type BookingDraftPatch,
  updateChatBookingState,
} from "@/lib/openai/chat-booking-state";
import { logEvent } from "@/lib/logging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const listRoomsArgsSchema = z.object({
  language: z.enum(["it", "en"]),
});

const getPoliciesArgsSchema = z.object({
  language: z.enum(["it", "en"]),
});

const checkAvailabilityArgsSchema = z.object({
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  guestsCount: z.number().int().min(1).nullable(),
}).strict();

const updateBookingStateArgsSchema = z.object({
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  guestsCount: z.number().int().min(1).nullable(),
  roomsCount: z.number().int().min(1).nullable(),
  roomId: z.string().uuid().nullable(),
  guestFullName: z.string().trim().max(200).nullable(),
  guestEmail: z.email().trim().max(320).nullable(),
  guestPhone: z.string().trim().max(50).nullable(),
  notes: z.string().trim().max(5000).nullable(),
}).strict();

const createBookingRequestArgsSchema = z.object({
  roomId: z.string().uuid().nullable(),
  guestFullName: z.string().trim().max(200).nullable(),
  guestEmail: z.email().trim().max(320).nullable(),
  guestPhone: z.string().trim().max(50).nullable(),
  language: z.enum(["it", "en"]),
  guestsCount: z.number().int().min(1).nullable(),
  checkIn: z.string().nullable(),
  checkOut: z.string().nullable(),
  notes: z.string().trim().max(5000).nullable(),
  consentPrivacy: z.boolean(),
  consentCookies: z.boolean(),
  source: z.enum(["website", "phone", "admin"]).nullable(),
}).strict();

function normalizeNullableText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildMissingFieldsMessage(fields: string[]) {
  return `Missing required booking information: ${fields.join(", ")}.`;
}

async function getDraftState(sessionId: string) {
  return (await getChatBookingState(sessionId)) ?? null;
}

async function updateBookingState(
  sessionId: string,
  patch: BookingDraftPatch,
) {
  return updateChatBookingState(sessionId, patch);
}

async function resolveAvailabilityInput(
  args: z.infer<typeof checkAvailabilityArgsSchema>,
  sessionId: string,
): Promise<{
  checkIn: string;
  checkOut: string;
  guestsCount: number;
}> {
  const draftState = await getDraftState(sessionId);
  const checkIn = args.checkIn ?? draftState?.checkIn ?? null;
  const checkOut = args.checkOut ?? draftState?.checkOut ?? null;
  const guestsCount = args.guestsCount ?? draftState?.guestsCount ?? null;
  const missingFields = [
    checkIn ? null : "checkIn",
    checkOut ? null : "checkOut",
    guestsCount ? null : "guestsCount",
  ].filter(Boolean) as string[];

  if (missingFields.length > 0) {
    throw new BookingRequestValidationError(buildMissingFieldsMessage(missingFields));
  }

  return {
    checkIn: checkIn as string,
    checkOut: checkOut as string,
    guestsCount: guestsCount as number,
  };
}

async function resolveBookingRequestInput(
  args: z.infer<typeof createBookingRequestArgsSchema>,
  sessionId: string,
) {
  const draftState = await getDraftState(sessionId);
  const mergedInput = {
    roomId: args.roomId ?? draftState?.roomId ?? null,
    guestFullName: args.guestFullName ?? draftState?.guestFullName ?? null,
    guestEmail: args.guestEmail ?? draftState?.guestEmail ?? null,
    guestPhone: args.guestPhone ?? draftState?.guestPhone ?? null,
    language: args.language ?? draftState?.language ?? "it",
    guestsCount: args.guestsCount ?? draftState?.guestsCount ?? null,
    checkIn: args.checkIn ?? draftState?.checkIn ?? null,
    checkOut: args.checkOut ?? draftState?.checkOut ?? null,
    notes: args.notes ?? draftState?.notes ?? "",
    consentPrivacy: args.consentPrivacy,
    consentCookies: args.consentCookies,
    source: args.source ?? "website",
  };

  if (!mergedInput.consentPrivacy || !mergedInput.consentCookies) {
    throw new BookingRequestValidationError(
      "Please ask the user to accept the privacy and cookie policy before creating the booking.",
    );
  }

  if (
    !mergedInput.roomId &&
    mergedInput.checkIn &&
    mergedInput.checkOut &&
    mergedInput.guestsCount
  ) {
    const checkIn = parseIsoDate(mergedInput.checkIn);
    const checkOut = parseIsoDate(mergedInput.checkOut);

    if (checkIn && checkOut) {
      validateBookingDateRange(checkIn, checkOut);

      const availability = await getAvailabilitySnapshot({
        checkIn,
        checkOut,
        guestsCount: mergedInput.guestsCount,
        supabase: createSupabaseAdminClient(),
      });

      if (availability.availableRoomsCount > 0) {
        throw new BookingRequestValidationError(
          "Please ask the user to choose a room before creating the booking.",
        );
      }
    }
  }

  const parsed = bookingRequestSchema.safeParse({
    roomId: mergedInput.roomId,
    guestFullName: mergedInput.guestFullName,
    guestEmail: mergedInput.guestEmail,
    guestPhone: mergedInput.guestPhone ?? "",
    language: mergedInput.language,
    guestsCount: mergedInput.guestsCount,
    checkIn: mergedInput.checkIn,
    checkOut: mergedInput.checkOut,
    notes: mergedInput.notes ?? "",
    consentPrivacy: mergedInput.consentPrivacy,
    consentCookies: mergedInput.consentCookies,
    source: mergedInput.source,
  });

  if (!parsed.success) {
    const flattenedErrors = z.flattenError(parsed.error).fieldErrors;
    const missingFields = Object.entries(flattenedErrors)
      .filter(([, errors]) => Array.isArray(errors) && errors.length > 0)
      .map(([field]) => field);

    throw new BookingRequestValidationError(buildMissingFieldsMessage(missingFields));
  }

  return parsed.data;
}

async function listRooms(language: Locale) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, slug, name_it, name_en, description_it, description_en, max_guests, included_guests, base_price_eur, extra_guest_price_eur",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((room) => ({
    roomId: room.id,
    slug: room.slug,
    name: getLocalizedWithItalianFallback(language, room.name_it, room.name_en),
    description: getLocalizedWithItalianFallback(
      language,
      room.description_it,
      room.description_en,
    ),
    maxGuests: room.max_guests,
    includedGuests: room.included_guests,
    basePriceEur: Number(room.base_price_eur),
    extraGuestPriceEur: Number(room.extra_guest_price_eur),
    breakfastIncluded: true,
    petsAllowed: false,
  }));
}

async function getPolicies(language: Locale) {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("policies")
    .select("key, value_it, value_en");

  if (error) {
    throw error;
  }

  const policiesByKey = new Map(
    (data ?? []).map((policy) => [
      policy.key,
      getLocalizedWithItalianFallback(language, policy.value_it, policy.value_en),
    ]),
  );

  return {
    cancellationPolicy: policiesByKey.get("cancellation_policy") ?? null,
    checkInCheckOutPolicy: policiesByKey.get("checkin_checkout_policy") ?? null,
    breakfastPolicy: policiesByKey.get("breakfast_policy") ?? null,
    petsPolicy: policiesByKey.get("pets_policy") ?? null,
    fixedRules: {
      breakfastIncluded: true,
      petsAllowed: false,
      checkInFrom: "16:00",
      checkOutBy: "10:30",
      payment: language === "en" ? "Cash on arrival only." : "Pagamento solo in contanti all'arrivo.",
    },
  };
}

async function checkAvailability(
  args: z.infer<typeof checkAvailabilityArgsSchema>,
  sessionId: string,
) {
  const resolvedInput = await resolveAvailabilityInput(args, sessionId);
  const checkIn = parseIsoDate(resolvedInput.checkIn);
  const checkOut = parseIsoDate(resolvedInput.checkOut);

  if (!checkIn || !checkOut) {
    throw new BookingRequestValidationError(
      "checkIn and checkOut must be valid dates in YYYY-MM-DD format.",
    );
  }

  validateBookingDateRange(checkIn, checkOut);

  return getAvailabilitySnapshot({
    checkIn,
    checkOut,
    guestsCount: resolvedInput.guestsCount,
    supabase: createSupabaseAdminClient(),
  });
}

async function createBookingRequestTool(
  args: z.infer<typeof createBookingRequestArgsSchema>,
  sessionId: string,
  channel: "chat" | "voice",
) {
  const resolvedInput = await resolveBookingRequestInput(args, sessionId);
  const booking = await createBookingRequest(resolvedInput);

  await resetChatBookingState(sessionId);

  if (channel === "chat") {
    await logEvent({
      type: "booking_created_from_chat",
      source: "website_chat",
      message: `Booking ${booking.bookingCode} created from chat.`,
      metadata: {
        bookingId: booking.bookingId,
        bookingCode: booking.bookingCode,
        status: booking.status,
        source: booking.source,
        roomId: booking.roomId,
      },
    });
  }

  return {
    booking_id: booking.bookingId,
    booking_code: booking.bookingCode,
    room_id: booking.roomId,
    source: booking.source,
    status: booking.status,
    auto_confirmed: booking.autoConfirmed,
    admin_confirmation_required: booking.status === "pending_admin_confirmation",
    nights: booking.nights,
    price_total_eur: booking.totalPriceEur,
  };
}

export async function runBookingAgentTool(
  name: string,
  args: unknown,
  sessionId: string,
  channel: "chat" | "voice" = "chat",
) {
  if (name === "list_rooms") {
    const parsed = listRoomsArgsSchema.parse(args);
    return listRooms(parsed.language);
  }

  if (name === "get_policies") {
    const parsed = getPoliciesArgsSchema.parse(args);
    return getPolicies(parsed.language);
  }

  if (name === "update_booking_state") {
    const parsed = updateBookingStateArgsSchema.parse(args);
    return updateBookingState(sessionId, {
      checkIn: parsed.checkIn,
      checkOut: parsed.checkOut,
      guestsCount: parsed.guestsCount,
      roomsCount: parsed.roomsCount,
      roomId: parsed.roomId,
      guestFullName: normalizeNullableText(parsed.guestFullName),
      guestEmail: normalizeNullableText(parsed.guestEmail),
      guestPhone: normalizeNullableText(parsed.guestPhone),
      notes: normalizeNullableText(parsed.notes),
    });
  }

  if (name === "check_availability") {
    const parsed = checkAvailabilityArgsSchema.parse(args);
    return checkAvailability(parsed, sessionId);
  }

  if (name === "create_booking_request") {
    const parsed = createBookingRequestArgsSchema.parse(args);
    return createBookingRequestTool(parsed, sessionId, channel);
  }

  throw new Error(`Unknown tool: ${name}`);
}
