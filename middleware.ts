import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getLocaleFromValue, isSupportedLocale, LANGUAGE_COOKIE_NAME } from "@/lib/i18n";

export function middleware(request: NextRequest) {
  const [, maybeLocale] = request.nextUrl.pathname.split("/");

  if (!isSupportedLocale(maybeLocale)) {
    return NextResponse.next();
  }

  const locale = getLocaleFromValue(maybeLocale);
  const response = NextResponse.next();

  response.cookies.set(LANGUAGE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export const config = {
  matcher: ["/it/:path*", "/en/:path*"],
};
