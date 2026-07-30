export type ResultIdentity = {
  readonly name: string;
  readonly title: string;
};

export function ResultIdentitySummary({ items }: { items: readonly ResultIdentity[] }) {
  return (
    <section aria-labelledby="result-identity-heading" className="mt-7">
      <h2 className="sr-only" id="result-identity-heading">
        Ringkasan semua lensa
      </h2>
      <ul className="flex flex-wrap gap-2.5">
        {items.map((item) => (
          <li
            className="border-line bg-surface-raised rounded-[12px] border px-3.5 py-2 text-sm leading-5"
            key={item.name}
          >
            <span className="text-ink-muted">{item.name}</span>
            <span aria-hidden="true" className="mx-1.5 text-white/35">
              ·
            </span>
            <strong className="font-medium">{item.title}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
