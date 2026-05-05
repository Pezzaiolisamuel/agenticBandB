"use client";

import { useMemo, useState } from "react";

import type { Locale } from "@/lib/locales";

type BookingPageProps = {
  initialRoomId?: string;
  locale: Locale;
};

type AvailabilityRoom = {
  roomId: string;
  slug: string;
  name: string;
  maxGuests: number;
  available: boolean;
  totalPriceEur: number | null;
  reason: string | null;
};

type AvailabilityResponse = {
  rooms: AvailabilityRoom[];
  availableRoomsCount: number;
  totalRoomsCount: number;
};

type BookingSuccessResponse = {
  bookingCode: string;
  bookingId: string;
  nights: number;
  roomId: string;
  status: "confirmed" | "pending_admin_confirmation";
  autoConfirmed: boolean;
  totalPriceEur: number;
};

type BookingFormState = {
  checkIn: string;
  checkOut: string;
  guestsCount: string;
  roomId: string;
  website: string;
  formStartedAt: string;
  guestFullName: string;
  guestEmail: string;
  guestPhone: string;
  notes: string;
  consentPrivacy: boolean;
  consentCookies: boolean;
};

const initialFormState: BookingFormState = {
  checkIn: "",
  checkOut: "",
  guestsCount: "2",
  roomId: "",
  website: "",
  formStartedAt: "",
  guestFullName: "",
  guestEmail: "",
  guestPhone: "",
  notes: "",
  consentPrivacy: false,
  consentCookies: false,
};

function formatPrice(locale: Locale, value: number) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getReasonLabel(locale: Locale, reason: string | null) {
  if (reason === "overlapping_booking") {
    return locale === "it"
      ? "Gia` occupata nelle date selezionate"
      : "Already booked for the selected dates";
  }

  if (reason) {
    return reason;
  }

  return locale === "it" ? "Non disponibile" : "Unavailable";
}

