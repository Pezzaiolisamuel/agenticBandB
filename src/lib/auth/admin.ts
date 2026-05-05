import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function findAdminProfile(userId: string, userEmail: string | null | undefined) {
  const adminSupabase = createSupabaseAdminClient();

  const strategies = [
    () =>
      adminSupabase
        .from("admin_profiles")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle(),
    () =>
      adminSupabase
        .from("admin_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle(),
    () =>
      userEmail
        ? adminSupabase
            .from("admin_profiles")
            .select("email")
            .eq("email", userEmail)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
  ];

  let lastError: unknown = null;

  for (const strategy of strategies) {
    const { data, error } = await strategy();

    if (!error) {
      if (data) {
        return data;
      }

      continue;
    }

    if ("code" in error && error.code === "42703") {
      lastError = error;
      continue;
    }

    throw error;
  }

  if (lastError) {
    console.warn(
      "admin_profiles exists but does not match the expected schema. Expected one of: user_id uuid, id uuid, or email text.",
      lastError,
    );
  }

  return null;
}

export async function requireAdminUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const adminProfile = await findAdminProfile(user.id, user.email);

  if (!adminProfile) {
    redirect("/admin/login?error=not-authorized");
  }

  return user;
}
