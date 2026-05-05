"use client";

import { usePathname, useRouter } from "next/navigation";
import { LANGUAGE_COOKIE_NAME, locales, type Locale } from "@/lib/i18n";

type LocaleSwitcherProps = {
  currentLocale: Locale;
};

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPath = pathname === `/${currentLocale}` ? "" : pathname.replace(`/${currentLocale}`, "");

  function handleLocaleChange(locale: Locale) {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(`/${locale}${normalizedPath || ""}`);
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-stone-200 bg-white p-1 text-sm">
      {locales.map((locale) => {
        const isActive = locale === currentLocale;

        return (
          <button
            type="button"
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={`rounded-full px-3 py-1.5 font-semibold ${
              isActive ? "bg-brand-700 text-white" : "text-stone-600 hover:text-brand-700"
            }`}
          >
            {locale.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
