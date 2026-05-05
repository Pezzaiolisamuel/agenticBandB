import { NextResponse } from "next/server";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult =
  | {
      allowed: true;
      retryAfterSeconds: 0;
    }
  | {
      allowed: false;
      retryAfterSeconds: number;
    };

const rateLimitStore = new Map<string, number[]>();

// Best-effort in-memory limiter for local/dev and simple deployments.
// In serverless or multi-instance environments this is not globally consistent.
export function consumeRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = rateLimitStore.get(key) ?? [];
  const recent = existing.filter((timestamp) => now - timestamp < windowMs);

  if (recent.length >= limit) {
    const retryAfterMs = windowMs - (now - recent[0]);

    return {
      allowed: false,
      retryAfterSeconds: Math.max(Math.ceil(retryAfterMs / 1000), 1),
    };
  }

  recent.push(now);
  rateLimitStore.set(key, recent);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

export function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  const realIp = request.headers.get("x-real-ip");

  if (realIp) {
    return realIp.trim() || "unknown";
  }

  return "unknown";
}

export function createRateLimitKey(routeName: string, request: Request) {
  return `${routeName}:${getClientIp(request)}`;
}

export function createRateLimitedResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      error: {
        code: "rate_limited",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}
