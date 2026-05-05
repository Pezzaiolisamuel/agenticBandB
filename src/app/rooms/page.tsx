import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedRoomsPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/rooms/page";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
  });
}

export default function RoomsPage() {
  return (
    <PublicSiteShell locale="it">
      <LocalizedRoomsPage params={Promise.resolve({ locale: "it" })} />
    </PublicSiteShell>
  );
}
