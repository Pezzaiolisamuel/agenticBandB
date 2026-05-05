"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { parseIsoDate } from "@/lib/booking/date";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function parseNonNegativeNumber(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldName} deve essere un numero non negativo.`);
  }

  return parsed;
}

function parsePositiveInteger(value: FormDataEntryValue | null, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${fieldName} deve essere un numero intero positivo.`);
  }

  return parsed;
}

function validateRuleDates(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end) {
    throw new Error("Le date stagionali devono usare valori validi nel formato YYYY-MM-DD.");
  }

  if (end.getTime() < start.getTime()) {
    throw new Error("La data finale stagionale deve essere uguale o successiva alla data iniziale.");
  }
}

function getRoomId(formData: FormData) {
  const roomId = String(formData.get("roomId") ?? "");

  if (!roomId) {
    throw new Error("ID camera mancante.");
  }

  return roomId;
}

function revalidatePricingViews(roomId?: string) {
  revalidatePath("/admin/prices");

  if (roomId) {
    revalidatePath(`/admin/prices?room=${roomId}`);
  }
}

function redirectWithMessage(message: string, type: "error" | "success") {
  redirect(`/admin/prices?${type}=${encodeURIComponent(message)}`);
}

export async function updateRoomPricing(formData: FormData) {
  try {
    await requireAdminUser();

    const roomId = getRoomId(formData);
    const basePrice = parseNonNegativeNumber(formData.get("base_price_eur"), "Il prezzo base");
    const extraGuestPrice = parseNonNegativeNumber(
      formData.get("extra_guest_price_eur"),
      "Il prezzo ospite extra",
    );
    const includedGuests = parsePositiveInteger(
      formData.get("included_guests"),
      "Gli ospiti inclusi",
    );

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from("rooms")
      .update({
        base_price_eur: basePrice,
        extra_guest_price_eur: extraGuestPrice,
        included_guests: includedGuests,
        updated_at: new Date().toISOString(),
      })
      .eq("id", roomId);

    if (error) {
      throw error;
    }

    revalidatePricingViews(roomId);
    redirectWithMessage("Prezzi della camera aggiornati.", "success");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile aggiornare i prezzi della camera.";
    redirectWithMessage(message, "error");
  }
}

export async function createSeasonalPricingRule(formData: FormData) {
  try {
    await requireAdminUser();

    const roomId = getRoomId(formData);
    const startDate = String(formData.get("start_date") ?? "");
    const endDate = String(formData.get("end_date") ?? "");
    const price = parseNonNegativeNumber(formData.get("price_eur"), "Il prezzo stagionale");
    const minNights = parsePositiveInteger(formData.get("min_nights"), "Le notti minime");

    validateRuleDates(startDate, endDate);

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("pricing_rules").insert({
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
      price_eur: price,
      min_nights: minNights,
    });

    if (error) {
      throw error;
    }

    revalidatePricingViews(roomId);
    redirectWithMessage("Regola di prezzo stagionale aggiunta.", "success");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossibile creare la regola di prezzo stagionale.";
    redirectWithMessage(message, "error");
  }
}
