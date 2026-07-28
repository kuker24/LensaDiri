import Link from "next/link";

export default function ContactPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="max-w-3xl">
        <p className="mono-label text-ink">Kontak dan keamanan</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Bantuan dan laporan keamanan
        </h1>
        <p className="text-ink-muted mt-6 leading-8">
          Gunakan repositori resmi untuk pertanyaan produk atau laporan teknis. Jangan kirim kata
          sandi, token, jawaban asesmen, hasil privat, atau data sensitif melalui laporan publik.
        </p>
        <div className="mt-12 grid gap-10 sm:grid-cols-2 sm:gap-14">
          <section>
            <h2 className="text-ink text-xl font-medium">Dukungan produk</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Sertakan halaman, waktu kejadian, dan langkah reproduksi tanpa menyalin data privat.
            </p>
            <Link
              className="focus-ring quiet-link mt-5 inline-flex min-h-11 items-center rounded-[12px] font-medium"
              href="https://github.com/kuker24/LensaDiri/issues/new"
            >
              Buat laporan produk <span aria-hidden="true">↗</span>
            </Link>
          </section>
          <section>
            <h2 className="text-danger text-xl font-medium">Kerentanan keamanan</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Jangan membuka detail eksploitasi atau data sensitif di laporan publik. Kanal
              pelaporan privat belum tersedia.
            </p>
          </section>
        </div>
      </article>
    </section>
  );
}
