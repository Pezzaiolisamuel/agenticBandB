export type ChatBookingState = {
  session_id: string;
  language: string | null;
  check_in: string | null;
  check_out: string | null;
  guests_count: number | null;
  rooms_count: number | null;
  room_id: string | null;
  guest_full_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  last_response_id: string | null;
  updated_at: string | null;
};

export type BookingDraftPatch = {
  checkIn: string | null;
  checkOut: string | null;
  guestsCount: number | null;
  roomsCount: number | null;
  roomId: string | null;
  guestFullName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
};

export type ResolvedBookingDraft = {
  checkIn: string | null;
  checkOut: string | null;
  guestsCount: number | null;
  roomsCount: number | null;
  roomId: string | null;
  guestFullName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
  notes: string | null;
  language: string | null;
  lastResponseId: string | null;
  updatedAt: string | null;
};

export function mapChatBookingStateRow(
  row: Partial<ChatBookingState> | null | undefined,
): ResolvedBookingDraft {
  return {
    checkIn: row?.check_in ?? null,
    checkOut: row?.check_out ?? null,
    guestsCount: row?.guests_count ?? null,
    roomsCount: row?.rooms_count ?? null,
    roomId: row?.room_id ?? null,
    guestFullName: row?.guest_full_name ?? null,
    guestEmail: row?.guest_email ?? null,
    guestPhone: row?.guest_phone ?? null,
    notes: row?.notes ?? null,
    language: row?.language ?? null,
    lastResponseId: row?.last_response_id ?? null,
    updatedAt: row?.updated_at ?? null,
  };
}

export function mergeBookingDraftPatch(
  currentState: ResolvedBookingDraft,
  patch: BookingDraftPatch,
): ResolvedBookingDraft {
  return {
    ...currentState,
    checkIn: patch.checkIn ?? currentState.checkIn,
    checkOut: patch.checkOut ?? currentState.checkOut,
    guestsCount: patch.guestsCount ?? currentState.guestsCount,
    roomsCount: patch.roomsCount ?? currentState.roomsCount,
    roomId: patch.roomId ?? currentState.roomId,
    guestFullName: patch.guestFullName ?? currentState.guestFullName,
    guestEmail: patch.guestEmail ?? currentState.guestEmail,
    guestPhone: patch.guestPhone ?? currentState.guestPhone,
    notes: patch.notes ?? currentState.notes,
  };
}

export function formatBookingDraftForPrompt(state: ResolvedBookingDraft | null) {
  if (!state) {
    return "Current booking draft: empty";
  }

  return `Current booking draft:
${JSON.stringify(
    {
      language: state.language,
      checkIn: state.checkIn,
      checkOut: state.checkOut,
      guestsCount: state.guestsCount,
      roomsCount: state.roomsCount,
      roomId: state.roomId,
      guestFullName: state.guestFullName,
      guestEmail: state.guestEmail,
      guestPhone: state.guestPhone,
      notes: state.notes,
    },
    null,
    2,
  )}`;
}
