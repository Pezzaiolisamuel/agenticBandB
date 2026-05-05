"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type AdminLoginFormProps = {
  error?: string;
};

export function AdminLoginForm({ error }: AdminLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (error !== "not-authorized") {
      return;
    }

    const supabase = createSupabaseBrowserClient();
    void supabase.auth.signOut();
  }, [error]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setFormError(signInError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  const bannerError =
    error === "not-authorized"
      ? "Questo account e autenticato ma non e autorizzato ad accedere alla area admin."
      : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="flex items-center gap-3">
        <Image
          src="/logo.png"
          alt="CLUB66-B&B"
          width={40}
          height={40}
          className="h-10 w-10 rounded-full object-cover"
        />
        <span className="text-lg text-brand-900">CLUB66-B&B</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-700">
        Accesso admin
      </p>
      <h1 className="mt-3 text-4xl leading-tight text-brand-900">Accedi a CLUB66-B&B</h1>
      <p className="mt-3 text-base leading-7 text-stone-600">
        Usa il tuo account Supabase Auth. Solo gli utenti presenti in <code>admin_profiles</code>{" "}
        possono entrare nella area admin.
      </p>

      {bannerError ? (
        <p className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {bannerError}
        </p>
      ) : null}

      {formError ? (
        <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</p>
      ) : null}

      <div className="mt-6 space-y-4">
        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-semibold text-stone-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-brand-500"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex items-center justify-center rounded-full bg-brand-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
      >
        {isSubmitting ? "Accesso in corso..." : "Accedi"}
      </button>
    </form>
  );
}
