import { buildPublicPageMetadata } from "@/lib/metadata";
import {
  getLocalizedWithItalianFallback,
  type Locale,
} from "@/lib/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AboutPageProps = {
  params: Promise<{ locale: Locale }>;
};

type SiteContentRecord = {
  value_it: string;
  value_en: string;
};

const fallbackAboutContent = {
  it:
    "Benvenuti nel nostro B&B con ristorante nel cuore di Moncrivello, in Piemonte. Qui accogliamo ogni ospite con uno stile semplice, caldo e autentico, tra stanze curate, colazione inclusa e il ritmo quieto del paese.\n\nIl nostro desiderio e` offrire un soggiorno che faccia sentire subito a proprio agio: una base rilassata per scoprire il territorio, fermarsi per una cena speciale o vivere qualche giorno di pausa con attenzione e gentilezza.\n\nMoncrivello e il Piemonte che ci circonda raccontano paesaggi, sapori e piccoli gesti quotidiani. Il nostro B&B nasce proprio da qui: dall'idea di condividere ospitalita`, ristorante e atmosfera in un unico luogo raccolto.",
  en:
    "Welcome to our B&B with restaurant in the heart of Moncrivello, Piedmont. We welcome every guest with a warm, simple, and genuine style, offering carefully prepared rooms, breakfast included, and the quiet rhythm of the village.\n\nOur goal is to create a stay that feels comfortable from the first moment: a relaxed base for discovering the area, enjoying a special dinner, or spending a few restful days with thoughtful hospitality.\n\nMoncrivello and the surrounding Piedmont region are shaped by landscapes, flavors, and small daily rituals. Our B&B grows from that spirit, bringing hospitality, restaurant, and atmosphere together in one intimate place.",
};

async function getAboutContent() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("value_it, value_en")
    .eq("key", "about_us")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as SiteContentRecord | null) ?? null;
}

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "about");
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const aboutContent = await getAboutContent();
  const body = getLocalizedWithItalianFallback(
    locale,
    aboutContent?.value_it ?? fallbackAboutContent.it,
    aboutContent?.value_en ?? fallbackAboutContent.en,
  );

  const copy = {
    it: {
      eyebrow: "Chi siamo",
      title: "Un luogo raccolto dove ospitalita` e ristorante si incontrano con naturalezza.",
      intro:
        "Nel cuore di Moncrivello, il nostro B&B accoglie chi cerca un soggiorno semplice, curato e profondamente legato al territorio piemontese.",
      highlights: [
        "Moncrivello, Piemonte",
        "Colazione inclusa",
        "B&B con ristorante",
      ],
      membershipTitle: "Informazione CLUB66",
      membershipBody:
        "Il bar CLUB66 e` un circolo ricreativo ARCI con accesso limitato ai membri. Una tessera di iscrizione puo` essere richiesta all interno del bar.",
    },
    en: {
      eyebrow: "About us",
      title: "An intimate place where hospitality and restaurant dining meet naturally.",
      intro:
        "In the heart of Moncrivello, our B&B welcomes guests looking for a simple, thoughtful stay connected to the Piedmont landscape.",
      highlights: [
        "Moncrivello, Piedmont",
        "Breakfast included",
        "B&B with restaurant",
      ],
      membershipTitle: "CLUB66 membership information",
      membershipBody:
        "The restaurant CLUB66 is an ARCI recreational club with access limited to members. Membership card inside the bar.",
    },
  } as const;

  const content = copy[locale];
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <div className="bg-[linear-gradient(180deg,#faf5ed_0%,#fffdf9_32%,#ffffff_100%)]">
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top_left,_rgba(168,130,76,0.2),_transparent_38%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_34%)]" />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
            {content.eyebrow}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
            {content.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
            {content.intro}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {content.highlights.map((item) => (
              <span
                key={item}
                className="rounded-full bg-white/85 px-3 py-1.5 text-sm font-semibold text-brand-800 shadow-sm ring-1 ring-black/5"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-brand-900 p-6 text-white shadow-[0_26px_70px_-30px_rgba(39,29,21,0.8)] sm:p-8">
            <div className="rounded-[1.7rem] border border-white/15 bg-white/5 p-6">
              <p className="text-sm uppercase tracking-[0.26em] text-brand-200">
                Moncrivello
              </p>
              <p className="mt-4 text-3xl leading-tight text-white sm:text-4xl">
                Piemonte, ospitalita` sincera e un ristorante pensato per far rallentare.
              </p>
            </div>
          </div>

          <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="prose prose-stone max-w-none">
              {paragraphs.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base leading-8 text-stone-700 first:mt-0 [&:not(:first-child)]:mt-5"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </article>
        </div>

        <div className="mt-6 rounded-[2rem] border border-stone-200 bg-stone-50 p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            {content.membershipTitle}
          </p>
          <p className="mt-3 max-w-4xl text-base leading-7 text-stone-700">
            {content.membershipBody}
          </p>
        </div>
      </section>
    </div>
  );
}
