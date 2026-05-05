import Link from "next/link";

import { HomeAssistantActions } from "@/components/home-assistant-actions";
import { buildLocalizedPath, getLocalizedWithItalianFallback, type Locale } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type HomePageProps = {
  locale: Locale;
};

type RoomPreview = {
  slug: string;
  nameIt: string;
  nameEn?: string;
  taglineIt: string;
  taglineEn?: string;
  detailsIt: string;
  detailsEn?: string;
  accentFrom: string;
  accentTo: string;
  imageSrc?: string | null;
  imageAltIt?: string | null;
  imageAltEn?: string | null;
};

const roomPreviews: RoomPreview[] = [
  {
    slug: "camera-corte",
    nameIt: "Camera Corte",
    nameEn: "Courtyard Room",
    taglineIt: "Luce del mattino e accesso diretto agli spazi esterni",
    taglineEn: "Morning light and direct access to the outdoor spaces",
    detailsIt: "Ideale per coppie che cercano un ritmo lento tra Moncrivello e il verde del Piemonte.",
    detailsEn: "Ideal for couples looking for a slow rhythm between Moncrivello and the countryside of Piemonte.",
    accentFrom: "from-brand-300",
    accentTo: "to-amber-100",
  },
  {
    slug: "suite-giardino",
    nameIt: "Suite Giardino",
    nameEn: "Garden Suite",
    taglineIt: "Spazio ampio per soggiorni rilassati con colazione inclusa",
    taglineEn: "Generous space for relaxed stays with breakfast included",
    detailsIt: "Una camera pensata per fermarsi qualche notte in piu`, con angoli morbidi e atmosfera quieta.",
    detailsEn: "Designed for longer stays, with soft corners and a calm atmosphere.",
    accentFrom: "from-emerald-200",
    accentTo: "to-brand-100",
  },
  {
    slug: "camera-piemonte",
    nameIt: "Camera Piemonte",
    nameEn: "Piemonte Room",
    taglineIt: "Palette calda, materiali naturali e vista sul borgo",
    taglineEn: "Warm palette, natural textures, and views toward the village",
    detailsIt: "Una soluzione versatile per weekend romantici o soste durante un itinerario nel territorio.",
    detailsEn: "A versatile choice for romantic weekends or a stop during a regional itinerary.",
    accentFrom: "from-rose-200",
    accentTo: "to-orange-100",
  },
  {
    slug: "family-loft",
    nameIt: "Family Loft",
    taglineIt: "Pensato per piccole famiglie o amici in viaggio",
    taglineEn: "Designed for small families or friends traveling together",
    detailsIt: "Configurazione flessibile, dettagli pratici e un tono accogliente che resta leggero.",
    detailsEn: "Flexible setup, practical details, and a welcoming atmosphere that still feels light.",
    accentFrom: "from-sky-200",
    accentTo: "to-cyan-100",
  },
];

