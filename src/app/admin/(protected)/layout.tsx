import Image from "next/image";
import Link from "next/link";

import { adminNavigation } from "@/config/navigation";
import { requireAdminUser } from "@/lib/auth/admin";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAdminUser();

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-3xl bg-brand-900 p-6 text-white">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-200">Admin</p>
          <div className="mt-3 flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="CLUB66-B&B"
              width={44}
              height={44}
              className="h-11 w-11 rounded-full object-cover"
            />
            <h1 className="text-3xl">CLUB66-B&B</h1>
          </div>
          <nav className="mt-8 flex flex-col gap-2">
            {adminNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-brand-100 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="rounded-3xl bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}
