import Link from "next/link";

interface AdminSectionPageProps {
  title: string;
  description: string;
  items?: readonly { label: string; value: string }[];
  footnote?: string;
}

export function AdminSectionPage({
  title,
  description,
  items = [],
  footnote = "Hanya-baca. Penambahan dan perubahan data dinonaktifkan.",
}: AdminSectionPageProps) {
  return (
    <div className="container-shell py-12">
      <nav aria-label="Jejak navigasi" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/admin">
          Admin
        </Link>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </nav>

      <div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="text-ink-muted mt-2 max-w-2xl leading-7">{description}</p>
      </div>

      <section className="border-line bg-surface mt-8 overflow-hidden rounded-lg border">
        <div className="border-line border-b px-5 py-3">
          <p className="text-sm font-semibold">Ringkasan</p>
        </div>
        {items.length > 0 ? (
          <dl className="divide-line divide-y">
            {items.map((item) => (
              <div
                className="flex items-start justify-between gap-4 px-5 py-3"
                key={`${item.label}:${item.value}`}
              >
                <dt className="text-sm font-medium break-all">{item.label}</dt>
                <dd className="text-ink-muted text-right text-sm break-all">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="p-8 text-center">
            <p className="text-ink-muted">Belum ada data yang ditampilkan.</p>
          </div>
        )}
        <p className="text-ink-muted border-line border-t px-5 py-3 text-xs">{footnote}</p>
      </section>
    </div>
  );
}
