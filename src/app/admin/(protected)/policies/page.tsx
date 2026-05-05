import { savePolicies } from "@/app/admin/(protected)/policies/actions";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type AdminPoliciesPageProps = {
  searchParams: Promise<{ error?: string; success?: string }>;
};

type PolicyKey =
  | "cancellation_policy"
  | "checkin_checkout_policy"
  | "breakfast_policy"
  | "pets_policy";

type PolicyRecord = {
  key: PolicyKey;
  value_it: string;
  value_en: string;
};

const policyDefinitions = [
  {
    key: "cancellation_policy",
    title: "Policy di cancellazione",
    description: "Usata per gli snapshot delle prenotazioni e per la presentazione pubblica.",
    placeholderIt: "Inserisci qui la politica di cancellazione in italiano...",
    placeholderEn: "Inserisci qui la politica di cancellazione in inglese...",
  },
  {
    key: "checkin_checkout_policy",
    title: "Check-in / check-out",
    description: "Riferimento interno e indicazioni pubbliche sugli orari del soggiorno.",
    placeholderIt: "Inserisci qui la policy di check-in / check-out in italiano...",
    placeholderEn: "Inserisci qui la policy di check-in / check-out in inglese...",
  },
  {
    key: "breakfast_policy",
    title: "Colazione",
    description: "Spiega disponibilita, orari o modalita del servizio colazione.",
    placeholderIt: "Inserisci qui la policy colazione in italiano...",
    placeholderEn: "Inserisci qui la policy colazione in inglese...",
  },
  {
    key: "pets_policy",
    title: "Animali",
    description: "Chiarisci se gli animali sono ammessi e a quali condizioni.",
    placeholderIt: "Inserisci qui la policy animali in italiano...",
    placeholderEn: "Inserisci qui la policy animali in inglese...",
  },
] as const;

async function getPolicies() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("policies")
    .select("key, value_it, value_en")
    .in(
      "key",
      policyDefinitions.map((policy) => policy.key),
    );

  if (error) {
    throw error;
  }

  return ((data ?? []) as PolicyRecord[]).reduce<Record<string, PolicyRecord>>((accumulator, policy) => {
    accumulator[policy.key] = policy;
    return accumulator;
  }, {});
}

export default async function AdminPoliciesPage({ searchParams }: AdminPoliciesPageProps) {
  const { error, success } = await searchParams;
  const policies = await getPolicies();

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
        <h1 className="mt-3 text-4xl leading-tight text-brand-900">Policy</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
          Mantieni aggiornati i principali testi delle policy pubbliche e legate alle prenotazioni
          in italiano e inglese.
        </p>
      </div>

      <form action={savePolicies} className="space-y-6">
        {policyDefinitions.map((policy) => {
          const existing = policies[policy.key];

          return (
            <article
              key={policy.key}
              className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div>
                <h2 className="text-2xl text-brand-900">{policy.title}</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">{policy.description}</p>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Italiano</span>
                  <textarea
                    name={`${policy.key}_it`}
                    defaultValue={existing?.value_it ?? ""}
                    placeholder={policy.placeholderIt}
                    className="mt-2 min-h-40 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-semibold text-stone-700">Inglese</span>
                  <textarea
                    name={`${policy.key}_en`}
                    defaultValue={existing?.value_en ?? ""}
                    placeholder={policy.placeholderEn}
                    className="mt-2 min-h-40 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
                    required
                  />
                </label>
              </div>
            </article>
          );
        })}

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800"
          >
            Salva policy
          </button>
        </div>
      </form>
    </section>
  );
}
