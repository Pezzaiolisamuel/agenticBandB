import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedCookiePolicyPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/cookie-policy/page";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
  });
}

export default function CookiePolicyPage() {
  return (
    <PublicSiteShell locale="it">
      <LocalizedCookiePolicyPage params={Promise.resolve({ locale: "it" })} />
    </PublicSiteShell>
  );
}
