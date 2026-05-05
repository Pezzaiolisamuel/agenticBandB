import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    hasAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    openAiKeyLast4: process.env.OPENAI_API_KEY?.slice(-4) ?? null,
  });
}