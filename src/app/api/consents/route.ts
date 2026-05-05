import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const consentEventSchema = z.object({
  accepted: z.boolean(),
  consentType: z.string().trim().min(1).max(100),
  language: z.enum(["it", "en"]),
  visitorId: z.string().trim().min(1).max(255).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = await request.json();
    const result = consentEventSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid consent payload.",
          details: z.flattenError(result.error).fieldErrors,
        },
        { status: 400 },
      );
    }

    const payload = result.data;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("consents").insert({
      accepted: payload.accepted,
      consent_type: payload.consentType,
      language: payload.language,
      visitor_id: payload.visitorId ?? null,
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to store consent event.", error);

    return NextResponse.json(
      {
        error: "Failed to store consent event.",
      },
      { status: 500 },
    );
  }
}
