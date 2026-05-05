"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import {
  sendGuestBookingCancelledEmail,
  sendGuestBookingConfirmedEmail,
} from "@/lib/email/send-email";
import { logAgentLog, logEvent } from "@/lib/logging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingStatus = "pending_admin_confirmation" | "confirmed" | "cancelled" | "completed";
type BookingEventType = "checked_in" | "checked_out";

async function getBookingForAction(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      booking_code,
      status,
      guest_full_name,
      guest_email,
      language,
      guests_count,
      check_in_date,
      check_out_date,
      price_total_eur,
      rooms (
        name_it,
        name_en
      )
      `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as {
    id: string;
    booking_code: string;
    status: BookingStatus;
    guest_full_name: string;
    guest_email: string;
    language: "it" | "en";
    guests_count: number;
    check_in_date: string;
    check_out_date: string;
    price_total_eur: number;
    rooms: { name_it: string; name_en: string }[] | null;
  } | null;
}

async function createAuditLogEntry({
  bookingCode,
  bookingId,
  createdByEmail,
  eventType,
  note,
}: {
  bookingCode: string;
  bookingId: string;
  createdByEmail: string | null | undefined;
  eventType: string;
  note?: string | null;
}) {
  const messageParts = [
    `Booking ${bookingCode}`,
    `event: ${eventType}`,
    createdByEmail ? `admin: ${createdByEmail}` : null,
    note ? `note: ${note}` : null,
  ].filter(Boolean);

  await logAgentLog({
    channel: "website_chat",
    sessionId: bookingId,
    assistantMessage: messageParts.join(" | "),
    toolName: eventType,
    userMessage: note ?? null,
  });

  await logEvent({
    type: eventType,
    source: "admin_booking_action",
    message: `Admin action recorded for booking ${bookingCode}.`,
    metadata: {
      bookingId,
      bookingCode,
      adminEmail: createdByEmail ?? null,
      note: note ?? null,
    },
  });
}

async function createBookingEvent({
  bookingId,
  eventType,
  note,
}: {
  bookingId: string;
  eventType: BookingEventType;
  note?: string | null;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("booking_events").insert({
    booking_id: bookingId,
    event_type: eventType,
    note: note ?? null,
  });

  if (error) {
    throw error;
  }
}

async function getBookingEventHistory(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("booking_events")
    .select("event_type, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{ event_type: string; created_at: string }>;
}

async function updateBookingStatus(bookingId: string, nextStatus: BookingStatus, eventType: string) {
  const adminUser = await requireAdminUser();
  const booking = await getBookingForAction(bookingId);

  if (!booking) {
    throw new Error("Prenotazione non trovata.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("bookings")
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  if (error) {
    throw error;
  }

  await logEvent({
    type: "booking_status_changed",
    source: "admin_booking_action",
    message: `Booking ${booking.booking_code} status changed.`,
    metadata: {
      bookingId,
      bookingCode: booking.booking_code,
      previousStatus: booking.status,
      nextStatus,
    },
  });

  await createAuditLogEntry({
    bookingCode: booking.booking_code,
    bookingId,
    createdByEmail: adminUser.email,
    eventType,
    note: `Status changed from ${booking.status} to ${nextStatus}.`,
  });

  const room = booking.rooms?.[0] ?? null;
  const roomName =
    booking.language === "en"
      ? room?.name_en || room?.name_it || "Room"
      : room?.name_it || room?.name_en || "Camera";
  const emailPayload = {
    bookingCode: booking.booking_code,
    guestFullName: booking.guest_full_name,
    guestEmail: booking.guest_email,
    language: booking.language,
    roomName,
    checkInDate: booking.check_in_date,
    checkOutDate: booking.check_out_date,
    guestsCount: booking.guests_count,
    status: nextStatus,
    totalPriceEur: Number(booking.price_total_eur),
  } as const;

  if (nextStatus === "confirmed") {
    await sendGuestBookingConfirmedEmail(emailPayload);
  }

  if (nextStatus === "cancelled") {
    await sendGuestBookingCancelledEmail(emailPayload);
  }

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/archive");
}

export async function confirmPendingBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    redirect("/admin/bookings?error=missing-booking-id");
  }

  try {
    await updateBookingStatus(bookingId, "confirmed", "admin_confirmed_booking");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile confermare la prenotazione.";
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent("Prenotazione confermata.")}`);
}

