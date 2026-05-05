type PlaceholderSection = {
  title: string;
  body: string;
};

type PlaceholderPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sections: PlaceholderSection[];
};

export function PlaceholderPage({
  eyebrow,
  title,
  description,
  sections
}: PlaceholderPageProps) {
  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(168,130,76,0.18),_transparent_36%),linear-gradient(180deg,#f8f6f1_0%,#fafaf9_100%)]">
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <p className="text-sm uppercase tracking-[0.2em] text-brand-700">{eyebrow}</p>
        <h1 className="mt-5 max-w-4xl text-5xl leading-tight text-brand-900 md:text-7xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600">{description}</p>
      </section>
      <section className="mx-auto grid max-w-7xl gap-6 px-6 pb-20 md:grid-cols-3">
        {sections.map((section) => (
          <article
            key={section.title}
            className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm backdrop-blur"
          >
            <h2 className="text-2xl text-brand-900">
              {section.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-stone-600">{section.body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
