export default function TermsPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="prose-shell">
        <p className="text-lens text-sm font-semibold">Ketentuan penggunaan</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Gunakan hasil sebagai bahan refleksi
        </h1>
        <div className="text-ink-muted mt-8 space-y-7 leading-8">
          <section>
            <h2 className="text-ink text-xl font-semibold">Ruang lingkup</h2>
            <p className="mt-2">
              LensaDiri menyediakan assessment reflektif dan bukan layanan diagnosis, terapi,
              rekrutmen, seleksi pendidikan, atau keputusan berisiko tinggi.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-semibold">Akun dan keamanan</h2>
            <p className="mt-2">
              Pengguna bertanggung jawab menjaga kredensial akun. Sesi, result share, dan export
              hanya boleh digunakan untuk data yang berhak diakses.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-semibold">Konten dan interpretasi</h2>
            <p className="mt-2">
              Hasil dapat berubah sesuai konteks dan respons. Jangan memakai satu hasil sebagai
              label permanen atau satu-satunya dasar keputusan penting.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-semibold">Privasi dan penghapusan</h2>
            <p className="mt-2">
              Hasil private secara default. Pengguna dapat mengekspor, mencabut share, menghapus
              hasil, dan menghapus akun melalui kontrol yang tersedia.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
