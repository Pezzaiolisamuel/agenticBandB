import Image from "next/image";
import Link from "next/link";
import { footerNavigation } from "@/config/navigation";
import { buildLocalizedPath, type Dictionary, type Locale } from "@/lib/locales";

type SiteFooterProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteFooter({ locale, dictionary }: SiteFooterProps) {
  return (
    <footer className="border-t border-stone-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt={dictionary.site.name}
              width={40}
              height={40}
              className="h-10 w-10 rounded-full object-cover"
            />
            <p className="text-2xl text-brand-900">{dictionary.site.name}</p>
          </div>
          <p className="mt-2 text-sm text-stone-500">{dictionary.site.description}</p>
        </div>
        <nav className="flex flex-wrap gap-4 text-sm text-stone-600">
          {footerNavigation.map((item) => (
            <Link key={item.key} href={buildLocalizedPath(locale, item.href)} className="hover:text-brand-700">
              {dictionary.navigation[item.key]}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
