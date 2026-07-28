export default function TermsPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="prose-shell">
        <p className="mono-label text-ink">Ketentuan penggunaan</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Gunakan hasil sebagai bahan refleksi
        </h1>
        <div className="text-ink-muted mt-14 space-y-10 leading-8">
          <section>
            <h2 className="text-ink text-xl font-medium">Ruang lingkup</h2>
            <p className="mt-2">
              LensaDiri menyediakan asesmen reflektif dan bukan layanan diagnosis, terapi,
              rekrutmen, seleksi pendidikan, atau keputusan berisiko tinggi.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-medium">Akun dan keamanan</h2>
            <p className="mt-2">
              Pengguna bertanggung jawab menjaga kredensial akun. Sesi, tautan berbagi, dan ekspor
              hanya boleh digunakan untuk data yang memang berhak diakses.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-medium">Konten dan interpretasi</h2>
            <p className="mt-2">
              Hasil dapat berubah sesuai konteks dan respons. Jangan memakai satu hasil sebagai
              label permanen atau satu-satunya dasar keputusan penting.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-medium">Privasi dan penghapusan</h2>
            <p className="mt-2">
              Hasil privat secara bawaan. Pengguna dapat mengekspor, mencabut tautan berbagi,
              menghapus hasil, dan menghapus akun melalui kontrol yang tersedia.
            </p>
          </section>
        </div>
      </article>
    </section>
  );
}
