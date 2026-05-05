import { PublicSiteShell } from "@/components/public-site-shell";
import { HomePage } from "@/components/home-page";

export default function RootPage() {
  return (
    <PublicSiteShell locale="it">
      <HomePage locale="it" />
    </PublicSiteShell>
  );
}
