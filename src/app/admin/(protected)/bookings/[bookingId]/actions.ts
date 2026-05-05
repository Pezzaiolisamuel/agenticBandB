"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { logAgentLog, logEvent } from "@/lib/logging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingStatus = "pending_admin_confirmation" | "confirmed" | "cancelled" | "completed";

async function getBookingForAction(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, booking_code, status")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as { id: string; booking_code: string; status: BookingStatus } | null;
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

  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath("/admin/bookings");
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
