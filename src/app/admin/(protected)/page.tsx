import Link from "next/link";

import { adminNavigation } from "@/config/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type DashboardStat = {
  description: string;
  value: number;
};

async function getDashboardStats() {
  const supabase = createSupabaseAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: totalBookings, error: totalBookingsError },
    { count: pendingBookings, error: pendingBookingsError },
    { count: confirmedUpcomingBookings, error: confirmedUpcomingBookingsError },
    { count: activeRooms, error: activeRoomsError },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_admin_confirmation"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("check_out_date", today),
    supabase
      .from("rooms")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ]);

  const errors = [
    totalBookingsError,
    pendingBookingsError,
    confirmedUpcomingBookingsError,
    activeRoomsError,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw errors[0];
  }

  return {
    totalBookings: totalBookings ?? 0,
    pendingBookings: pendingBookings ?? 0,
    confirmedUpcomingBookings: confirmedUpcomingBookings ?? 0,
    activeRooms: activeRooms ?? 0,
  };
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const statCards: DashboardStat[] = [
    {
      description: "Prenotazioni totali",
      value: stats.totalBookings,
    },
    {
      description: "Prenotazioni in attesa",
      value: stats.pendingBookings,
    },
    {
      description: "Prenotazioni confermate in arrivo",
      value: stats.confirmedUpcomingBookings,
    },
    {
      description: "Camere attive",
      value: stats.activeRooms,
    },
  ];

  return (
    <div className="space-y-8">
      <section>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Dashboard
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Panoramica operativa</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Una vista rapida del flusso prenotazioni, dei soggiorni confermati in arrivo e
          del inventario camere attive di Moncrivello B&B.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <article
            key={card.description}
            className="rounded-[1.8rem] border border-stone-200 bg-stone-50 p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-stone-500">{card.description}</p>
            <p className="mt-4 text-5xl leading-none text-brand-900">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
              Collegamenti rapidi
            </p>
            <h2 className="mt-2 text-2xl text-brand-900">
              Vai direttamente alle principali aree admin
            </h2>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {adminNavigation
            .filter((item) => item.href !== "/admin")
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.6rem] border border-stone-200 bg-stone-50 px-5 py-5 transition hover:border-brand-400 hover:bg-brand-50"
              >
                <p className="text-lg text-brand-900">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  Apri la sezione {item.label.toLowerCase()}.
                </p>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
