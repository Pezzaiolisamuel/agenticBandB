import Image from "next/image";
import Link from "next/link";
import { publicNavigation } from "@/config/navigation";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { buildLocalizedPath, type Dictionary, type Locale } from "@/lib/locales";

type SiteHeaderProps = {
  locale: Locale;
  dictionary: Dictionary;
};

export function SiteHeader({ locale, dictionary }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-stone-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link href={buildLocalizedPath(locale)} className="flex items-center gap-3 text-3xl text-brand-900">
            <Image
              src="/logo.png"
              alt={dictionary.site.name}
              width={52}
              height={52}
              className="h-[3.25rem] w-[3.25rem] rounded-full object-cover"
            />
            <span>{dictionary.site.name}</span>
          </Link>
          <p className="text-sm text-stone-500">{dictionary.site.tagline}</p>
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <nav className="flex flex-wrap gap-4 text-sm font-semibold text-stone-700">
            {publicNavigation.map((item) => (
              <Link key={item.key} href={buildLocalizedPath(locale, item.href)} className="hover:text-brand-700">
                {dictionary.navigation[item.key]}
              </Link>
            ))}
          </nav>
          <LocaleSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
