"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { parseIsoDate } from "@/lib/booking/date";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function redirectWithMessage(message: string, type: "error" | "success") {
  redirect(`/admin/availability?${type}=${encodeURIComponent(message)}`);
}

function readRequiredString(formData: FormData, fieldName: string) {
  const value = String(formData.get(fieldName) ?? "").trim();

  if (!value) {
    throw new Error(`Campo mancante: ${fieldName}.`);
  }

  return value;
}

function validateAvailabilityDates(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    throw new Error("Le date del blocco disponibilita devono usare valori validi nel formato YYYY-MM-DD.");
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error("La data finale del blocco disponibilita deve essere successiva alla data iniziale.");
  }
}

function revalidateAvailabilityViews() {
  revalidatePath("/admin/availability");
  revalidatePath("/admin/availability-blocks");
}

export async function createAvailabilityBlock(formData: FormData) {
  try {
    const adminUser = await requireAdminUser();
    const roomId = readRequiredString(formData, "roomId");
    const startDate = readRequiredString(formData, "start_date");
    const endDate = readRequiredString(formData, "end_date");
    const reason = readRequiredString(formData, "reason");

    validateAvailabilityDates(startDate, endDate);

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("availability_blocks").insert({
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
      reason,
      created_by: adminUser.email ?? adminUser.id,
    });

    if (error) {
      throw error;
    }

    revalidateAvailabilityViews();
    redirectWithMessage("Blocco di disponibilita creato.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossibile creare il blocco di disponibilita.";
    redirectWithMessage(message, "error");
  }
}

export async function deleteAvailabilityBlock(formData: FormData) {
  try {
    await requireAdminUser();

    const blockId = readRequiredString(formData, "blockId");
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("availability_blocks").delete().eq("id", blockId);

    if (error) {
      throw error;
    }

    revalidateAvailabilityViews();
    redirectWithMessage("Blocco di disponibilita eliminato.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossibile eliminare il blocco di disponibilita.";
    redirectWithMessage(message, "error");
  }
}