const homeContent = {
  it: {
    eyebrow: "Moncrivello, Piemonte",
    title: "Un B&B raccolto, luminoso e semplice da prenotare.",
    description:
      "Il nostro B&B nasce per soggiorni lenti tra campagna piemontese, colazione inclusa e un'accoglienza pensata per ospiti da tutto il mondo.",
    primaryCta: "Controlla disponibilita`",
    secondaryCta: "Parla con l'assistente",
    helper: "Italiano di default, English available in one tap.",
    breakfast: "Colazione inclusa ogni mattina",
    roomEyebrow: "Anteprima camere",
    roomTitle: "Quattro atmosfere, tutte pensate per stare bene subito.",
    roomDescription:
      "Per ora usiamo placeholder visivi, ma il layout e` pronto per fotografie reali, tariffe e dettagli camera.",
    roomCta: "Vai alla pagina camere",
    bookingTitle: "Prenotazione diretta, chiara e mobile first.",
    bookingBody:
      "Controlla disponibilita`, scegli la camera giusta e invia la tua richiesta senza passaggi inutili.",
    bookingCta: "Apri area booking",
    assistantTitle: "Un assistente chat per domande rapide prima di prenotare.",
    assistantBody:
      "Perfetto per chiedere orari di check-in, consigli sulla zona o capire quale camera e` piu` adatta.",
    assistantCta: "Apri assistente",
    assistantMockUser: "Avete camere con colazione inclusa per un weekend a Moncrivello?",
    assistantMockReply:
      "Si`, la colazione e` inclusa e posso aiutarti a scegliere la camera migliore in base alle date e al numero di ospiti.",
  },
  en: {
    eyebrow: "Moncrivello, Piemonte",
    title: "A calm, light-filled B&B that is easy to book.",
    description:
      "Our B&B is designed for slower stays in the Piemonte countryside, with breakfast included and Italian hospitality tailored for guests from around the world.",
    primaryCta: "Check availability",
    secondaryCta: "Chat with the assistant",
    helper: "Italian is the default language, with English always available.",
    breakfast: "Breakfast included every morning",
    roomEyebrow: "Room preview",
    roomTitle: "Four moods, each designed to feel welcoming from the start.",
    roomDescription:
      "These are visual placeholders for now, but the layout is ready for real photography, pricing, and room details.",
    roomCta: "Explore rooms",
    bookingTitle: "Direct booking with a clear, mobile-first flow.",
    bookingBody:
      "Check dates, choose the right room, and send a request without unnecessary steps.",
    bookingCta: "Open booking area",
    assistantTitle: "A chat assistant for quick questions before you book.",
    assistantBody:
      "Ideal for check-in questions, local tips, or understanding which room fits your stay best.",
    assistantCta: "Open assistant",
    assistantMockUser: "Do you have rooms with breakfast included for a weekend in Moncrivello?",
    assistantMockReply:
      "Yes, breakfast is included, and I can help you choose the best room for your dates and guest count.",
  },
} as const;

type RoomPreviewImage = {
  storage_path: string;
  alt_it: string | null;
  alt_en: string | null;
  sort_order: number;
};

async function getRoomPreviewImages() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("room_images(storage_path, alt_it, alt_en, sort_order)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "room_images", ascending: true });

  if (error) {
    console.error("Failed to load home room preview images:", error);
    return [];
  }

  return (data ?? [])
    .map((room) => room.room_images?.[0] ?? null)
    .filter((image): image is RoomPreviewImage => Boolean(image))
    .slice(0, roomPreviews.length);
}

