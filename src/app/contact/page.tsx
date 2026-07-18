export default function ContactPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="max-w-3xl">
        <p className="text-lens text-sm font-semibold">Kontak</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Bantuan dan laporan keamanan
        </h1>
        <p className="text-ink-muted mt-6 leading-8">
          Gunakan kanal repository resmi untuk pertanyaan produk atau laporan teknis. Jangan kirim
          password, token, jawaban assessment, hasil private, atau data sensitif melalui issue
          publik.
        </p>
        <div className="mt-8 space-y-5">
          <section className="border-line rounded-md border bg-white/90 p-6">
            <h2 className="text-ink text-xl font-semibold">Dukungan produk</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Sertakan route, waktu kejadian, dan langkah reproduksi tanpa menyalin data private.
            </p>
          </section>
          <section className="border-danger/30 bg-danger-soft text-danger rounded-md border p-6">
            <h2 className="text-xl font-semibold">Kerentanan keamanan</h2>
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
