import { ChatWidget } from "@/components/chat-widget";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { VoiceAssistant } from "@/components/voice/VoiceAssistant";
import { getDictionary, type Locale } from "@/lib/locales";

type PublicSiteShellProps = {
  children: React.ReactNode;
  locale: Locale;
};

export function PublicSiteShell({ children, locale }: PublicSiteShellProps) {
  const dictionary = getDictionary(locale);

  return (
    <>
      <SiteHeader locale={locale} dictionary={dictionary} />
      <main>{children}</main>
      <SiteFooter locale={locale} dictionary={dictionary} />
      <VoiceAssistant locale={locale} />
      <ChatWidget locale={locale} />
    </>
  );
}
