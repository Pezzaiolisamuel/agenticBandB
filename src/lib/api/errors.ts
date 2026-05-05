import { NextResponse } from "next/server";
import { z } from "zod";

type ApiErrorPayload = {
  error: {
    code: string;
    message: string;
  };
};

export function createApiErrorResponse(code: string, message: string, status: number) {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
    },
  };

  return NextResponse.json(payload, { status });
}

export function logValidationFailure(route: string, error: z.ZodError | string) {
  if (typeof error === "string") {
    console.error(`Validation failed for ${route}:`, error);
    return;
  }

  console.error(`Validation failed for ${route}:`, z.flattenError(error).fieldErrors);
}
