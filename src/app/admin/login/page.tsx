import Image from "next/image";
import { AdminLoginForm } from "@/components/admin-login-form";

type AdminLoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#faf5ed_0%,#fffdf9_38%,#ffffff_100%)]">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center px-5 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-brand-900 p-6 text-white shadow-[0_26px_70px_-30px_rgba(39,29,21,0.8)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-200">
              Area admin
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="CLUB66-B&B"
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
              />
              <span className="text-lg text-brand-100">CLUB66-B&B</span>
            </div>
            <h1 className="mt-4 text-4xl leading-tight text-white">
              Accesso protetto riservato allo staff
            </h1>
            <p className="mt-4 text-base leading-7 text-brand-100/90">
              Gli utenti non autenticati vengono reindirizzati qui. Anche gli utenti autenticati
              devono essere presenti in <code>admin_profiles</code> prima di poter aprire le altre
              pagine admin.
            </p>
          </div>

          <AdminLoginForm error={error} />
        </div>
      </div>
    </div>
  );
}
