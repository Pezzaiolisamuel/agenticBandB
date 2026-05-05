import { AdminBookingsView } from "@/app/admin/(protected)/bookings/bookings-view";

type AdminBookingsPageProps = {
  searchParams: Promise<{
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }>;
};

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
  return <AdminBookingsView searchParams={await searchParams} mode="current" />;
}
