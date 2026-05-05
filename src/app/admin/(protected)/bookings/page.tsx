import Link from "next/link";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>;
};

type BookingStatus =
  | "pending_admin_confirmation"
  | "confirmed"
  | "cancelled"
  | "completed";

type BookingRow = {
  id: string;
  booking_code: string;
  source: "website" | "phone" | "admin";
  guest_full_name: string;
  guest_email: string;
  check_in_date: string;
  check_out_date: string;
  price_total_eur: number | string;
  status: BookingStatus;
  rooms: {
    name_it: string;
    name_en: string;
  }[] | null;
};

const statusOptions: Array<{ label: string; value: BookingStatus }> = [
  { label: "In attesa", value: "pending_admin_confirmation" },
  { label: "Confermata", value: "confirmed" },
  { label: "Annullata", value: "cancelled" },
  { label: "Completata", value: "completed" },
];

function parsePrice(value: number | string) {
  return typeof value === "number" ? value : Number(value);
}

function formatPrice(value: number | string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(parsePrice(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatStatus(status: BookingStatus) {
  switch (status) {
    case "pending_admin_confirmation":
      return "In attesa di conferma admin";
    case "confirmed":
      return "Confermata";
    case "cancelled":
      return "Annullata";
    case "completed":
      return "Completata";
  }
}

function isBookingStatus(value: string | undefined): value is BookingStatus {
  return statusOptions.some((option) => option.value === value);
}

async function getBookings(filters: {
  dateFrom?: string;
  dateTo?: string;
  status?: BookingStatus;
}) {
  const supabase = createSupabaseAdminClient();

  let query = supabase
    .from("bookings")
    .select(
      `
      id,
      booking_code,
      source,
      guest_full_name,
      guest_email,
      check_in_date,
      check_out_date,
      price_total_eur,
      status,
      rooms (
        name_it,
        name_en
      )
      `,
    )
    // Intentionally query all booking sources and all statuses unless an explicit status filter is applied.
    .order("check_in_date", { ascending: true });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte("check_in_date", filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte("check_out_date", filters.dateTo);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as BookingRow[];
}

function getRoomName(room: BookingRow["rooms"]) {
  const firstRoom = room?.[0];

  if (!firstRoom) {
    return "Camera sconosciuta";
  }

  return firstRoom.name_it || firstRoom.name_en;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  const { dateFrom, dateTo, status } = await searchParams;
  const selectedStatus = isBookingStatus(status) ? status : undefined;

  const bookings = await getBookings({
    dateFrom,
    dateTo,
    status: selectedStatus,
  });

  return (
    <section className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Area admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Prenotazioni</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Controlla le prenotazioni, filtra elenco per stato o date del soggiorno e apri ogni
          scheda per vedere piu dettagli.
        </p>
      </div>

      <form className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Stato</span>
            <select
              name="status"
              defaultValue={selectedStatus ?? ""}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
            >
              <option value="">Tutti gli stati</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Data dal</span>
            <input
              type="date"
              name="dateFrom"
              defaultValue={dateFrom ?? ""}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Data al</span>
            <input
              type="date"
              name="dateTo"
              defaultValue={dateTo ?? ""}
              className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
            />
          </label>

          <div className="flex items-end gap-3">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Applica filtri
            </button>
            <Link
              href="/admin/bookings"
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500"
            >
              Reimposta
            </Link>
          </div>
        </div>
      </form>

      <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="border-b border-stone-200 px-5 py-4 sm:px-6">
          <p className="text-sm text-stone-600">
            Visualizzazione di <span className="font-semibold text-brand-900">{bookings.length}</span>{" "}
            prenotazion{bookings.length === 1 ? "e" : "i"}.
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="text-lg text-brand-900">Nessuna prenotazione corrisponde ai filtri attuali.</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Prova ad ampliare il periodo di date o a rimuovere il filtro sullo stato.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-stone-50 text-left">
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Codice prenotazione
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Ospite
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Camera
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Date
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Prezzo
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Stato
                  </th>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-stone-500 sm:px-6">
                    Dettaglio
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id} className="border-t border-stone-200">
                    <td className="px-5 py-4 text-sm font-semibold text-brand-900 sm:px-6">
                      {booking.booking_code}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700 sm:px-6">
                      <p>{booking.guest_full_name}</p>
                      <p className="mt-1 text-xs text-stone-500">{booking.guest_email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700 sm:px-6">
                      {getRoomName(booking.rooms)}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700 sm:px-6">
                      {formatDate(booking.check_in_date)} al {formatDate(booking.check_out_date)}
                    </td>
                    <td className="px-5 py-4 text-sm text-stone-700 sm:px-6">
                      {formatPrice(booking.price_total_eur)}
                    </td>
                    <td className="px-5 py-4 text-sm sm:px-6">
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-stone-700">
                        {formatStatus(booking.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm sm:px-6">
                      <Link
                        href={`/admin/bookings/${booking.id}`}
                        className="font-semibold text-brand-700 hover:text-brand-900"
                      >
                        Vedi dettagli
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
