import type { SupabaseClient } from "@supabase/supabase-js";

import { calculateNights } from "@/lib/booking/date";
import { calculateRoomPrice } from "@/lib/booking/pricing";

const UNAVAILABLE_BOOKING_STATUSES = ["confirmed", "pending_admin_confirmation"] as const;

type RoomRecord = {
  id: string;
  slug: string;
  name_en: string;
  max_guests: number;
  included_guests: number;
  base_price_eur: number | string;
  extra_guest_price_eur: number | string;
};

type BookingRecord = {
  room_id: string;
};

type AvailabilityBlockRecord = {
  room_id: string;
  reason: string;
};

export type AvailabilityRoom = {
  roomId: string;
  slug: string;
  name: string;
  maxGuests: number;
  available: boolean;
  totalPriceEur: number | null;
  reason: string | null;
};

export type AvailabilitySnapshot = {
  rooms: AvailabilityRoom[];
  availableRoomsCount: number;
  totalRoomsCount: number;
};

type GetAvailabilitySnapshotParams = {
  checkIn: Date;
  checkOut: Date;
  guestsCount: number;
  supabase: SupabaseClient;
};

function parsePrice(value: number | string, fieldName: string) {
  const price = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(price)) {
    throw new Error(`Invalid numeric value returned for "${fieldName}".`);
  }

  return price;
}

export async function getAvailabilitySnapshot({
  checkIn,
  checkOut,
  guestsCount,
  supabase,
}: GetAvailabilitySnapshotParams): Promise<AvailabilitySnapshot> {
  const checkInIso = checkIn.toISOString().slice(0, 10);
  const checkOutIso = checkOut.toISOString().slice(0, 10);
  const nights = calculateNights(checkIn, checkOut);

  const { data: rooms, error: roomsError } = await supabase
    .from("rooms")
    .select("id, slug, name_en, max_guests, included_guests, base_price_eur, extra_guest_price_eur")
    .eq("is_active", true)
    .gte("max_guests", guestsCount)
    .order("sort_order", { ascending: true });

  if (roomsError) {
    throw roomsError;
  }

  const activeRooms = (rooms ?? []) as RoomRecord[];
  const totalRoomsCount = activeRooms.length;

  if (activeRooms.length === 0) {
    return {
      rooms: [],
      availableRoomsCount: 0,
      totalRoomsCount,
    };
  }

  const roomIds = activeRooms.map((room) => room.id);

  const [{ data: overlappingBookings, error: bookingsError }, { data: overlappingBlocks, error: blocksError }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("room_id")
        .in("room_id", roomIds)
        .in("status", [...UNAVAILABLE_BOOKING_STATUSES])
        .lt("check_in_date", checkOutIso)
        .gt("check_out_date", checkInIso),
      supabase
        .from("availability_blocks")
        .select("room_id, reason")
        .in("room_id", roomIds)
        .lt("start_date", checkOutIso)
        .gt("end_date", checkInIso),
    ]);

  if (bookingsError) {
    throw bookingsError;
  }

  if (blocksError) {
    throw blocksError;
  }

  const bookedRoomIds = new Set(
    ((overlappingBookings ?? []) as BookingRecord[]).map((booking) => booking.room_id),
  );
  const blocksByRoomId = new Map(
    ((overlappingBlocks ?? []) as AvailabilityBlockRecord[]).map((block) => [block.room_id, block.reason]),
  );

  const roomsResponse = activeRooms.map((room) => {
    const blockReason = blocksByRoomId.get(room.id);
    const isBlocked = Boolean(blockReason);
    const hasBookingOverlap = bookedRoomIds.has(room.id);
    const available = !isBlocked && !hasBookingOverlap;

    return {
      roomId: room.id,
      slug: room.slug,
      name: room.name_en,
      maxGuests: room.max_guests,
      available,
      totalPriceEur: available
        ? calculateRoomPrice({
            base_price_eur: parsePrice(room.base_price_eur, "base_price_eur"),
            included_guests: room.included_guests,
            extra_guest_price_eur: parsePrice(
              room.extra_guest_price_eur,
              "extra_guest_price_eur",
            ),
            guests_count: guestsCount,
            nights,
          })
        : null,
      reason: blockReason ?? (hasBookingOverlap ? "overlapping_booking" : null),
    };
  });

  return {
    rooms: roomsResponse,
    availableRoomsCount: roomsResponse.filter((room) => room.available).length,
    totalRoomsCount,
  };
}
