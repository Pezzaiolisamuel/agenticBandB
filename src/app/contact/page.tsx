import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedContactPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/contact/page";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
  });
}

export default function ContactPage() {
  return (
    <PublicSiteShell locale="it">
      <LocalizedContactPage params={Promise.resolve({ locale: "it" })} />
    </PublicSiteShell>
  );
}