export async function HomePage({ locale }: HomePageProps) {
  const content = homeContent[locale] ?? homeContent.it;
  const roomPreviewImages = await getRoomPreviewImages();
  const roomCards = roomPreviews.map((room, index) => {
    const image = roomPreviewImages[index];

    return {
      ...room,
      imageSrc: image?.storage_path ?? null,
      imageAltIt: image?.alt_it ?? room.nameIt,
      imageAltEn: image?.alt_en ?? room.nameEn ?? room.nameIt,
    };
  });

  return (
    <div className="overflow-hidden bg-[linear-gradient(180deg,#f7f3ec_0%,#fcfbf7_26%,#ffffff_100%)]">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(168,130,76,0.24),_transparent_40%),radial-gradient(circle_at_top_right,_rgba(148,163,184,0.16),_transparent_35%)]" />
        <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-12 pt-10 sm:px-6 md:pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-16">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
              {content.eyebrow}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl leading-tight text-brand-900 sm:text-5xl lg:text-7xl">
              {content.title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
              {content.description}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={buildLocalizedPath(locale, "/booking")}
                className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(39,29,21,0.75)] transition hover:bg-brand-800"
              >
                {content.primaryCta}
              </Link>
              <HomeAssistantActions
                label={content.secondaryCta}
                mode="voice"
                className="inline-flex items-center justify-center rounded-full border border-brand-300 bg-white/80 px-6 py-3 text-sm font-semibold text-brand-900 backdrop-blur transition hover:border-brand-500"
              />
            </div>
            <div className="mt-5 flex flex-col gap-3 text-sm text-stone-600 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="inline-flex w-fit items-center rounded-full bg-white/85 px-3 py-1.5 shadow-sm ring-1 ring-black/5">
                {content.breakfast}
              </span>
              <span>{content.helper}</span>
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[2rem] border border-white/70 bg-white/70 p-4 shadow-[0_30px_80px_-35px_rgba(39,29,21,0.45)] backdrop-blur sm:p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {roomCards.map((room, index) => (
                  <article
                    key={room.slug}
                    className={`overflow-hidden rounded-[1.6rem] border border-stone-200/70 bg-gradient-to-br ${room.accentFrom} ${room.accentTo} p-4`}
                  >
                    <div className="relative h-32 overflow-hidden rounded-[1.1rem] bg-white/35 shadow-inner ring-1 ring-white/30 sm:h-36">
                      {room.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={room.imageSrc}
                          alt={getLocalizedWithItalianFallback(
                            locale,
                            room.imageAltIt ?? room.nameIt,
                            room.imageAltEn ?? room.nameEn,
                          )}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full bg-white/35" />
                      )}
                      <div
                        className={`absolute inset-0 ${
                          room.imageSrc
                            ? "bg-gradient-to-t from-black/45 via-black/10 to-transparent"
                            : "bg-gradient-to-t from-white/15 via-white/5 to-transparent"
                        }`}
                      />
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <p
                          className={`text-[11px] uppercase tracking-[0.22em] ${
                            room.imageSrc ? "text-white/80" : "text-brand-800/70"
                          }`}
                        >
                          0{index + 1}
                        </p>
                        <h2
                          className={`mt-2 text-2xl ${room.imageSrc ? "text-white" : "text-brand-900"}`}
                        >
                          {getLocalizedWithItalianFallback(locale, room.nameIt, room.nameEn)}
                        </h2>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-6 text-brand-900">
                      {getLocalizedWithItalianFallback(locale, room.taglineIt, room.taglineEn)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      {getLocalizedWithItalianFallback(locale, room.detailsIt, room.detailsEn)}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-stone-200 bg-white px-5 py-6 shadow-sm sm:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            {content.roomEyebrow}
          </p>
          <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="max-w-2xl text-3xl leading-tight text-brand-900 sm:text-4xl">
                {content.roomTitle}
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
                {content.roomDescription}
              </p>
            </div>
            <Link
              href={buildLocalizedPath(locale, "/rooms")}
              className="inline-flex w-fit items-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-700"
            >
              {content.roomCta}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-14 pt-4 sm:px-6 lg:grid-cols-2 lg:px-8 lg:pb-24">
        <article className="rounded-[2rem] bg-brand-900 px-6 py-7 text-white shadow-[0_26px_70px_-30px_rgba(39,29,21,0.8)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
            Booking
          </p>
          <h3 className="mt-3 text-3xl leading-tight text-white">{content.bookingTitle}</h3>
          <p className="mt-4 max-w-md text-base leading-7 text-brand-100/90">{content.bookingBody}</p>
          <Link
            href={buildLocalizedPath(locale, "/booking")}
            className="mt-6 inline-flex items-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-100"
          >
            {content.bookingCta}
          </Link>
        </article>

        <article
          id="assistant"
          className="rounded-[2rem] border border-stone-200 bg-white px-6 py-7 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
            Assistant
          </p>
          <h3 className="mt-3 text-3xl leading-tight text-brand-900">{content.assistantTitle}</h3>
          <p className="mt-4 max-w-md text-base leading-7 text-stone-600">{content.assistantBody}</p>
          <div className="mt-6 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-4">
            <div className="ml-auto max-w-[85%] rounded-[1.3rem] rounded-br-md bg-brand-700 px-4 py-3 text-sm leading-6 text-white">
              {content.assistantMockUser}
            </div>
            <div className="mt-3 max-w-[90%] rounded-[1.3rem] rounded-bl-md bg-white px-4 py-3 text-sm leading-6 text-stone-700 shadow-sm ring-1 ring-stone-200">
              {content.assistantMockReply}
            </div>
          </div>
          <HomeAssistantActions
            label={content.assistantCta}
            mode="chat"
            className="mt-6 inline-flex items-center rounded-full border border-brand-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500 hover:text-brand-700"
          />
        </article>
      </section>
    </div>
  );
}
