import Link from "next/link";
import { notFound } from "next/navigation";

import {
  addAdminNote,
  cancelBooking,
  confirmPendingBooking,
  markBookingCheckedIn,
  markBookingCheckedOut,
} from "@/app/admin/(protected)/bookings/[bookingId]/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingDetailPageProps = {
  params: Promise<{ bookingId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
};

type BookingDetail = {
  id: string;
  booking_code: string;
  guest_full_name: string;
  guest_email: string;
  guest_phone: string | null;
  language: string;
  guests_count: number;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  price_total_eur: number | string;
  status: string;
  notes: string | null;
  source: string;
  auto_confirmed: boolean;
  consent_cookies: boolean;
  consent_privacy: boolean;
  cancellation_policy_snapshot_it: string;
  cancellation_policy_snapshot_en: string;
  created_at: string;
  updated_at: string;
  rooms: {
    id: string;
    slug: string;
    name_it: string;
    name_en: string;
  }[] | null;
};

type AuditLogEntry = {
  id: string;
  assistant_message: string | null;
  created_at: string;
  tool_name: string | null;
  user_message: string | null;
};

type BookingEventEntry = {
  id: string;
  event_type: string;
  note: string | null;
  created_at: string;
};

function formatPrice(value: number | string) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(typeof value === "number" ? value : Number(value));
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function getBooking(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      rooms (
        id,
        slug,
        name_it,
        name_en
      )
      `,
    )
    .eq("id", bookingId)
    .maybeSingle();

  return {
    booking: (data as BookingDetail | null) ?? null,
    error,
  };
}

async function getAuditLog(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("agent_logs")
    .select("id, assistant_message, created_at, tool_name, user_message")
    .eq("session_id", bookingId)
    .order("created_at", { ascending: false });

  return {
    entries: (data ?? []) as AuditLogEntry[],
    error,
  };
}

async function getBookingEvents(bookingId: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("booking_events")
    .select("id, event_type, note, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: false });

  return {
    entries: (data ?? []) as BookingEventEntry[],
    error,
  };
}

function getRoomName(rooms: BookingDetail["rooms"]) {
  const room = rooms?.[0];

  if (!room) {
    return "Camera sconosciuta";
  }

  return room.name_it || room.name_en;
}

function formatStatus(status: string) {
  switch (status) {
    case "pending_admin_confirmation":
      return "In attesa di conferma admin";
    case "confirmed":
      return "Confermata";
    case "cancelled":
      return "Annullata";
    case "completed":
      return "Completata";
    default:
      return status;
  }
}

function getStatusBadgeClasses(status: string) {
  switch (status) {
    case "confirmed":
      return "bg-emerald-100 text-emerald-800";
    case "pending_admin_confirmation":
      return "bg-amber-100 text-amber-800";
    case "cancelled":
      return "bg-rose-100 text-rose-800";
    case "completed":
      return "bg-sky-100 text-sky-800";
    default:
      return "bg-stone-200 text-stone-700";
  }
}

function formatSource(source: string) {
  switch (source) {
    case "website":
      return "Sito web";
    case "phone":
      return "Telefono";
    case "admin":
      return "Admin";
    default:
      return source;
  }
}

function formatLanguage(language: string) {
  switch (language) {
    case "it":
      return "Italiano";
    case "en":
      return "Inglese";
    default:
      return language;
  }
}

function formatEventType(eventType: string | null | undefined) {
  if (!eventType) {
    return "Evento di audit";
  }

  switch (eventType) {
    case "admin_confirmed_booking":
      return "Prenotazione confermata da admin";
    case "admin_cancelled_booking":
      return "Prenotazione annullata da admin";
    case "admin_note_added":
      return "Nota admin aggiunta";
    default:
      return eventType;
  }
}

function formatBookingEventType(eventType: string) {
  switch (eventType) {
    case "checked_in":
      return "Check-in registrato";
    case "checked_out":
      return "Check-out registrato";
    default:
      return eventType;
  }
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: BookingDetailPageProps) {
  const { bookingId } = await params;
  const { error: actionError, success } = await searchParams;
  const [
    { booking, error: bookingError },
    { entries, error: auditError },
    { entries: bookingEvents, error: bookingEventsError },
  ] = await Promise.all([
    getBooking(bookingId),
    getAuditLog(bookingId),
    getBookingEvents(bookingId),
  ]);

  if (bookingError) {
    return (
      <section className="space-y-6">
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500"
        >
          Torna alle prenotazioni
        </Link>
        <article className="rounded-[1.8rem] border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-2xl text-rose-900">Impossibile caricare i dettagli della prenotazione</h1>
          <p className="mt-3 text-sm leading-6 text-rose-800">
            Si e verificato un problema durante il caricamento della prenotazione. Riprova tra poco
            oppure controlla i log server se il problema continua.
          </p>
        </article>
      </section>
    );
  }

  if (!booking) {
    notFound();
  }

  const fields = [
    { label: "Codice prenotazione", value: booking.booking_code },
    { label: "ID prenotazione", value: booking.id },
    { label: "Origine", value: formatSource(booking.source) },
    { label: "Conferma automatica", value: booking.auto_confirmed ? "Si" : "No" },
    { label: "Nome completo ospite", value: booking.guest_full_name },
    { label: "Email ospite", value: booking.guest_email },
    { label: "Telefono ospite", value: booking.guest_phone || "Non fornito" },
    { label: "Lingua", value: formatLanguage(booking.language) },
    { label: "Camera", value: getRoomName(booking.rooms) },
    { label: "Numero ospiti", value: String(booking.guests_count) },
    { label: "Data check-in", value: formatDate(booking.check_in_date) },
    { label: "Data check-out", value: formatDate(booking.check_out_date) },
    { label: "Notti", value: String(booking.nights) },
    { label: "Prezzo totale", value: formatPrice(booking.price_total_eur) },
    { label: "Consenso privacy", value: booking.consent_privacy ? "Si" : "No" },
    { label: "Consenso cookie", value: booking.consent_cookies ? "Si" : "No" },
    { label: "Prenotazione creata il", value: formatDateTime(booking.created_at) },
    { label: "Aggiornata il", value: formatDateTime(booking.updated_at) },
  ];

  const canConfirm = booking.status === "pending_admin_confirmation";
  const canCancel = booking.status !== "cancelled";
  const hasCheckedIn = bookingEvents.some((entry) => entry.event_type === "checked_in");
  const hasCheckedOut = bookingEvents.some((entry) => entry.event_type === "checked_out");
  const canCheckIn = booking.status !== "cancelled" && !hasCheckedIn;
  const canCheckOut = hasCheckedIn && !hasCheckedOut && booking.status !== "cancelled";

  return (
    <section className="space-y-8">
      {actionError ? (
        <article className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {actionError}
        </article>
      ) : null}
      {success ? (
        <article className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {success}
        </article>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
            Dettaglio prenotazione
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl leading-tight text-brand-900">{booking.booking_code}</h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${getStatusBadgeClasses(
                booking.status,
              )}`}
            >
              {formatStatus(booking.status)}
            </span>
          </div>
        </div>
        <Link
          href="/admin/bookings"
          className="inline-flex w-fit items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500"
        >
          Torna alle prenotazioni
        </Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <article
                key={field.label}
                className="rounded-[1.6rem] border border-stone-200 bg-white p-5 shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  {field.label}
                </p>
                <p className="mt-3 text-lg text-brand-900">{field.value}</p>
              </article>
            ))}
          </div>

          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Note ospite
            </p>
            <p className="mt-3 text-base leading-7 text-stone-700">
              {booking.notes || "Nessuna nota fornita per questa prenotazione."}
            </p>
          </article>

          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Snapshot della policy di cancellazione
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.4rem] bg-stone-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Italiano
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">
                  {booking.cancellation_policy_snapshot_it}
                </p>
              </div>
              <div className="rounded-[1.4rem] bg-stone-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
                  Inglese
                </p>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-stone-700">
                  {booking.cancellation_policy_snapshot_en}
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Azioni admin
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <form action={confirmPendingBooking}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  disabled={!canConfirm}
                  className="inline-flex w-full items-center justify-center rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Conferma prenotazione in attesa
                </button>
              </form>

              <form action={markBookingCheckedIn}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  disabled={!canCheckIn}
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Registra check-in
                </button>
              </form>

              <form action={markBookingCheckedOut}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  disabled={!canCheckOut}
                  className="inline-flex w-full items-center justify-center rounded-full bg-violet-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Registra check-out
                </button>
              </form>

              <form action={cancelBooking}>
                <input type="hidden" name="bookingId" value={booking.id} />
                <button
                  type="submit"
                  disabled={!canCancel}
                  className="inline-flex w-full items-center justify-center rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Annulla prenotazione
                </button>
              </form>
            </div>
          </article>

          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Aggiungi nota admin
            </p>
            <form action={addAdminNote} className="mt-4 space-y-4">
              <input type="hidden" name="bookingId" value={booking.id} />
              <textarea
                name="note"
                className="min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                placeholder="Scrivi una nota privata per il registro di audit..."
                required
              />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
              >
                Salva nota admin
              </button>
            </form>
          </article>

          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Storico check-in / check-out
            </p>
            {bookingEventsError ? (
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Lo storico operativo non e disponibile in questo momento.
              </p>
            ) : bookingEvents.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Nessun evento operativo registrato per questa prenotazione.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {bookingEvents.map((event) => (
                  <article key={event.id} className="rounded-[1.4rem] bg-stone-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-brand-900">
                        {formatBookingEventType(event.event_type)}
                      </p>
                      <p className="text-xs text-stone-500">{formatDateTime(event.created_at)}</p>
                    </div>
                    {event.note ? (
                      <p className="mt-3 text-sm leading-6 text-stone-700">{event.note}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </article>

          <article className="rounded-[1.8rem] border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">
              Registro di audit
            </p>
            {auditError ? (
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Il registro di audit non e disponibile in questo momento. La prenotazione e stata
                caricata correttamente, ma il log non puo essere mostrato adesso.
              </p>
            ) : entries.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-stone-600">
                Nessuna voce di audit registrata per questa prenotazione.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {entries.map((event) => (
                  <article key={event.id} className="rounded-[1.4rem] bg-stone-50 p-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-brand-900">
                        {formatEventType(event.tool_name)}
                      </p>
                      <p className="text-xs text-stone-500">{formatDateTime(event.created_at)}</p>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-stone-500">
                      Attivita admin
                    </p>
                    {event.assistant_message ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">
                        {event.assistant_message}
                      </p>
                    ) : null}
                    {event.user_message ? (
                      <p className="mt-3 whitespace-pre-line text-sm leading-6 text-stone-700">
                        {event.user_message}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </section>
  );
}
