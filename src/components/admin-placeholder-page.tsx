type AdminPlaceholderPageProps = {
  title: string;
  description: string;
  items: string[];
};

export function AdminPlaceholderPage({
  title,
  description,
  items
}: AdminPlaceholderPageProps) {
  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm uppercase tracking-[0.2em] text-brand-600">Admin workspace</p>
        <h2 className="mt-3 text-4xl text-brand-900">
          {title}
        </h2>
        <p className="mt-4 max-w-3xl text-lg text-stone-600">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <article key={item} className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
            <p className="text-sm leading-6 text-stone-700">{item}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
