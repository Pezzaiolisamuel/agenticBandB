import { NextResponse } from "next/server";
import type { PlaceholderApiPayload } from "@/types/api";

export function createPlaceholderApiResponse(route: string, message: string) {
  const payload: PlaceholderApiPayload = {
    ok: false,
    route,
    status: "not_implemented",
    message
  };

  return NextResponse.json(
    payload,
    {
      status: 501
    }
  );
}
