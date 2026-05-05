export const locales = ["it", "en"] as const;
export const defaultLocale = "it";
export const LANGUAGE_COOKIE_NAME = "language";

export type Locale = (typeof locales)[number];
export type PublicPageKey =
  | "home"
  | "rooms"
  | "booking"
  | "about"
  | "contact"
  | "privacy"
  | "cookiePolicy";

type Section = {
  title: string;
  body: string;
};

type PublicPageCopy = {
  eyebrow: string;
  title: string;
  description: string;
  sections: Section[];
};

export type Dictionary = {
  site: {
    name: string;
    tagline: string;
    description: string;
  };
  navigation: Record<PublicPageKey, string>;
  home: PublicPageCopy;
  rooms: PublicPageCopy;
  booking: PublicPageCopy;
  about: PublicPageCopy;
  contact: PublicPageCopy;
  privacy: PublicPageCopy;
  cookiePolicy: PublicPageCopy;
};

const dictionaries: Record<Locale, Dictionary> = {
  it: {
    site: {
      name: "Il B&B di MONCRIVELLO",
      tagline: "Noi lo chiamiamo casa.",
      description: "Piattaforma bilingue per soggiorni, richieste e prenotazioni di CLUB66-B&B.",
    },
    navigation: {
      home: "Home",
      rooms: "Camere",
      booking: "Prenotazione",
      about: "Chi siamo",
      contact: "Contatti e mappa",
      privacy: "Privacy",
      cookiePolicy: "Cookie policy",
    },
    home: {
      eyebrow: "Piattaforma pubblica",
      title: "Una base pulita per presentare la struttura e gestire le prenotazioni.",
      description:
        "Questa homepage e` pronta per ospitare contenuti reali, call to action e integrazioni future senza introdurre logica fittizia.",
      sections: [
        {
          title: "Presentazione struttura",
          body: "Sostituisci questo blocco con una hero, gallery e messaggio di accoglienza.",
        },
        {
          title: "Esperienza ospite",
          body: "Aggiungi elementi distintivi, servizi inclusi e motivi per prenotare direttamente.",
        },
        {
          title: "Conversione",
          body: "Collega in seguito il bottone di prenotazione ai flussi reali di disponibilita`.",
        },
      ],
    },
    rooms: {
      eyebrow: "Pagina camere",
      title: "Spazio pronto per camere, suite e dettagli di soggiorno.",
      description:
        "La pagina e` predisposta per accogliere schede camera, servizi, immagini e regole tariffarie.",
      sections: [
        {
          title: "Catalogo camere",
          body: "Inserisci una griglia di camere con capienza, servizi e immagini.",
        },
        {
          title: "Dettagli utili",
          body: "Aggiungi check-in, colazione, accessibilita` e informazioni importanti.",
        },
        {
          title: "Collegamenti futuri",
          body: "Questa sezione puo` puntare a disponibilita`, booking engine o richieste personalizzate.",
        },
      ],
    },
    booking: {
      eyebrow: "Pagina prenotazione",
      title: "Area pronta per richieste, disponibilita` e conferme.",
      description:
        "Manteniamo il flusso vuoto ma strutturato, cosi` possiamo collegarlo a sistemi reali in un secondo momento.",
      sections: [
        {
          title: "Form prenotazione",
          body: "Aggiungi un form server-first con validazione quando il modello dati sara` definito.",
        },
        {
          title: "Disponibilita`",
          body: "La route API esiste gia` come placeholder per il futuro controllo delle date.",
        },
        {
          title: "Conferma",
          body: "Prevedi una UX chiara per richieste ricevute, errori e pagamenti futuri.",
        },
      ],
    },
    about: {
      eyebrow: "Pagina chi siamo",
      title: "Sezione editoriale pronta per storia, stile e territorio.",
      description:
        "Usa questa pagina per raccontare l'identita` del B&B e il contesto locale in modo bilingue.",
      sections: [
        {
          title: "Storia",
          body: "Inserisci il racconto della struttura e della sua evoluzione.",
        },
        {
          title: "Valori",
          body: "Evidenzia ospitalita`, design, sostenibilita` o altri elementi distintivi.",
        },
        {
          title: "Territorio",
          body: "Collega esperienze locali, eventi e punti di interesse.",
        },
      ],
    },
    contact: {
      eyebrow: "Pagina contatti",
      title: "Contatti, indicazioni e mappa in un unico punto.",
      description:
        "Questa pagina puo` diventare il riferimento per email, telefono, social e integrazione mappe.",
      sections: [
        {
          title: "Contatti diretti",
          body: "Inserisci recapiti verificati e orari di risposta.",
        },
        {
          title: "Mappa",
          body: "Sostituisci questo blocco con una mappa incorporata o un link esterno.",
        },
        {
          title: "Arrivo",
          body: "Aggiungi parcheggio, trasporti e istruzioni per il check-in.",
        },
      ],
    },
    privacy: {
      eyebrow: "Pagina privacy",
      title: "Base ordinata per informativa privacy e trattamento dati.",
      description:
        "Manteniamo il contenuto come placeholder finche` non saranno definiti i testi legali ufficiali.",
      sections: [
        {
          title: "Titolare del trattamento",
          body: "Inserisci i dati del titolare e i riferimenti legali corretti.",
        },
        {
          title: "Finalita`",
          body: "Documenta prenotazioni, richieste contatto e strumenti usati.",
        },
        {
          title: "Diritti utenti",
          body: "Aggiungi le procedure per accesso, rettifica e cancellazione dei dati.",
        },
      ],
    },
    cookiePolicy: {
      eyebrow: "Cookie policy",
      title: "Struttura pronta per cookie tecnici, analytics e consensi.",
      description:
        "Quando sara` scelto il setup definitivo dei servizi, potremo compilare questa pagina con i dettagli reali.",
      sections: [
        {
          title: "Cookie necessari",
          body: "Descrivi qui i cookie indispensabili al funzionamento del sito.",
        },
        {
          title: "Strumenti terzi",
          body: "Aggiungi analytics, mappe o widget solo quando saranno realmente presenti.",
        },
        {
          title: "Gestione consensi",
          body: "Collega questa pagina a un banner conforme quando verra` implementato.",
        },
      ],
    },
  },
  en: {
    site: {
      name: "CLUB66-B&B",
      tagline: "We just call it Home.",
      description: "Bilingual platform for stays, requests, and bookings at CLUB66-B&B.",
    },
    navigation: {
      home: "Home",
      rooms: "Rooms",
      booking: "Booking",
      about: "About",
      contact: "Contact & map",
      privacy: "Privacy",
      cookiePolicy: "Cookie policy",
    },
    home: {
      eyebrow: "Public platform",
      title: "A clean foundation for showcasing the property and handling bookings.",
      description:
        "This homepage is ready for real content, calls to action, and future integrations without introducing fake business logic.",
      sections: [
        {
          title: "Property showcase",
          body: "Replace this block with a hero, gallery, and welcome message.",
        },
        {
          title: "Guest experience",
          body: "Add differentiators, included services, and reasons to book direct.",
        },
        {
          title: "Conversion",
          body: "Connect the booking call to action to real availability flows later.",
        },
      ],
    },
    rooms: {
      eyebrow: "Rooms page",
      title: "Ready space for rooms, suites, and stay details.",
      description:
        "This page is prepared for room cards, amenities, imagery, and pricing notes.",
      sections: [
        {
          title: "Room catalog",
          body: "Add a room grid with occupancy, amenities, and imagery.",
        },
        {
          title: "Useful details",
          body: "Add check-in, breakfast, accessibility, and important guest information.",
        },
        {
          title: "Future links",
          body: "This section can later connect to availability, booking flows, or custom inquiries.",
        },
      ],
    },
    booking: {
      eyebrow: "Booking page",
      title: "A prepared area for requests, availability, and confirmations.",
      description:
        "The flow stays intentionally thin for now so we can connect it to real systems later.",
      sections: [
        {
          title: "Booking form",
          body: "Add a server-first form with validation once the data model is defined.",
        },
        {
          title: "Availability",
          body: "The API route already exists as a placeholder for future date checks.",
        },
        {
          title: "Confirmation",
          body: "Plan a clear UX for received requests, errors, and future payments.",
        },
      ],
    },
    about: {
      eyebrow: "About page",
      title: "Editorial space for story, style, and local context.",
      description:
        "Use this page to tell the B&B story and highlight the surrounding area in both languages.",
      sections: [
        {
          title: "Story",
          body: "Add the narrative of the property and its evolution.",
        },
        {
          title: "Values",
          body: "Highlight hospitality, design, sustainability, or other differentiators.",
        },
        {
          title: "Territory",
          body: "Link local experiences, events, and points of interest.",
        },
      ],
    },
    contact: {
      eyebrow: "Contact page",
      title: "Contacts, directions, and map in one place.",
      description:
        "This page can become the main reference for email, phone, social links, and map integration.",
      sections: [
        {
          title: "Direct contacts",
          body: "Add verified contact details and response expectations.",
        },
        {
          title: "Map",
          body: "Replace this block with an embedded map or an external directions link.",
        },
        {
          title: "Arrival",
          body: "Add parking, transport, and check-in instructions.",
        },
      ],
    },
    privacy: {
      eyebrow: "Privacy page",
      title: "Structured base for privacy information and data processing.",
      description:
        "Content stays as a placeholder until the official legal copy is ready.",
      sections: [
        {
          title: "Data controller",
          body: "Insert the correct controller details and legal references here.",
        },
        {
          title: "Purposes",
          body: "Document bookings, contact requests, and the tools being used.",
        },
        {
          title: "User rights",
          body: "Add the process for access, correction, and deletion requests.",
        },
      ],
    },
    cookiePolicy: {
      eyebrow: "Cookie policy",
      title: "Ready structure for technical cookies, analytics, and consent.",
      description:
        "Once the final service stack is chosen, this page can be filled with the real details.",
      sections: [
        {
          title: "Necessary cookies",
          body: "Describe the cookies required for site functionality here.",
        },
        {
          title: "Third-party tools",
          body: "Add analytics, maps, or widgets only when they are truly in use.",
        },
        {
          title: "Consent management",
          body: "Connect this page to a compliant cookie banner when it is implemented.",
        },
      ],
    },
  },
};

export function isSupportedLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale];
}

export function getLocaleFromValue(value: string | null | undefined): Locale {
  if (value && isSupportedLocale(value)) {
    return value;
  }

  return defaultLocale;
}

export function stripLocalePrefix(pathname: string) {
  if (!pathname || pathname === "/") {
    return "/";
  }

  for (const locale of locales) {
    if (pathname === `/${locale}`) {
      return "/";
    }

    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || "/";
    }
  }

  return pathname;
}

export function buildLocalizedPath(locale: Locale, pathname = "/") {
  const normalizedPath = stripLocalePrefix(pathname);

  if (locale === defaultLocale) {
    return normalizedPath;
  }

  return normalizedPath === "/" ? `/${locale}` : `/${locale}${normalizedPath}`;
}

export function getLocalizedWithItalianFallback(
  locale: Locale,
  valueIt: string | null | undefined,
  valueEn?: string | null,
) {
  const italianValue = valueIt?.trim() ?? "";
  const englishValue = valueEn?.trim() ?? "";

  if (locale === "en") {
    return englishValue || italianValue;
  }

  return italianValue;
}