export function BookingPage({ initialRoomId, locale }: BookingPageProps) {
  const copy = {
    it: {
      eyebrow: "Prenotazione",
      title: "Controlla disponibilita` e invia la tua richiesta in pochi passaggi.",
      description:
        "Scegli date e numero di ospiti, verifica quali camere sono libere e completa la richiesta direttamente online.",
      stayTitle: "1. Soggiorno",
      stayBody: "Inserisci date e ospiti per vedere solo le camere disponibili.",
      checkAvailability: "Controlla disponibilita`",
      checkingAvailability: "Controllo in corso...",
      stayError: "Inserisci check-in, check-out e numero ospiti validi.",
      availabilityTitle: "2. Scegli la camera",
      availableLabel: "Disponibile",
      unavailableLabel: "Non disponibile",
      noRooms:
        "Nessuna camera disponibile per queste date. Prova a cambiare periodo o numero di ospiti.",
      guestDetailsTitle: "3. Dati ospite",
      privacyLabel: "Accetto l'informativa privacy",
      cookiesLabel: "Accetto il consenso cookies",
      notesLabel: "Note",
      notesPlaceholder: "Orario di arrivo, richieste particolari, informazioni utili...",
      submit: "Invia richiesta",
      submitting: "Invio in corso...",
      selectRoomHint: "Seleziona una camera dopo aver controllato la disponibilita`.",
      confirmedTitle: "Prenotazione confermata",
      confirmedBody:
        "La tua prenotazione e` stata confermata automaticamente. Conserva il codice qui sotto per ogni comunicazione.",
      pendingTitle: "Richiesta ricevuta",
      pendingBody:
        "La richiesta e` in attesa di conferma amministrativa. Ti contatteremo presto con i prossimi dettagli.",
      bookingCodeLabel: "Codice prenotazione",
      totalLabel: "Totale soggiorno",
      nightsLabel: "Notti",
      roomLabel: "Camera",
      fullNameLabel: "Nome e cognome",
      emailLabel: "Email",
      phoneLabel: "Telefono",
      guestsLabel: "Ospiti",
      checkInLabel: "Check-in",
      checkOutLabel: "Check-out",
      fromLabel: "Da",
      extraLabel: "Extra guest rule",
      includedConsentsError: "Devi confermare privacy e cookies prima di inviare la richiesta.",
      genericBookingError: "Non siamo riusciti a creare la prenotazione. Riprova tra poco.",
      availabilityError: "Non siamo riusciti a recuperare la disponibilita`.",
      roomChoiceHelper: "Le camere disponibili mostrano il totale calcolato direttamente dal server.",
      membershipTitle: "Informazione CLUB66",
      membershipBody:
        "Il bar CLUB66 e` un circolo ricreativo ARCI con accesso limitato ai membri. Una tessera di iscrizione puo` essere richiesta all interno del bar.",
    },
    en: {
      eyebrow: "Booking",
      title: "Check availability and send your request in just a few steps.",
      description:
        "Choose dates and guest count, see which rooms are available, and complete your request online.",
      stayTitle: "1. Stay details",
      stayBody: "Enter dates and guest count to view only the available rooms.",
      checkAvailability: "Check availability",
      checkingAvailability: "Checking availability...",
      stayError: "Enter valid check-in, check-out, and guest count values.",
      availabilityTitle: "2. Choose your room",
      availableLabel: "Available",
      unavailableLabel: "Unavailable",
      noRooms:
        "No rooms are available for those dates. Try a different period or guest count.",
      guestDetailsTitle: "3. Guest details",
      privacyLabel: "I accept the privacy policy",
      cookiesLabel: "I accept cookie consent",
      notesLabel: "Notes",
      notesPlaceholder: "Arrival time, special requests, helpful details...",
      submit: "Send request",
      submitting: "Sending...",
      selectRoomHint: "Select a room after checking availability.",
      confirmedTitle: "Booking confirmed",
      confirmedBody:
        "Your booking was confirmed automatically. Keep the code below for any follow-up communication.",
      pendingTitle: "Request received",
      pendingBody:
        "Your request is pending admin confirmation. We will contact you shortly with the next details.",
      bookingCodeLabel: "Booking code",
      totalLabel: "Stay total",
      nightsLabel: "Nights",
      roomLabel: "Room",
      fullNameLabel: "Full name",
      emailLabel: "Email",
      phoneLabel: "Phone",
      guestsLabel: "Guests",
      checkInLabel: "Check-in",
      checkOutLabel: "Check-out",
      fromLabel: "From",
      extraLabel: "Extra guest rule",
      includedConsentsError: "You must accept both privacy and cookies before sending the request.",
      genericBookingError: "We could not create the booking. Please try again shortly.",
      availabilityError: "We could not load availability.",
      roomChoiceHelper: "Available rooms show totals calculated directly on the server.",
      membershipTitle: "CLUB66 membership information",
      membershipBody:
        "The restaurant CLUB66 is an ARCI recreational club with access limited to members. Membership card inside the bar.",
    },
  } as const;

  const content = copy[locale];
  const [form, setForm] = useState<BookingFormState>({
    ...initialFormState,
    roomId: initialRoomId ?? "",
    formStartedAt: String(Date.now()),
  });
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSuccessResponse | null>(null);

  const selectedRoom = useMemo(
    () => availability?.rooms.find((room) => room.roomId === form.roomId) ?? null,
    [availability, form.roomId],
  );

  function updateField<Key extends keyof BookingFormState>(key: Key, value: BookingFormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleCheckAvailability(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAvailabilityError(null);
    setBookingError(null);
    setBookingSuccess(null);

    if (!form.checkIn || !form.checkOut || Number(form.guestsCount) < 1) {
      setAvailabilityError(content.stayError);
      return;
    }

    setIsCheckingAvailability(true);

    try {
      const params = new URLSearchParams({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestsCount: form.guestsCount,
      });

      const response = await fetch(`/api/availability?${params.toString()}`, {
        method: "GET",
      });
      const data = await response.json();

      if (!response.ok) {
        setAvailability(null);
        setAvailabilityError(typeof data.error === "string" ? data.error : content.availabilityError);
        return;
      }

      const nextAvailability = data as AvailabilityResponse;
      const stillValidSelectedRoom = nextAvailability.rooms.find(
        (room) => room.roomId === form.roomId && room.available,
      );

      setAvailability(nextAvailability);
      setForm((current) => ({
        ...current,
        roomId: stillValidSelectedRoom?.roomId ?? "",
      }));

      if (nextAvailability.availableRoomsCount === 0) {
        setAvailabilityError(content.noRooms);
      }
    } catch {
      setAvailability(null);
      setAvailabilityError(content.availabilityError);
    } finally {
      setIsCheckingAvailability(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!form.roomId) {
      setBookingError(content.selectRoomHint);
      return;
    }

    if (!form.consentPrivacy || !form.consentCookies) {
      setBookingError(content.includedConsentsError);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: form.roomId,
          website: form.website,
          formStartedAt: Number(form.formStartedAt),
          guestFullName: form.guestFullName,
          guestEmail: form.guestEmail,
          guestPhone: form.guestPhone,
          language: locale,
          guestsCount: Number(form.guestsCount),
          checkIn: form.checkIn,
          checkOut: form.checkOut,
          notes: form.notes,
          consentPrivacy: form.consentPrivacy,
          consentCookies: form.consentCookies,
          source: "website",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setBookingError(typeof data.error === "string" ? data.error : content.genericBookingError);
        return;
      }

      setBookingSuccess(data as BookingSuccessResponse);
    } catch {
      setBookingError(content.genericBookingError);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-[linear-gradient(180deg,#faf6ef_0%,#ffffff_25%,#ffffff_100%)]">
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

      <section className="mx-auto grid max-w-7xl gap-6 px-5 pb-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:pb-24">
        <div className="space-y-6">
          <form
            onSubmit={handleCheckAvailability}
            className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {content.stayTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-600">{content.stayBody}</p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.checkInLabel}</span>
                <input
                  type="date"
                  value={form.checkIn}
                  onChange={(event) => updateField("checkIn", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.checkOutLabel}</span>
                <input
                  type="date"
                  value={form.checkOut}
                  onChange={(event) => updateField("checkOut", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="text-sm font-semibold text-stone-700">{content.guestsLabel}</span>
              <input
                type="number"
                min="1"
                value={form.guestsCount}
                onChange={(event) => updateField("guestsCount", event.target.value)}
                className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
              />
            </label>

            {availabilityError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {availabilityError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isCheckingAvailability}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isCheckingAvailability ? content.checkingAvailability : content.checkAvailability}
            </button>
          </form>

          <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {content.availabilityTitle}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-600">{content.roomChoiceHelper}</p>

            {!availability ? (
              <p className="mt-5 rounded-2xl bg-stone-50 px-4 py-4 text-sm text-stone-600">
                {content.selectRoomHint}
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {availability.rooms.map((room) => {
                  const isSelected = form.roomId === room.roomId;
                  return (
                    <label
                      key={room.roomId}
                      className={`block rounded-[1.6rem] border p-4 transition ${
                        room.available
                          ? isSelected
                            ? "border-brand-500 bg-brand-50"
                            : "border-stone-200 bg-white hover:border-brand-300"
                          : "border-stone-200 bg-stone-50 opacity-75"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="roomId"
                          checked={isSelected}
                          disabled={!room.available}
                          onChange={() => updateField("roomId", room.roomId)}
                          className="mt-1 h-4 w-4 border-stone-300 text-brand-700 focus:ring-brand-500"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg text-brand-900">{room.name}</h2>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                                room.available
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {room.available ? content.availableLabel : content.unavailableLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-stone-600">
                            {content.guestsLabel}: {room.maxGuests}
                          </p>
                          {room.available && room.totalPriceEur !== null ? (
                            <p className="mt-2 text-sm font-semibold text-brand-900">
                              {content.totalLabel}: {formatPrice(locale, room.totalPriceEur)}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-rose-700">
                              {getReasonLabel(locale, room.reason)}
                            </p>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              {content.guestDetailsTitle}
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="sr-only">Website</span>
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  className="sr-only"
                  aria-hidden="true"
                />
              </label>

              <input type="hidden" name="formStartedAt" value={form.formStartedAt} />

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.fullNameLabel}</span>
                <input
                  type="text"
                  value={form.guestFullName}
                  onChange={(event) => updateField("guestFullName", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.emailLabel}</span>
                <input
                  type="email"
                  value={form.guestEmail}
                  onChange={(event) => updateField("guestEmail", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.phoneLabel}</span>
                <input
                  type="tel"
                  value={form.guestPhone}
                  onChange={(event) => updateField("guestPhone", event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700">{content.notesLabel}</span>
                <textarea
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                  placeholder={content.notesPlaceholder}
                  className="mt-2 min-h-32 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.consentPrivacy}
                  onChange={(event) => updateField("consentPrivacy", event.target.checked)}
                  className="mt-1 h-4 w-4 border-stone-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-sm leading-6 text-stone-700">{content.privacyLabel}</span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={form.consentCookies}
                  onChange={(event) => updateField("consentCookies", event.target.checked)}
                  className="mt-1 h-4 w-4 border-stone-300 text-brand-700 focus:ring-brand-500"
                />
                <span className="text-sm leading-6 text-stone-700">{content.cookiesLabel}</span>
              </label>
            </div>

            {bookingError ? (
              <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {bookingError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? content.submitting : content.submit}
            </button>
          </form>

          <aside className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
            {bookingSuccess ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                  {bookingSuccess.status === "confirmed"
                    ? content.confirmedTitle
                    : content.pendingTitle}
                </p>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  {bookingSuccess.status === "confirmed"
                    ? content.confirmedBody
                    : content.pendingBody}
                </p>
                <dl className="mt-5 space-y-3 rounded-[1.6rem] bg-stone-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-stone-500">{content.bookingCodeLabel}</dt>
                    <dd className="text-sm font-semibold text-brand-900">{bookingSuccess.bookingCode}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-stone-500">{content.nightsLabel}</dt>
                    <dd className="text-sm font-semibold text-brand-900">{bookingSuccess.nights}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-sm text-stone-500">{content.totalLabel}</dt>
                    <dd className="text-sm font-semibold text-brand-900">
                      {formatPrice(locale, bookingSuccess.totalPriceEur)}
                    </dd>
                  </div>
                </dl>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
                  {content.roomLabel}
                </p>
                <div className="mt-3 rounded-[1.6rem] bg-stone-50 p-4">
                  {selectedRoom ? (
                    <>
                      <h2 className="text-xl text-brand-900">{selectedRoom.name}</h2>
                      <p className="mt-2 text-sm text-stone-600">
                        {content.guestsLabel}: {selectedRoom.maxGuests}
                      </p>
                      {selectedRoom.totalPriceEur !== null ? (
                        <p className="mt-2 text-sm font-semibold text-brand-900">
                          {content.totalLabel}: {formatPrice(locale, selectedRoom.totalPriceEur)}
                        </p>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-sm leading-6 text-stone-600">{content.selectRoomHint}</p>
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-24">
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-6 shadow-sm sm:p-8">
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
