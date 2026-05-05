import { BookingPage } from "@/components/booking-page";
import { buildPublicPageMetadata } from "@/lib/metadata";
import type { Locale } from "@/lib/locales";

type BookingPageRouteProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ roomId?: string }>;
};

export async function generateMetadata({ params }: BookingPageRouteProps) {
  const { locale } = await params;
  return buildPublicPageMetadata(locale, "booking");
}

export default async function BookingPageRoute({
  params,
  searchParams,
}: BookingPageRouteProps) {
  const { locale } = await params;
  const { roomId } = await searchParams;

  return <BookingPage locale={locale} initialRoomId={roomId} />;
}
