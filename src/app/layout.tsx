import type { Metadata } from "next";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Moncrivello B&B",
    template: "%s | Moncrivello B&B"
  },
  description: "Bilingual booking platform scaffold for a B&B in Italian and English."
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
