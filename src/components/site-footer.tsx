import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import type { Dictionary, Locale } from "@/lib/locales";

type SiteFooterProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteFooter({ locale, dictionary }: SiteFooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-2xl text-brand-900">
            {dictionary.site.name}
          </p>
          <p className="mt-2 text-sm text-stone-500">{dictionary.site.description}</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-stone-600">
          {publicNavigation.map((item) => (
            <Link key={item.key} href={`/${locale}${item.href}`} className="hover:text-brand-700">
              {dictionary.navigation[item.key]}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
