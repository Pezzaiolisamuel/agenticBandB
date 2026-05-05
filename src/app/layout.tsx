import type { Metadata } from "next";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CLUB66-B&B | Moncrivello, Piemonte",
    template: "%s | CLUB66-B&B"
  },
  description: "CLUB66-B&B is a bilingual hospitality platform for stays, booking requests, and guest support in Moncrivello, Piemonte.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsentBanner />
      </body>
    </html>
  );
}
