type PublicEnvName = "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY";
type ServerEnvName =
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "OPENAI_API_KEY"
  | "RESEND_API_KEY"
  | "ADMIN_BOOKING_EMAIL";

function missingEnvError(name: string) {
  return new Error(
    `Missing required environment variable "${name}". Add it to your server environment or .env.local.`,
  );
}

function readRequiredServerEnv(name: ServerEnvName) {
  const value = process.env[name];

  if (!value) {
    throw missingEnvError(name);
  }

  return value;
}

function readRequiredUrl(name: PublicEnvName) {
  const value =
    name === "NEXT_PUBLIC_SUPABASE_URL"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!value) {
    throw missingEnvError(name);
  }

  try {
    return new URL(value).toString();
  } catch {
    throw new Error(`Environment variable "${name}" must be a valid URL.`);
  }
}

export function getSupabasePublicEnv() {
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw missingEnvError("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  return {
    url: readRequiredUrl("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey,
  };
}

export function getSupabaseServiceRoleKey() {
  if (typeof window !== "undefined") {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is server-only and must never be accessed from the browser.',
    );
  }

  return readRequiredServerEnv("SUPABASE_SERVICE_ROLE_KEY");
}

export function getOpenAIApiKey() {
  if (typeof window !== "undefined") {
    throw new Error("OPENAI_API_KEY is server-only and must never be accessed from the browser.");
  }

  return readRequiredServerEnv("OPENAI_API_KEY");
}

export function getResendApiKey() {
  if (typeof window !== "undefined") {
    throw new Error("RESEND_API_KEY is server-only and must never be accessed from the browser.");
  }

  return readRequiredServerEnv("RESEND_API_KEY");
}

export function getAdminBookingEmail() {
  if (typeof window !== "undefined") {
    throw new Error(
      "ADMIN_BOOKING_EMAIL is server-only and must never be accessed from the browser.",
    );
  }

  return readRequiredServerEnv("ADMIN_BOOKING_EMAIL");
}
