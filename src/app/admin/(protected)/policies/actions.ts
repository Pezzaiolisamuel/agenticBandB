"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminUser } from "@/lib/auth/admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const policyKeys = [
  "cancellation_policy",
  "checkin_checkout_policy",
  "breakfast_policy",
  "pets_policy",
] as const;

type PolicyKey = (typeof policyKeys)[number];

function readPolicyField(formData: FormData, key: PolicyKey, locale: "it" | "en") {
  const value = String(formData.get(`${key}_${locale}`) ?? "").trim();

  if (!value) {
    throw new Error(`Contenuto mancante per ${key} in ${locale.toUpperCase()}.`);
  }

  return value;
}

export async function savePolicies(formData: FormData) {
  try {
    await requireAdminUser();

    const rows = policyKeys.map((key) => ({
      key,
      value_it: readPolicyField(formData, key, "it"),
      value_en: readPolicyField(formData, key, "en"),
      updated_at: new Date().toISOString(),
    }));

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("policies").upsert(rows, {
      onConflict: "key",
    });

    if (error) {
      throw error;
    }

    revalidatePath("/admin/policies");
    redirect("/admin/policies?success=Policy%20salvate.");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Impossibile salvare le policy.";
    redirect(`/admin/policies?error=${encodeURIComponent(message)}`);
  }
}