export async function cancelBooking(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    redirect("/admin/bookings?error=missing-booking-id");
  }

  try {
    await updateBookingStatus(bookingId, "cancelled", "admin_cancelled_booking");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile annullare la prenotazione.";
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent("Prenotazione annullata.")}`);
}

export async function addAdminNote(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");
  const note = String(formData.get("note") ?? "").trim();

  if (!bookingId) {
    redirect("/admin/bookings?error=missing-booking-id");
  }

  if (!note) {
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent("La nota admin non puo essere vuota.")}`);
  }

  try {
    const adminUser = await requireAdminUser();
    const booking = await getBookingForAction(bookingId);

    if (!booking) {
      throw new Error("Prenotazione non trovata.");
    }

    await createAuditLogEntry({
      bookingCode: booking.booking_code,
      bookingId,
      createdByEmail: adminUser.email,
      eventType: "admin_note_added",
      note,
    });

    revalidatePath(`/admin/bookings/${bookingId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile salvare la nota admin.";
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent(message)}`);
  }

  redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent("Nota admin salvata.")}`);
}

export async function markBookingCheckedIn(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    redirect("/admin/bookings?error=missing-booking-id");
  }

  try {
    const adminUser = await requireAdminUser();
    const booking = await getBookingForAction(bookingId);

    if (!booking) {
      throw new Error("Prenotazione non trovata.");
    }

    if (booking.status === "cancelled") {
      throw new Error("Non e possibile registrare il check-in per una prenotazione annullata.");
    }

    const history = await getBookingEventHistory(bookingId);
    const hasCheckedIn = history.some((entry) => entry.event_type === "checked_in");

    if (hasCheckedIn) {
      throw new Error("Il check-in e gia stato registrato per questa prenotazione.");
    }

    await createBookingEvent({
      bookingId,
      eventType: "checked_in",
    });

    await createAuditLogEntry({
      bookingCode: booking.booking_code,
      bookingId,
      createdByEmail: adminUser.email,
      eventType: "admin_checked_in_booking",
      note: "Check-in registrato.",
    });

    await logEvent({
      type: "booking_checked_in",
      source: "admin_booking_action",
      message: `Booking ${booking.booking_code} checked in.`,
      metadata: {
        bookingId,
        bookingCode: booking.booking_code,
      },
    });

    revalidatePath(`/admin/bookings/${bookingId}`);
    redirect(`/admin/bookings/${bookingId}?success=${encodeURIComponent("Check-in registrato.")}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile registrare il check-in.";
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent(message)}`);
  }
}

export async function markBookingCheckedOut(formData: FormData) {
  const bookingId = String(formData.get("bookingId") ?? "");

  if (!bookingId) {
    redirect("/admin/bookings?error=missing-booking-id");
  }

  try {
    const adminUser = await requireAdminUser();
    const booking = await getBookingForAction(bookingId);

    if (!booking) {
      throw new Error("Prenotazione non trovata.");
    }

    const history = await getBookingEventHistory(bookingId);
    const hasCheckedIn = history.some((entry) => entry.event_type === "checked_in");
    const hasCheckedOut = history.some((entry) => entry.event_type === "checked_out");

    if (!hasCheckedIn) {
      throw new Error("Non e possibile registrare il check-out prima del check-in.");
    }

    if (hasCheckedOut) {
      throw new Error("Il check-out e gia stato registrato per questa prenotazione.");
    }

    await createBookingEvent({
      bookingId,
      eventType: "checked_out",
    });

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("bookings")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    if (error) {
      throw error;
    }

    await createAuditLogEntry({
      bookingCode: booking.booking_code,
      bookingId,
      createdByEmail: adminUser.email,
      eventType: "admin_checked_out_booking",
      note: "Check-out registrato e prenotazione completata.",
    });

    await logEvent({
      type: "booking_checked_out",
      source: "admin_booking_action",
      message: `Booking ${booking.booking_code} checked out.`,
      metadata: {
        bookingId,
        bookingCode: booking.booking_code,
        nextStatus: "completed",
      },
    });

    revalidatePath(`/admin/bookings/${bookingId}`);
    revalidatePath("/admin/bookings");
    revalidatePath("/admin/bookings/archive");
    redirect(
      `/admin/bookings/${bookingId}?success=${encodeURIComponent(
        "Check-out registrato e prenotazione completata.",
      )}`,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile registrare il check-out.";
    redirect(`/admin/bookings/${bookingId}?error=${encodeURIComponent(message)}`);
  }
}
