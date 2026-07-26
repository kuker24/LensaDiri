export default function ContactPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="max-w-3xl">
        <p className="mono-label text-aperture">Kontak / responsible disclosure</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Bantuan dan laporan keamanan
        </h1>
        <p className="text-ink-muted mt-6 leading-8">
          Gunakan kanal repository resmi untuk pertanyaan produk atau laporan teknis. Jangan kirim
          password, token, jawaban assessment, hasil private, atau data sensitif melalui issue
          publik.
        </p>
        <div className="bg-line mt-12 grid gap-px overflow-hidden rounded-lg border border-white/12 sm:grid-cols-2">
          <section className="bg-surface p-7">
            <h2 className="text-ink text-xl font-medium">Dukungan produk</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Sertakan route, waktu kejadian, dan langkah reproduksi tanpa menyalin data private.
            </p>
          </section>
          <section className="bg-danger-soft text-danger p-7">
            <h2 className="text-xl font-medium">Kerentanan keamanan</h2>
            <p className="mt-3 leading-7">
              Jangan membuka detail eksploitasi di ruang publik. Gunakan jalur responsible
              disclosure yang tercantum pada security policy repository.
            </p>
          </section>
        </div>
      </article>
    </section>
  );
}
