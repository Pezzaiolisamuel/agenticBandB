import {
  createSeasonalPricingRule,
  updateRoomPricing,
} from "@/app/admin/(protected)/prices/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminPricesPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

type PricingRule = {
  id: string;
  start_date: string;
  end_date: string;
  price_eur: number | string;
  min_nights: number;
};

type RoomWithPricing = {
  id: string;
  slug: string;
  name_it: string;
  name_en: string;
  included_guests: number;
  base_price_eur: number | string;
  extra_guest_price_eur: number | string;
  is_active: boolean;
  pricing_rules: PricingRule[] | null;
};

function formatPrice(value: number | string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(typeof value === "number" ? value : Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

async function getRoomsWithPricing() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("rooms")
    .select(
      `
      id,
      slug,
      name_it,
      name_en,
      included_guests,
      base_price_eur,
      extra_guest_price_eur,
      is_active,
      pricing_rules (
        id,
        start_date,
        end_date,
        price_eur,
        min_nights
      )
      `,
    )
    .order("sort_order", { ascending: true })
    .order("start_date", { foreignTable: "pricing_rules", ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as RoomWithPricing[];
}

export default async function AdminPricesPage({ searchParams }: AdminPricesPageProps) {
  const { error, success } = await searchParams;
  const rooms = await getRoomsWithPricing();

  return (
    <section className="space-y-8">
      {error ? (
        <article className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </article>
      ) : null}
      {success ? (
        <article className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {success}
        </article>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Area admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Prezzi</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Aggiorna il prezzo base delle camere, le regole per gli ospiti extra e aggiungi tariffe
          stagionali con intervalli di date validati.
        </p>
      </div>

      <div className="grid gap-6">
        {rooms.map((room) => (
          <article
            key={room.id}
            className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-3xl leading-tight text-brand-900">{room.name_it}</h2>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                      room.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-stone-100 text-stone-600"
                    }`}
                  >
                    {room.is_active ? "Attiva" : "Non attiva"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-500">{room.name_en}</p>
                <p className="mt-2 text-sm text-stone-600">Slug: {room.slug}</p>
              </div>

              <div className="rounded-[1.5rem] bg-stone-50 px-4 py-3 text-sm text-stone-700">
                Prezzo base attuale:{" "}
                <span className="font-semibold text-brand-900">{formatPrice(room.base_price_eur)}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
              <form action={updateRoomPricing} className="rounded-[1.6rem] bg-stone-50 p-4">
                <input type="hidden" name="roomId" value={room.id} />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Prezzi camera
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Prezzo base EUR</span>
                    <input
                      type="number"
                      name="base_price_eur"
                      min="0"
                      step="0.01"
                      defaultValue={String(room.base_price_eur)}
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Ospite extra EUR</span>
                    <input
                      type="number"
                      name="extra_guest_price_eur"
                      min="0"
                      step="0.01"
                      defaultValue={String(room.extra_guest_price_eur)}
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Ospiti inclusi</span>
                    <input
                      type="number"
                      name="included_guests"
                      min="1"
                      step="1"
                      defaultValue={String(room.included_guests)}
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
                >
                  Salva prezzi camera
                </button>
              </form>

              <form action={createSeasonalPricingRule} className="rounded-[1.6rem] bg-stone-50 p-4">
                <input type="hidden" name="roomId" value={room.id} />
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Aggiungi regola stagionale
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Data inizio</span>
                    <input
                      type="date"
                      name="start_date"
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Data fine</span>
                    <input
                      type="date"
                      name="end_date"
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Prezzo EUR</span>
                    <input
                      type="number"
                      name="price_eur"
                      min="0"
                      step="0.01"
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                      required
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-stone-700">Notti minime</span>
                    <input
                      type="number"
                      name="min_nights"
                      min="1"
                      step="1"
                      defaultValue="1"
                      className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                      required
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-5 inline-flex items-center justify-center rounded-full border border-brand-400 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-600 hover:bg-brand-50"
                >
                  Aggiungi regola stagionale
                </button>
              </form>
            </div>

            <div className="mt-6 rounded-[1.6rem] border border-stone-200 bg-white">
              <div className="border-b border-stone-200 px-4 py-4 sm:px-5">
                <h3 className="text-lg text-brand-900">Regole di prezzo stagionali</h3>
              </div>

              {!room.pricing_rules || room.pricing_rules.length === 0 ? (
                <div className="px-4 py-5 text-sm text-stone-600 sm:px-5">
                  Nessuna regola di prezzo stagionale e stata ancora aggiunta per questa camera.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr className="bg-stone-50 text-left">
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                          Intervallo date
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                          Prezzo
                        </th>
                        <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500 sm:px-5">
                          Notti minime
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {room.pricing_rules.map((rule) => (
                        <tr key={rule.id} className="border-t border-stone-200">
                          <td className="px-4 py-3 text-sm text-stone-700 sm:px-5">
                            {formatDate(rule.start_date)} al {formatDate(rule.end_date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-700 sm:px-5">
                            {formatPrice(rule.price_eur)}
                          </td>
                          <td className="px-4 py-3 text-sm text-stone-700 sm:px-5">
                            {rule.min_nights}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
