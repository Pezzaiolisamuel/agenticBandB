export const publicNavigation = [
  { key: "home", href: "" },
  { key: "rooms", href: "/rooms" },
  { key: "booking", href: "/booking" },
  { key: "about", href: "/about" },
  { key: "contact", href: "/contact" },
  { key: "privacy", href: "/privacy" },
  { key: "cookiePolicy", href: "/cookie-policy" }
] as const;

export const adminNavigation = [
  { label: "Dashboard", href: "/admin" },
  { label: "Prenotazioni", href: "/admin/bookings" },
  { label: "Prezzi", href: "/admin/prices" },
  { label: "Policy", href: "/admin/policies" },
  { label: "Media", href: "/admin/media" },
  { label: "Disponibilita", href: "/admin/availability" }
] as const;
