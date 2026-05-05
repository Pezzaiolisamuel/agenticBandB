import { PublicSiteShell } from "@/components/public-site-shell";
import LocalizedPrivacyPage, {
  generateMetadata as generateLocalizedMetadata,
} from "@/app/[locale]/privacy/page";

export function generateMetadata() {
  return generateLocalizedMetadata({
    params: Promise.resolve({ locale: "it" }),
  });
}

export default function PrivacyPage() {
  return (
    <PublicSiteShell locale="it">
      <LocalizedPrivacyPage params={Promise.resolve({ locale: "it" })} />
    </PublicSiteShell>
  );
}
