import { LegalPage } from "@/components/legal-page";
import { buildPublicPageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/locales";

type PrivacyPageProps = {
  params: Promise<{ locale: Locale }>;
};

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "privacy");
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;

  const copy = {
    it: {
      eyebrow: "Privacy",
      title: "Informativa privacy semplice, chiara e aggiornata in seguito.",
      description:
        "Questa pagina spiega in modo accessibile quali dati raccogliamo quando riceviamo prenotazioni, richieste di contatto e interazioni con gli strumenti AI del sito.",
      reviewNotice:
        "Placeholder legale: questa informativa deve essere verificata e completata da un professionista prima della pubblicazione definitiva.",
      sections: [
        {
          title: "Quali dati raccogliamo",
          body: [
            "Quando invii una richiesta di prenotazione possiamo raccogliere nome, email, telefono, numero di ospiti, date di soggiorno, note e consensi collegati alla privacy e ai cookie.",
            "Quando ci contatti direttamente possiamo raccogliere i dati necessari per rispondere alla richiesta, come nome, email, telefono e contenuto del messaggio.",
          ],
        },
        {
          title: "Perche` usiamo questi dati",
          body: [
            "Usiamo i dati di prenotazione per verificare disponibilita`, confermare o gestire la richiesta, contattarti in caso di aggiornamenti e organizzare il soggiorno.",
            "Usiamo i dati di contatto per rispondere alle domande inviate dal sito o attraverso i canali indicati nella pagina contatti.",
          ],
        },
        {
          title: "Assistente AI chat e voce",
          body: [
            "Il sito puo` includere un assistente AI in chat e un assistente AI vocale per aiutarti con domande su camere, disponibilita`, servizi e informazioni generali.",
            "Le informazioni condivise con questi strumenti possono essere trattate per generare risposte e per migliorare la gestione delle richieste. Evita di inserire dati sensibili non necessari.",
            "Disclosure importante: l'assistente vocale usa elaborazione AI per rispondere in tempo reale, ma non e` previsto alcun sistema di registrazione delle chiamate.",
          ],
        },
        {
          title: "Conservazione, accesso e referente",
          body: [
            "I dati devono essere conservati solo per il tempo necessario alla gestione del soggiorno, delle richieste amministrative e degli eventuali obblighi di legge. La durata esatta deve essere definita con supporto legale.",
            "Placeholder referente amministrativo: inserire qui nome o ragione sociale, indirizzo completo e email del responsabile privacy, ad esempio privacy@example.com.",
          ],
        },
      ],
    },
    en: {
      eyebrow: "Privacy",
      title: "A simple privacy notice that can be refined later.",
      description:
        "This page explains in accessible language which data we collect when we receive bookings, contact requests, and interactions with the AI tools on the site.",
      reviewNotice:
        "Legal placeholder: this notice should be reviewed and completed by a legal professional before final publication.",
      sections: [
        {
          title: "Which data we collect",
          body: [
            "When you send a booking request, we may collect your name, email, phone number, guest count, stay dates, notes, and the consents related to privacy and cookies.",
            "When you contact us directly, we may collect the details needed to reply to your request, such as your name, email, phone number, and message content.",
          ],
        },
        {
          title: "Why we use this data",
          body: [
            "We use booking data to check availability, confirm or manage the request, contact you about updates, and prepare the stay.",
            "We use contact data to answer questions sent through the site or through the contact channels shown on the website.",
          ],
        },
        {
          title: "AI chat and voice assistant",
          body: [
            "The site may include an AI chat assistant and an AI voice assistant to help with questions about rooms, availability, services, and general property information.",
            "Information shared with these tools may be processed to generate answers and to improve how requests are handled. Please avoid entering unnecessary sensitive data.",
            "Important disclosure: the voice assistant uses AI processing to respond in real time, but there is no call recording system in place.",
          ],
        },
        {
          title: "Retention, access, and admin contact",
          body: [
            "Data should only be kept for the time needed to manage the stay, administrative requests, and any legal obligations. The exact retention periods should be defined with legal support.",
            "Admin contact placeholder: insert here the legal entity name, full address, and privacy contact email, for example privacy@example.com.",
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
