import { saveAdminEmails } from "@/app/admin/(protected)/emails/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminEmailsPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

const ADMIN_BOOKING_EMAILS_KEY = "admin_booking_emails";

async function getAdminEmails() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("policies")
    .select("value_it")
    .eq("key", ADMIN_BOOKING_EMAILS_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    configuredEmails: (data?.value_it ?? "").trim(),
    fallbackEmail: (process.env.ADMIN_BOOKING_EMAIL ?? "").trim(),
  };
}

export default async function AdminEmailsPage({ searchParams }: AdminEmailsPageProps) {
  const { error, success } = await searchParams;
  const { configuredEmails, fallbackEmail } = await getAdminEmails();

  return (
    <section className="space-y-8">
      {error ? (
        <article className="rounded-[1.6rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          {error}
        </article>
      ) : null}
      {success ? (
        <article className="rounded-[1.6rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          {success}
        </article>
      ) : null}

      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-700">
          Area admin
        </p>
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Email amministrative</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Imposta gli indirizzi che devono ricevere le notifiche delle nuove prenotazioni.
          Puoi inserire una email per riga oppure separarle con virgole.
        </p>
      </div>

      <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <form action={saveAdminEmails} className="space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Email amministrative</span>
            <textarea
              name="emails"
              defaultValue={configuredEmails}
              placeholder={`admin@example.com\nbooking@example.com`}
              className="mt-2 min-h-40 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
              required
            />
          </label>

          <div className="rounded-[1.5rem] bg-stone-50 p-4 text-sm leading-6 text-stone-700">
            <p className="font-semibold text-brand-900">Fallback ambiente</p>
            <p className="mt-2">
              {fallbackEmail || "Nessuna email fallback configurata in ADMIN_BOOKING_EMAIL."}
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              Salva email admin
            </button>
          </div>
        </form>
      </article>
    </section>
  );
}
