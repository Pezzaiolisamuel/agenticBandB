import { HomePage } from "@/components/home-page";
import type { Locale } from "@/lib/locales";

type HomePageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function LocalizedHomePage({ params }: HomePageProps) {
  const { locale } = await params;
  return <HomePage locale={locale} />;
}
