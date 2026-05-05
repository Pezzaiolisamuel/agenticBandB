type LegalSection = {
  title: string;
  body: readonly string[];
};

type LegalPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  reviewNotice: string;
  sections: readonly LegalSection[];
};

export function LegalPage({
  eyebrow,
  title,
  description,
  reviewNotice,
  sections,
}: LegalPageProps) {
  return (
    <div className="bg-[linear-gradient(180deg,#faf5ed_0%,#fffdf9_28%,#ffffff_100%)]">
      <section className="mx-auto max-w-6xl px-5 pb-8 pt-10 sm:px-6 lg:px-8 lg:pb-12 lg:pt-16">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-700">
          {eyebrow}
        </p>
        <h1 className="mt-4 max-w-4xl text-4xl leading-tight text-brand-900 sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
          {description}
        </p>
        <div className="mt-6 rounded-[1.6rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
          {reviewNotice}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-6 lg:px-8 lg:pb-24">
        <div className="grid gap-5">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[2rem] border border-stone-200 bg-white px-5 py-6 shadow-sm sm:px-6"
            >
              <h2 className="text-2xl text-brand-900">{section.title}</h2>
              <div className="mt-4 space-y-4">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="text-base leading-7 text-stone-700">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
