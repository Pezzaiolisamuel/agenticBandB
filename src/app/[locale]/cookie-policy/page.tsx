import { LegalPage } from "@/components/legal-page";
import { buildPublicPageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/locales";

type CookiePolicyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: CookiePolicyPageProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "cookiePolicy");
}

export default async function CookiePolicyPage({ params }: CookiePolicyPageProps) {
  const { locale } = await params;

  const copy = {
    it: {
      eyebrow: "Cookie policy",
      title: "Uso dei cookie e dei consensi spiegato in modo semplice.",
      description:
        "Questa pagina descrive in modo chiaro come il sito puo` usare cookie tecnici, preferenze di lingua e consensi collegati alla navigazione e agli strumenti AI.",
      reviewNotice:
        "Placeholder legale: la cookie policy deve essere controllata da un professionista e aggiornata in base ai servizi realmente attivi sul sito.",
      sections: [
        {
          title: "Cookie tecnici e preferenze",
          body: [
            "Il sito puo` usare cookie tecnici per funzionare correttamente, ad esempio per ricordare la lingua scelta tra italiano e inglese o mantenere attive alcune funzioni essenziali.",
            "Questi cookie non dovrebbero essere usati per finalita` pubblicitarie, ma la configurazione finale deve essere verificata quando il sito sara` completo.",
          ],
        },
        {
          title: "Consenso cookie",
          body: [
            "Quando invii una prenotazione, il sito salva anche l'informazione relativa al consenso cookie dichiarato nel modulo. Questo serve a tracciare la scelta associata alla richiesta.",
            "Se verra` introdotto un banner cookie, la logica dei consensi dovra` essere aggiornata e verificata da un consulente legale o privacy.",
          ],
        },
        {
          title: "Assistente AI e strumenti di supporto",
          body: [
            "Gli strumenti AI di chat o voce possono usare dati tecnici di sessione per gestire la conversazione e restituire risposte pertinenti.",
            "L'assistente vocale e` dichiarato come sistema AI di supporto e non prevede registrazione delle chiamate. Anche questa descrizione dovra` essere confermata nella versione legale finale.",
          ],
        },
        {
          title: "Placeholder da rivedere",
          body: [
            "Placeholder referente amministrativo: inserire qui il contatto ufficiale per privacy e cookie, ad esempio cookies@example.com.",
            "Placeholder revisione professionale: inserire l'elenco definitivo dei cookie, la durata, la base giuridica e gli eventuali fornitori terzi dopo verifica legale.",
          ],
        },
      ],
    },
    en: {
      eyebrow: "Cookie policy",
      title: "A simple explanation of cookies and consent.",
      description:
        "This page describes in clear language how the site may use technical cookies, language preferences, and consent related to browsing and AI tools.",
      reviewNotice:
        "Legal placeholder: this cookie policy should be reviewed by a legal professional and updated according to the services that are actually active on the site.",
      sections: [
        {
          title: "Technical cookies and preferences",
          body: [
            "The site may use technical cookies to work correctly, for example to remember the selected language between Italian and English or to keep essential functionality active.",
            "These cookies should not be used for advertising purposes, but the final setup should be verified once the site is complete.",
          ],
        },
        {
          title: "Cookie consent",
          body: [
            "When you send a booking request, the site also stores the cookie consent information declared in the form. This helps track the choice associated with the request.",
            "If a cookie banner is introduced later, the consent logic should be updated and reviewed by a legal or privacy advisor.",
          ],
        },
        {
          title: "AI assistant and support tools",
          body: [
            "AI chat or voice tools may use technical session data to manage the conversation and provide relevant answers.",
            "The voice assistant is disclosed as an AI support system and does not include call recording. This description should also be confirmed in the final legal version.",
          ],
        },
        {
          title: "Placeholders to review",
          body: [
            "Admin contact placeholder: insert the official privacy and cookie contact here, for example cookies@example.com.",
            "Professional review placeholder: add the final cookie list, duration, legal basis, and any third-party providers after legal review.",
          ],
        },
      ],
    },
  } as const;

  const content = copy[locale];

  return (
    <LegalPage
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
      reviewNotice={content.reviewNotice}
      sections={content.sections}
    />
  );
}
