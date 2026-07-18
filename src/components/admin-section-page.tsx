import Link from "next/link";

interface AdminSectionPageProps {
  title: string;
  description: string;
  items?: readonly { label: string; value: string }[];
}

export function AdminSectionPage({ title, description, items = [] }: AdminSectionPageProps) {
  return (
    <main className="container-shell py-12">
      <nav aria-label="Breadcrumb" className="text-ink-muted mb-6 text-sm">
        <Link className="hover:text-ink underline" href="/admin">
          Admin
        </Link>
        <span className="mx-2">/</span>
        <span>{title}</span>
      </nav>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{title}</h1>
          <p className="text-ink-muted mt-2 max-w-2xl leading-7">{description}</p>
        </div>
        <button
          className="bg-lens text-on-lens min-h-11 rounded-md px-4 py-2 text-sm font-semibold disabled:opacity-50"
          disabled
          type="button"
        >
          Tambah Baru
        </button>
      </div>

      <section className="border-line mt-8 overflow-hidden rounded-lg border bg-white/90">
        <div className="border-line border-b px-5 py-3">
          <p className="text-sm font-semibold">Ringkasan</p>
        </div>
        {items.length > 0 ? (
          <dl className="divide-line divide-y">
            {items.map((item) => (
              <div className="flex items-center justify-between gap-4 px-5 py-3" key={item.label}>
                <dt className="text-sm font-medium">{item.label}</dt>
                <dd className="text-ink-muted text-sm">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="p-8 text-center">
            <p className="text-ink-muted">Belum ada data yang ditampilkan.</p>
            <p className="text-ink-muted mt-1 text-xs">
              Mutasi admin dinonaktifkan sampai endpoint authorization, CSRF, rate limit, dan audit
              log lengkap tersedia.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
