import "server-only";

import { getResendApiKey } from "@/lib/env";
import { logEvent } from "@/lib/logging";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type BookingEmailStatus =
  | "pending_admin_confirmation"
  | "confirmed"
  | "cancelled"
  | "completed";

type BookingEmailInput = {
  bookingCode: string;
  guestFullName: string;
  guestEmail: string;
  language: "it" | "en";
  roomName: string;
  checkInDate: string;
  checkOutDate: string;
  guestsCount: number;
  status: BookingEmailStatus;
  totalPriceEur: number;
};

type ResendEmailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
};

const DEFAULT_FROM_EMAIL = "CLUB66-B&B <onboarding@resend.dev>";
const ADMIN_BOOKING_EMAILS_KEY = "admin_booking_emails";

function formatPrice(locale: "it" | "en", value: number) {
  return new Intl.NumberFormat(locale === "it" ? "it-IT" : "en-GB", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(locale: "it" | "en", value: string) {
  return new Intl.DateTimeFormat(locale === "it" ? "it-IT" : "en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatStatus(locale: "it" | "en", status: BookingEmailStatus) {
  const labels = {
    it: {
      pending_admin_confirmation: "In attesa di conferma amministrativa",
      confirmed: "Confermata",
      cancelled: "Annullata",
      completed: "Completata",
    },
    en: {
      pending_admin_confirmation: "Pending admin confirmation",
      confirmed: "Confirmed",
      cancelled: "Cancelled",
      completed: "Completed",
    },
  } as const;

  return labels[locale][status];
}

function getEmailCopy(locale: "it" | "en") {
  return locale === "en"
    ? {
        adminSubjectPrefix: "New booking",
        createdSubject: "Your booking request at CLUB66-B&B",
        confirmedSubject: "Your booking is confirmed",
        cancelledSubject: "Your booking has been cancelled",
        introCreated:
          "We have received your booking request. Please find the main details below.",
        introConfirmed:
          "Your booking is now confirmed. Please find the updated details below.",
        introCancelled:
          "Your booking has been cancelled. Please find the original booking details below.",
        adminIntro:
          "A new booking has been created on the platform. Please review the details below.",
        labels: {
          bookingCode: "Booking code",
          guestName: "Guest name",
          room: "Room",
          checkIn: "Check-in date",
          checkOut: "Check-out date",
          guests: "Guests",
          status: "Status",
          totalPrice: "Total price",
        },
        policiesTitle: "Stay information",
        cashPayment: "Cash payment on arrival only",
        checkInTime: "Check-in from 16:00",
        checkOutTime: "Check-out by 10:30",
        breakfast: "Breakfast included",
        pets: "Pets are not allowed",
        membership:
          "The restaurant CLUB66 is an ARCI recreational club with access limited to members. Membership card inside the bar.",
      }
    : {
        adminSubjectPrefix: "Nuova prenotazione",
        createdSubject: "La tua richiesta di prenotazione a CLUB66-B&B",
        confirmedSubject: "La tua prenotazione e` confermata",
        cancelledSubject: "La tua prenotazione e` stata annullata",
        introCreated:
          "Abbiamo ricevuto la tua richiesta di prenotazione. Qui sotto trovi i dettagli principali.",
        introConfirmed:
          "La tua prenotazione e` ora confermata. Qui sotto trovi i dettagli aggiornati.",
        introCancelled:
          "La tua prenotazione e` stata annullata. Qui sotto trovi i dettagli della prenotazione.",
        adminIntro:
          "E` stata creata una nuova prenotazione sulla piattaforma. Qui sotto trovi i dettagli principali.",
        labels: {
          bookingCode: "Codice prenotazione",
          guestName: "Nome ospite",
          room: "Camera",
          checkIn: "Data check-in",
          checkOut: "Data check-out",
          guests: "Ospiti",
          status: "Stato",
          totalPrice: "Prezzo totale",
        },
        policiesTitle: "Informazioni sul soggiorno",
        cashPayment: "Pagamento solo in contanti all'arrivo",
        checkInTime: "Check-in dalle 16:00",
        checkOutTime: "Check-out entro le 10:30",
        breakfast: "Colazione inclusa",
        pets: "Animali non ammessi",
        membership:
          "Il bar CLUB66 e` un circolo ricreativo ARCI con accesso limitato ai membri. Una tessera di iscrizione puo` essere richiesta all interno del bar.",
      };
}

function buildBookingSummary(locale: "it" | "en", booking: BookingEmailInput) {
  const copy = getEmailCopy(locale);

  return [
    [copy.labels.bookingCode, booking.bookingCode],
    [copy.labels.guestName, booking.guestFullName],
    [copy.labels.room, booking.roomName],
    [copy.labels.checkIn, formatDate(locale, booking.checkInDate)],
    [copy.labels.checkOut, formatDate(locale, booking.checkOutDate)],
    [copy.labels.guests, String(booking.guestsCount)],
    [copy.labels.status, formatStatus(locale, booking.status)],
    [copy.labels.totalPrice, formatPrice(locale, booking.totalPriceEur)],
  ] as const;
}

function buildEmailBody({
  booking,
  intro,
  locale,
}: {
  booking: BookingEmailInput;
  intro: string;
  locale: "it" | "en";
}) {
  const copy = getEmailCopy(locale);
  const summary = buildBookingSummary(locale, booking);
  const policyItems = [
    copy.cashPayment,
    copy.checkInTime,
    copy.checkOutTime,
    copy.breakfast,
    copy.pets,
    copy.membership,
  ];

  const html = `
    <div style="font-family: Arial, sans-serif; color: #2d241c; line-height: 1.6;">
      <p>${intro}</p>
      <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
        <tbody>
          ${summary
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding: 8px 0; font-weight: 600; vertical-align: top;">${label}</td>
                  <td style="padding: 8px 0;">${value}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <p style="font-weight: 600; margin-top: 24px;">${copy.policiesTitle}</p>
      <ul style="padding-left: 18px;">
        ${policyItems.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;

  const text = [intro, "", ...summary.map(([label, value]) => `${label}: ${value}`), "", copy.policiesTitle, ...policyItems.map((item) => `- ${item}`)].join("\n");

  return { html, text };
}

async function sendWithResend(payload: ResendEmailPayload) {
  const apiKey = getResendApiKey();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`Resend email request failed with ${response.status}: ${responseText}`);
  }
}

function parseEmailList(value: string) {
  return value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

async function getAdminBookingRecipients() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("policies")
      .select("value_it")
      .eq("key", ADMIN_BOOKING_EMAILS_KEY)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const configured = parseEmailList((data?.value_it ?? "").trim());

    if (configured.length > 0) {
      return configured;
    }
  } catch (error) {
    console.error("Failed to read admin booking emails from policies:", error);
  }

  return parseEmailList((process.env.ADMIN_BOOKING_EMAIL ?? "").trim());
}

async function sendBookingEmail({
  booking,
  eventType,
  intro,
  recipient,
  subject,
  source,
}: {
  booking: BookingEmailInput;
  eventType: string;
  intro: string;
  recipient: string;
  subject: string;
  source: string;
}) {
  try {
    const locale = booking.language === "en" ? "en" : "it";
    const body = buildEmailBody({ booking, intro, locale });

    await sendWithResend({
      from: DEFAULT_FROM_EMAIL,
      to: [recipient],
      subject,
      html: body.html,
      text: body.text,
    });
  } catch (error) {
    console.error(`${eventType} email failed:`, error);
    await logEvent({
      type: "email_failed",
      source,
      message: `Failed to send ${eventType} email.`,
      metadata: {
        bookingCode: booking.bookingCode,
        roomName: booking.roomName,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
        status: booking.status,
      },
    });
  }
}

export async function sendAdminNewBookingEmail(booking: BookingEmailInput) {
  const locale = booking.language === "en" ? "en" : "it";
  const copy = getEmailCopy(locale);
  const recipients = await getAdminBookingRecipients();

  if (recipients.length === 0) {
    await logEvent({
      type: "email_failed",
      source: "email_admin_new_booking",
      message: "No administrator booking email is configured.",
      metadata: {
        bookingCode: booking.bookingCode,
        checkIn: booking.checkInDate,
        checkOut: booking.checkOutDate,
      },
    });
    return;
  }

  await Promise.all(
    recipients.map((recipient) =>
      sendBookingEmail({
        booking,
        eventType: "admin_new_booking",
        intro: copy.adminIntro,
        recipient,
        subject: `${copy.adminSubjectPrefix}: ${booking.bookingCode}`,
        source: "email_admin_new_booking",
      }),
    ),
  );
}

export async function sendGuestBookingCreatedEmail(booking: BookingEmailInput) {
  const locale = booking.language === "en" ? "en" : "it";
  const copy = getEmailCopy(locale);

  await sendBookingEmail({
    booking,
    eventType: "guest_booking_created",
    intro: copy.introCreated,
    recipient: booking.guestEmail,
    subject: `${copy.createdSubject} - ${booking.bookingCode}`,
    source: "email_guest_booking_created",
  });
}

export async function sendGuestBookingConfirmedEmail(booking: BookingEmailInput) {
  const locale = booking.language === "en" ? "en" : "it";
  const copy = getEmailCopy(locale);

  await sendBookingEmail({
    booking,
    eventType: "guest_booking_confirmed",
    intro: copy.introConfirmed,
    recipient: booking.guestEmail,
    subject: `${copy.confirmedSubject} - ${booking.bookingCode}`,
    source: "email_guest_booking_confirmed",
  });
}

export async function sendGuestBookingCancelledEmail(booking: BookingEmailInput) {
  const locale = booking.language === "en" ? "en" : "it";
  const copy = getEmailCopy(locale);

  await sendBookingEmail({
    booking,
    eventType: "guest_booking_cancelled",
    intro: copy.introCancelled,
    recipient: booking.guestEmail,
    subject: `${copy.cancelledSubject} - ${booking.bookingCode}`,
    source: "email_guest_booking_cancelled",
  });
}
