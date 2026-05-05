"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ADMIN_BOOKING_EMAILS_KEY = "admin_booking_emails";

function readEmails(formData: FormData) {
  const emails = String(formData.get("emails") ?? "").trim();

  if (!emails) {
    throw new Error("Inserisci almeno un indirizzo email amministrativo.");
  }

  return emails;
}

export async function saveAdminEmails(formData: FormData) {
  try {
    await requireAdminUser();

    const emails = readEmails(formData);
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("policies").upsert(
      {
        key: ADMIN_BOOKING_EMAILS_KEY,
        value_it: emails,
        value_en: emails,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "key",
      },
    );

    if (error) {
      throw error;
    }

    revalidatePath("/admin/emails");
    redirect("/admin/emails?success=Email%20amministrative%20salvate.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossibile salvare le email amministrative.";
    redirect(`/admin/emails?error=${encodeURIComponent(message)}`);
  }
}
