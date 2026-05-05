"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { buildLocalizedPath, LANGUAGE_COOKIE_NAME, locales, stripLocalePrefix, type Locale } from "@/lib/i18n";

type LocaleSwitcherProps = {
  currentLocale: Locale;
};

export function LocaleSwitcher({ currentLocale }: LocaleSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const normalizedPath = stripLocalePrefix(pathname);
  const localeFlags: Record<Locale, { src: string; alt: string; title: string; ariaLabel: string }> = {
    it: {
      src: "/italian.png",
      alt: "Bandiera italiana",
      title: "Italiano",
      ariaLabel: "Passa all'italiano",
    },
    en: {
      src: "/english.png",
      alt: "English flag",
      title: "English",
      ariaLabel: "Switch to English",
    },
  };

  function handleLocaleChange(locale: Locale) {
    document.cookie = `${LANGUAGE_COOKIE_NAME}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.push(buildLocalizedPath(locale, normalizedPath));
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
            className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
              isActive
                ? "scale-110 border-brand-700 bg-brand-700 shadow-sm"
                : "border-stone-200 bg-white hover:border-brand-400"
            }`}
            aria-label={localeFlags[locale].ariaLabel}
            title={localeFlags[locale].title}
          >
            <span className="overflow-hidden rounded-full">
              <Image
                src={localeFlags[locale].src}
                alt={localeFlags[locale].alt}
                width={28}
                height={28}
                className={`rounded-full object-cover transition ${
                  isActive ? "h-8 w-8" : "h-7 w-7"
                }`}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
