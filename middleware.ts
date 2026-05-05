import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { defaultLocale, getLocaleFromValue, isSupportedLocale, LANGUAGE_COOKIE_NAME } from "@/lib/i18n";

function setLanguageCookie(response: NextResponse, locale: string) {
  response.cookies.set(LANGUAGE_COOKIE_NAME, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const [, maybeLocale] = pathname.split("/");

  if (maybeLocale === defaultLocale) {
    const redirectUrl = request.nextUrl.clone();
    const strippedPath = pathname.slice(`/${defaultLocale}`.length) || "/";

    redirectUrl.pathname = strippedPath;

    const response = NextResponse.redirect(redirectUrl);
    setLanguageCookie(response, defaultLocale);

    return response;
  }

  if (isSupportedLocale(maybeLocale)) {
    const locale = getLocaleFromValue(maybeLocale);
    const response = NextResponse.next();

    setLanguageCookie(response, locale);

    return response;
  }

  const response = NextResponse.next();
  setLanguageCookie(response, defaultLocale);

  return response;
}

export const config = {
  matcher: ["/((?!api|admin|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
