import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { defaultLocale, getLocaleFromValue, LANGUAGE_COOKIE_NAME } from "@/lib/i18n";

export default async function RootPage() {
  const cookieStore = await cookies();
  const preferredLocale = getLocaleFromValue(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);

  redirect(`/${preferredLocale || defaultLocale}`);
}
