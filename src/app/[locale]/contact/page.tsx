import { buildPublicPageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/locales";

type ContactPageProps = {
  params: Promise<{ locale: Locale }>;
};

const fallbackMapEmbedUrl =
  "https://maps.google.com/maps?q=1%20Via%20Roma%2C%20Moncrivello%2C%20Piemonte%2C%20Italia&z=16&output=embed";

function getMapEmbedUrl() {
  const value = process.env.NEXT_PUBLIC_MAP_EMBED_URL;

  if (!value) {
    return fallbackMapEmbedUrl;
  }

  try {
    return new URL(value).toString();
  } catch {
    return fallbackMapEmbedUrl;
  }
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "contact");
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const mapEmbedUrl = getMapEmbedUrl();

  const copy = {
    it: {
      eyebrow: "Contatti",
      title: "Tutti i riferimenti utili per raggiungerci e organizzare il soggiorno.",
      description:
        "Qui trovi i contatti principali, l'indirizzo del B&B a Moncrivello e una base chiara per orari di arrivo e partenza.",
      nameLabel: "Nome struttura",
      nameValue: "CLUB66-B&B",
      locationLabel: "Indirizzo",
      locationValue: "1 Via Roma\nMoncrivello, Piemonte\nItalia",
      phoneLabel: "Telefono",
      phoneValue: "+39 000 000 0000",
      emailLabel: "Email",
      emailValue: "info@example.com",
      policyLabel: "Policy check-in / check-out",
      policyValue: "Check-in dalle 15:00 alle 20:00. Check-out entro le 10:30.",
      mapTitle: "Mappa e indicazioni",
      mapBody:
        "Trovi qui sotto la posizione del B&B in Via Roma 1, nel centro di Moncrivello, per raggiungerci con facilita` e organizzare al meglio l'arrivo.",
      mapNote: "Via Roma 1, Moncrivello, Piemonte, Italia.",
    },
    en: {
      eyebrow: "Contact",
      title: "Everything you need to reach us and plan your stay.",
      description:
        "Here you can find the main contact details, the B&B address in Moncrivello, and a clear base for arrival and departure timing.",
      nameLabel: "Property name",
      nameValue: "CLUB66-B&B",
      locationLabel: "Address",
      locationValue: "1 Via Roma\nMoncrivello, Piemonte\nItalia",
      phoneLabel: "Phone",
      phoneValue: "+39 000 000 0000",
      emailLabel: "Email",
      emailValue: "info@example.com",
      policyLabel: "Check-in / check-out policy",
      policyValue: "Check-in from 3:00 PM to 8:00 PM. Check-out by 10:30 AM.",
      mapTitle: "Map and directions",
      mapBody:
        "Below you can find the B&B location at Via Roma 1 in the center of Moncrivello, making it easy to plan your route and arrival.",
      mapNote: "Via Roma 1, Moncrivello, Piemonte, Italia.",
    },
  } as const;

  const content = copy[locale];

  return (
    <div className="bg-[linear-gradient(180deg,#faf5ed_0%,#fffdf9_30%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
          {content.eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
          {content.title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
          {content.description}
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:pb-24">
        <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <dl className="space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {content.nameLabel}
              </dt>
              <dd className="mt-2 text-2xl text-brand-900">{content.nameValue}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {content.locationLabel}
              </dt>
              <dd className="mt-2 whitespace-pre-line text-base leading-7 text-stone-700">
                {content.locationValue}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {content.phoneLabel}
              </dt>
              <dd className="mt-2 text-base leading-7 text-stone-700">{content.phoneValue}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {content.emailLabel}
              </dt>
              <dd className="mt-2 text-base leading-7 text-stone-700">{content.emailValue}</dd>
            </div>
            <div className="rounded-[1.5rem] bg-stone-50 p-4">
              <dt className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {content.policyLabel}
              </dt>
              <dd className="mt-2 text-base leading-7 text-stone-700">{content.policyValue}</dd>
            </div>
          </dl>
        </aside>

        <article className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
          <div className="border-b border-stone-200 px-5 py-5 sm:px-6">
            <h2 className="text-2xl text-brand-900">{content.mapTitle}</h2>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">{content.mapBody}</p>
          </div>
          <div className="aspect-[4/3] w-full bg-stone-100">
            <iframe
              src={mapEmbedUrl}
              title={content.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>
          <div className="px-5 py-4 text-sm text-stone-500 sm:px-6">{content.mapNote}</div>
        </article>
      </section>
    </div>
  );
}
