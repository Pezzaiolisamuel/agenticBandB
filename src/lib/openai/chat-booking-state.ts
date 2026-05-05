import { createSupabaseAdminClient } from "../supabase/admin";
import {
  formatBookingDraftForPrompt,
  mapChatBookingStateRow,
  mergeBookingDraftPatch,
} from "./chat-booking-state-utils";
import type {
  BookingDraftPatch,
  ChatBookingState,
  ResolvedBookingDraft,
} from "./chat-booking-state-utils";

export type { BookingDraftPatch, ChatBookingState, ResolvedBookingDraft };
export { formatBookingDraftForPrompt, mapChatBookingStateRow, mergeBookingDraftPatch };

function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export async function cleanupStaleChatBookingState() {
  const supabase = createSupabaseAdminClient();
  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("chat_booking_state")
    .delete()
    .lt("updated_at", threshold);

  if (error) {
    throw error;
  }
}

export async function getChatBookingState(sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_booking_state")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapChatBookingStateRow(data as ChatBookingState);
}

export async function updateChatBookingState(
  sessionId: string,
  patch: BookingDraftPatch,
  options?: {
    language?: string | null;
    lastResponseId?: string | null;
  },
) {
  const currentState = (await getChatBookingState(sessionId)) ?? mapChatBookingStateRow(null);
  const mergedState = mergeBookingDraftPatch(currentState, patch);
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("chat_booking_state")
    .upsert(
      {
        session_id: sessionId,
        language: normalizeString(options?.language) ?? currentState.language,
        check_in: mergedState.checkIn,
        check_out: mergedState.checkOut,
        guests_count: mergedState.guestsCount,
        rooms_count: mergedState.roomsCount,
        room_id: mergedState.roomId,
        guest_full_name: mergedState.guestFullName,
        guest_email: mergedState.guestEmail,
        guest_phone: mergedState.guestPhone,
        notes: mergedState.notes,
        last_response_id: normalizeString(options?.lastResponseId) ?? currentState.lastResponseId,
        updated_at: now,
      },
      {
        onConflict: "session_id",
      },
    )
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapChatBookingStateRow(data as ChatBookingState);
}

export async function touchChatBookingState(sessionId: string, options: {
  language?: string | null;
  lastResponseId?: string | null;
}) {
  return updateChatBookingState(
    sessionId,
    {
      checkIn: null,
      checkOut: null,
      guestsCount: null,
      roomsCount: null,
      roomId: null,
      guestFullName: null,
      guestEmail: null,
      guestPhone: null,
      notes: null,
    },
    options,
  );
}

export async function resetChatBookingState(sessionId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chat_booking_state")
    .delete()
    .eq("session_id", sessionId);

  if (error) {
    throw error;
  }
}
