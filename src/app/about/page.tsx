import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="max-w-4xl">
        <h1 className="tracking-[-0.035em]">
          <span className="mono-label text-aperture mb-5 block">Tentang LensaDiri</span>
          <span className="text-ink block text-4xl font-medium sm:text-6xl">
            Refleksi berlapis,
            <span className="display-italic text-aperture block">tanpa label mutlak.</span>
          </span>
        </h1>
        <p className="text-ink-muted mt-6 leading-8">
          LensaDiri membantu pengguna membaca pola jawaban melalui beberapa modul independen. Skor
          primer dihitung secara deterministic di server, lalu hubungan antar-lensa dijelaskan tanpa
          mengubah skor tersebut.
        </p>
        <div className="border-line mt-12 grid border-y md:grid-cols-2">
          <section className="border-line py-7 md:border-r md:pr-8">
            <h2 className="text-ink text-xl font-medium">Yang kami lakukan</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Menyediakan assessment reflektif, confidence, quality notice, clarifier, dan kontrol
              data private.
            </p>
          </section>
          <section className="py-7 md:pl-8">
            <h2 className="text-ink text-xl font-medium">Yang tidak kami klaim</h2>
            <p className="text-ink-muted mt-3 leading-7">
              LensaDiri bukan diagnosis, bukan pengganti profesional, dan belum mengklaim validasi
              psikometrik formal.
            </p>
          </section>
        </div>
        <Link href="/modules" className={getButtonClassName("primary", "md") + " mt-8"}>
          Lihat katalog modul
        </Link>
      </article>
    </section>
  );
}
