import { AdminBookingsView } from "@/app/admin/(protected)/bookings/bookings-view";

type AdminBookingsArchivePageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>;
};

export default async function AdminBookingsArchivePage({
  searchParams,
}: AdminBookingsArchivePageProps) {
  return <AdminBookingsView searchParams={await searchParams} mode="archive" />;
}
