import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <article className="max-w-4xl">
        <p className="text-sm font-semibold text-violet-700">Tentang LensaDiri</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Refleksi berlapis tanpa label mutlak</h1>
        <p className="mt-6 leading-8 text-[var(--muted)]">
          LensaDiri membantu pengguna membaca pola jawaban melalui beberapa modul independen. Skor primer dihitung secara deterministic di server, lalu hubungan antar-lensa dijelaskan tanpa mengubah skor tersebut.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-xl font-semibold">Yang kami lakukan</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">Menyediakan assessment reflektif, confidence, quality notice, clarifier, dan kontrol data private.</p>
          </section>
          <section className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <h2 className="text-xl font-semibold">Yang tidak kami klaim</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">LensaDiri bukan diagnosis, bukan pengganti profesional, dan belum mengklaim validasi psikometrik formal.</p>
          </section>
        </div>
        <Link className="focus-ring mt-8 inline-flex min-h-12 items-center rounded-xl bg-[var(--foreground)] px-5 font-semibold text-white" href="/modules">Lihat katalog modul</Link>
      </article>
    </main>
  );
}
