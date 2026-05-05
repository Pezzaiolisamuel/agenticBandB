import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedBookingPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/booking/page";

type BookingPageProps = {
  searchParams: Promise<{ roomId?: string }>;
};

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
    searchParams: Promise.resolve({}),
  });
}

export default function BookingPage({ searchParams }: BookingPageProps) {
  return (
    <PublicSiteShell locale="it">
      <LocalizedBookingPage
        params={Promise.resolve({ locale: "it" })}
        searchParams={searchParams}
      />
    </PublicSiteShell>
  );
}
