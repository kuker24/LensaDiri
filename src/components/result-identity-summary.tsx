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
            className="border-line bg-surface rounded-full border px-4 py-1.5 text-sm leading-5 shadow-[0_1px_6px_rgb(27_28_26_/_0.06)]"
            key={item.name}
          >
            <span className="text-steel font-mono text-xs font-medium tracking-wider uppercase">
              {item.name}
            </span>
            <span aria-hidden="true" className="text-line-strong mx-2">
              ·
            </span>
            <strong className="text-ink font-semibold">{item.title}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}
