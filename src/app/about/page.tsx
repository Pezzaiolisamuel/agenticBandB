import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedAboutPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/about/page";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
  });
}

export default function AboutPage() {
  return (
    <PublicSiteShell locale="it">
      <LocalizedAboutPage params={Promise.resolve({ locale: "it" })} />
    </PublicSiteShell>
  );
}
