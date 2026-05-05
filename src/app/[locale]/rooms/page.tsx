import Link from "next/link";

import { buildPublicPageMetadata } from "@/lib/metadata";
import {
  getDictionary,
  getLocalizedWithItalianFallback,
  type Locale,
} from "@/lib/locales";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type RoomsPageProps = {
  params: Promise<{ locale: Locale }>;
};

type RoomImageRecord = {
  storage_path: string;
  alt_it: string;
  alt_en: string;
  sort_order: number;
};

type RoomRecord = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  description_it: string;
  description_en: string;
  max_guests: number;
  included_guests: number;
  base_price_eur: number | string;
  extra_guest_price_eur: number | string;
  room_images: RoomImageRecord[] | null;
};

const mockImageGradients = [
  "from-brand-200 via-brand-100 to-amber-50",
  "from-emerald-100 via-teal-50 to-brand-50",
  "from-rose-100 via-orange-50 to-stone-50",
  "from-sky-100 via-cyan-50 to-stone-50",
] as const;

function parsePrice(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatPrice(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function getRooms() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      "id, slug, name_it, name_en, description_it, description_en, max_guests, included_guests, base_price_eur, extra_guest_price_eur, room_images(storage_path, alt_it, alt_en, sort_order)",
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("sort_order", { foreignTable: "room_images", ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as RoomRecord[];
}

export async function generateMetadata({ params }: RoomsPageProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "rooms");
}

export default async function RoomsPage({ params }: RoomsPageProps) {
  const { locale } = await params;
  const dictionary = getDictionary(locale);
  const rooms = await getRooms();

  const copy = {
    it: {
      eyebrow: "Camere",
      title: "Scegli la stanza che meglio accompagna il tuo soggiorno a Moncrivello, Piemonte.",
      description:
        "Ogni camera unisce comfort essenziale, colazione inclusa e un ritmo pensato per soggiorni rilassati tra borgo e campagna.",
      guestsLabel: "Ospiti",
      basePriceLabel: "Prezzo base",
      extraGuestLabel: "Ospite extra",
      extraGuestIncluded: "Inclusi fino a",
      extraGuestRule: "poi +{price} per ospite a notte",
      breakfastLabel: "Colazione inclusa",
      bookCta: "Prenota questa camera",
      emptyTitle: "Le camere arriveranno presto.",
      emptyBody:
        "La struttura della pagina e` pronta. Non appena i dati saranno caricati in Supabase, appariranno qui.",
      mockBadge: "Mock image",
    },
    en: {
      eyebrow: "Rooms",
      title: "Choose the room that best fits your stay in Moncrivello, Piemonte.",
      description:
        "Each room combines essential comfort, breakfast included, and a pace designed for calm stays between village life and countryside.",
      guestsLabel: "Guests",
      basePriceLabel: "Base price",
      extraGuestLabel: "Extra guest",
      extraGuestIncluded: "Included up to",
      extraGuestRule: "then +{price} per guest per night",
      breakfastLabel: "Breakfast included",
      bookCta: "Book this room",
      emptyTitle: "Rooms will appear here soon.",
      emptyBody:
        "The page structure is ready. As soon as room data is added to Supabase, it will show up here.",
      mockBadge: "Mock image",
    },
  } as const;

  const content = copy[locale];

  return (
    <div className="bg-[linear-gradient(180deg,#fbf8f2_0%,#ffffff_28%,#ffffff_100%)]">
      <section className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-10 lg:pt-14">
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

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-24">
        {rooms.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center shadow-sm">
            <h2 className="text-2xl text-brand-900">{content.emptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-stone-600">
              {content.emptyBody}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:gap-8">
            {rooms.map((room, index) => {
              const image = room.room_images?.[0] ?? null;
              const imageAlt = image
                ? getLocalizedWithItalianFallback(locale, image.alt_it, image.alt_en)
                : getLocalizedWithItalianFallback(locale, room.name_it, room.name_en);
              const roomName = getLocalizedWithItalianFallback(locale, room.name_it, room.name_en);
              const roomDescription = getLocalizedWithItalianFallback(
                locale,
                room.description_it,
                room.description_en,
              );
              const basePrice = formatPrice(locale, parsePrice(room.base_price_eur));
              const extraGuestPrice = formatPrice(locale, parsePrice(room.extra_guest_price_eur));
              const extraGuestRule = `${content.extraGuestIncluded} ${room.included_guests} ${content.extraGuestRule.replace("{price}", extraGuestPrice)}`;

              return (
                <article
                  key={room.id}
                  className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_22px_60px_-35px_rgba(39,29,21,0.35)]"
                >
                  <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="relative min-h-72">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={image.storage_path}
                          alt={imageAlt}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          className={`flex h-full min-h-72 flex-col justify-between bg-gradient-to-br p-5 ${mockImageGradients[index % mockImageGradients.length]}`}
                        >
                          <span className="w-fit rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-800 shadow-sm">
                            {content.mockBadge}
                          </span>
                          <div className="rounded-[1.5rem] bg-white/45 p-5 backdrop-blur-sm">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-800/70">
                              {dictionary.site.name}
                            </p>
                            <p className="mt-3 text-3xl leading-tight text-brand-900">{roomName}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="px-5 py-6 sm:px-6 sm:py-7 lg:px-8">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                          {content.breakfastLabel}
                        </span>
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-600">
                          {content.guestsLabel}: {room.max_guests}
                        </span>
                      </div>

                      <h2 className="mt-4 text-3xl leading-tight text-brand-900 sm:text-4xl">
                        {roomName}
                      </h2>
                      <p className="mt-4 text-base leading-7 text-stone-600">{roomDescription}</p>

                      <dl className="mt-6 grid gap-4 rounded-[1.5rem] bg-stone-50 p-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {content.basePriceLabel}
                          </dt>
                          <dd className="mt-2 text-2xl text-brand-900">{basePrice}</dd>
                        </div>
                        <div>
                          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {content.extraGuestLabel}
                          </dt>
                          <dd className="mt-2 text-sm leading-6 text-stone-700">{extraGuestRule}</dd>
                        </div>
                      </dl>

                      <Link
                        href={`/${locale}/booking?roomId=${room.id}`}
                        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                      >
                        {content.bookCta}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
