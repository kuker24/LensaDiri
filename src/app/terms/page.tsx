export default function TermsPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="prose-shell">
        <p className="mono-label text-ink">Ketentuan penggunaan</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Gunakan hasil sebagai bahan refleksi
        </h1>
        <div className="border-line text-ink-muted mt-12 border-t leading-8">
          <section className="border-line border-b py-7">
            <h2 className="text-ink text-xl font-medium">Ruang lingkup</h2>
            <p className="mt-2">
              LensaDiri menyediakan assessment reflektif dan bukan layanan diagnosis, terapi,
              rekrutmen, seleksi pendidikan, atau keputusan berisiko tinggi.
            </p>
          </section>
          <section className="border-line border-b py-7">
            <h2 className="text-ink text-xl font-medium">Akun dan keamanan</h2>
            <p className="mt-2">
              Pengguna bertanggung jawab menjaga kredensial akun. Sesi, result share, dan export
              hanya boleh digunakan untuk data yang berhak diakses.
            </p>
          </section>
          <section className="border-line border-b py-7">
            <h2 className="text-ink text-xl font-medium">Konten dan interpretasi</h2>
            <p className="mt-2">
              Hasil dapat berubah sesuai konteks dan respons. Jangan memakai satu hasil sebagai
              label permanen atau satu-satunya dasar keputusan penting.
            </p>
          </section>
          <section className="border-line border-b py-7">
            <h2 className="text-ink text-xl font-medium">Privasi dan penghapusan</h2>
            <p className="mt-2">
              Hasil private secara default. Pengguna dapat mengekspor, mencabut share, menghapus
              hasil, dan menghapus akun melalui kontrol yang tersedia.
            </p>
          </section>
        </div>
      </article>
    </section>
  );
}
