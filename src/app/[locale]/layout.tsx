import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { getDictionary, isSupportedLocale, type Locale } from "@/lib/locales";

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return [{ locale: "it" }, { locale: "en" }];
}

export async function generateMetadata({
  params
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    return {};
  }

  const dictionary = getDictionary(locale);

  return {
    title: dictionary.site.name,
    description: dictionary.site.description
  };
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const currentLocale = locale as Locale;
  const dictionary = getDictionary(currentLocale);

  return (
    <>
      <SiteHeader locale={currentLocale} dictionary={dictionary} />
      <main>{children}</main>
      <SiteFooter locale={currentLocale} dictionary={dictionary} />
      <VoiceAssistant locale={currentLocale} />
      <ChatWidget locale={currentLocale} />
    </>
  );
}
