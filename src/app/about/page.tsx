import Link from "next/link";
import { getButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export default function AboutPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <article className="max-w-4xl">
        <h1 className="tracking-[-0.035em]">
          <span className="mono-label text-ink mb-5 block">Tentang LensaDiri</span>
          <span className="text-ink block text-4xl font-normal sm:text-6xl">
            Refleksi berlapis,
            <span className="text-ink-muted mt-2 block font-normal">tanpa label mutlak.</span>
          </span>
        </h1>
        <p className="text-ink-muted mt-6 max-w-3xl text-lg leading-8">
          LensaDiri membantu kamu melihat pola berpikir, merasa, dan berelasi dari beberapa sudut.
          Setiap lensa dibaca terpisah, lalu hasilnya dapat dibandingkan tanpa mengubah skor asli.
        </p>
        <div className="mt-14 grid gap-10 md:grid-cols-2 md:gap-14">
          <section>
            <h2 className="text-ink text-xl font-normal tracking-[-0.02em]">Yang kamu dapatkan</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Asesmen reflektif, tingkat keyakinan hasil, catatan kualitas, pertanyaan penjelas,
              serta kontrol atas data pribadi.
            </p>
          </section>
          <section>
            <h2 className="text-ink text-xl font-normal tracking-[-0.02em]">Batas penggunaan</h2>
            <p className="text-ink-muted mt-3 leading-7">
              Hasil bukan diagnosis, bukan pengganti tenaga profesional, dan belum memiliki validasi
              psikometrik formal.
            </p>
          </section>
        </div>
        <div className="mt-10">
          <Link href="/modules" className={cn(getButtonClassName("primary", "md"), "inline-flex")}>
            Lihat katalog lensa <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </article>
    </section>
  );
}
