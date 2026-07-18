export default function ContactPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="max-w-3xl">
        <p className="text-sm font-semibold text-lens">Kontak</p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">
          Bantuan dan laporan keamanan
        </h1>
        <p className="mt-6 leading-8 text-ink-muted">
          Gunakan kanal repository resmi untuk pertanyaan produk atau laporan teknis. Jangan kirim
          password, token, jawaban assessment, hasil private, atau data sensitif melalui issue
          publik.
        </p>
        <div className="mt-8 space-y-5">
          <section className="rounded-md border border-line bg-white p-6 shadow-surface">
            <h2 className="font-display text-xl font-semibold text-ink">Dukungan produk</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              Sertakan route, waktu kejadian, dan langkah reproduksi tanpa menyalin data private.
            </p>
          </section>
          <section className="rounded-md border border-danger-soft bg-danger-soft p-6 text-danger">
            <h2 className="font-display text-xl font-semibold">Kerentanan keamanan</h2>
            <p className="mt-3 leading-7">
              Jangan membuka detail eksploitasi di ruang publik. Gunakan jalur responsible
              disclosure yang tercantum pada security policy repository.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
