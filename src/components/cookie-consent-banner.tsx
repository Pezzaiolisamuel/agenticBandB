"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { defaultLocale, isSupportedLocale, type Locale } from "@/lib/locales";

const CONSENT_STORAGE_KEY = "cookie-consent";
const VISITOR_ID_STORAGE_KEY = "visitor-id";

type ConsentPreference = "necessary_only" | "all";

type StoredConsent = {
  accepted: boolean;
  choice: ConsentPreference;
  language: Locale;
  savedAt: string;
};

function getLocaleFromPath(pathname: string) {
  const maybeLocale = pathname.split("/")[1];

  if (isSupportedLocale(maybeLocale)) {
    return maybeLocale;
  }

  return defaultLocale;
}

function getOrCreateVisitorId() {
  const existing = window.localStorage.getItem(VISITOR_ID_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const visitorId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `visitor-${Date.now()}`;

  window.localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);

  return visitorId;
}

async function postConsentEvent({
  accepted,
  language,
  visitorId,
}: {
  accepted: boolean;
  language: Locale;
  visitorId: string;
}) {
  const body = JSON.stringify({
    accepted,
    consentType: "cookie_banner",
    language,
    visitorId,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/consents", blob);
    return;
  }

  await fetch("/api/consents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    keepalive: true,
  });
}

export function CookieConsentBanner() {
  const pathname = usePathname();
  const locale = getLocaleFromPath(pathname);
  const [isVisible, setIsVisible] = useState(false);

  const copy = {
    it: {
      title: "Preferenze cookie",
      body:
        "Usiamo solo funzioni essenziali per il sito e, se lo desideri, possiamo ricordare un consenso piu` ampio. La scelta non blocca le funzioni principali.",
      necessaryOnly: "Solo necessari",
      acceptAll: "Accetta tutto",
      policy: "Leggi la cookie policy",
    },
    en: {
      title: "Cookie preferences",
      body:
        "We use essential site functionality and, if you want, we can remember broader consent preferences. Your choice does not block core site features.",
      necessaryOnly: "Necessary only",
      acceptAll: "Accept all",
      policy: "Read the cookie policy",
    },
  } as const;

  const content = copy[locale];

  useEffect(() => {
    const storedConsent = window.localStorage.getItem(CONSENT_STORAGE_KEY);

    if (!storedConsent) {
      setIsVisible(true);
    }
  }, []);

  async function handleConsent(choice: ConsentPreference) {
    const visitorId = getOrCreateVisitorId();
    const accepted = choice === "all";
    const storedConsent: StoredConsent = {
      accepted,
      choice,
      language: locale,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(storedConsent));
    setIsVisible(false);

    try {
      await postConsentEvent({
        accepted,
        language: locale,
        visitorId,
      });
    } catch {
      // The preference is already stored locally; a failed event should not
      // interrupt essential site functionality.
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-4xl rounded-[1.8rem] border border-stone-200 bg-white/95 p-5 shadow-[0_24px_60px_-30px_rgba(39,29,21,0.45)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-lg text-brand-900">{content.title}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">{content.body}</p>
            <Link
              href={`/${locale}/cookie-policy`}
              className="mt-3 inline-flex text-sm font-semibold text-brand-700 hover:text-brand-900"
            >
              {content.policy}
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void handleConsent("necessary_only")}
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-brand-900 transition hover:border-brand-500"
            >
              {content.necessaryOnly}
            </button>
            <button
              type="button"
              onClick={() => void handleConsent("all")}
              className="inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              {content.acceptAll}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
