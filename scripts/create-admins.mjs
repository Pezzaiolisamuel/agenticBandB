import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase env vars.");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

const admins = [
  {
    email: "pezzaiolisamuel@gmail.com",
    password: "test",
  }
];

for (const admin of admins) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: admin.email,
    password: admin.password,
    email_confirm: true,
  });

  if (error) {
    console.error("Error creating user:", admin.email, error.message);
    continue;
  }

  console.log("Created user:", {
    email: data.user.email,
    id: data.user.id,
  });

  const { error: profileError } = await supabase.from("admin_profiles").upsert({
    user_id: data.user.id,
  });

  if (profileError) {
    console.error("Error creating admin profile:", admin.email, profileError.message);
    continue;
  }

  console.log("Created admin profile:", {
    email: data.user.email,
    user_id: data.user.id,
  });
}
