import Link from "next/link";

const articles = [
  {
    title: "Cara membaca confidence tanpa menganggapnya kepastian",
    summary: "Confidence menjelaskan coverage dan konsistensi respons, bukan validasi identitas.",
    href: "/blog/cara-membaca-confidence-tanpa-menganggapnya-kepastian",
  },
  {
    title: "Mengapa setiap lensa harus punya scoring independen",
    summary:
      "Modularitas yang jujur mencegah label dari satu modul diturunkan secara palsu ke modul lain.",
    href: "/blog/mengapa-setiap-lensa-harus-punya-scoring-independen",
  },
  {
    title: "Privasi hasil dan share yang dapat dicabut",
    summary: "Hasil tetap private sampai pengguna membuat link terbatas dengan masa berlaku.",
    href: "/blog/privasi-hasil-dan-share-yang-dapat-dicabut",
  },
];

export default function BlogPage() {
  return (
    <section className="container-shell py-16 sm:py-24">
      <header className="max-w-3xl">
        <p className="mono-label text-ink">Catatan / edukasi</p>
        <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
          Membaca hasil dengan lebih hati-hati
        </h1>
        <p className="text-ink-muted mt-5 leading-7">
          Materi singkat tentang metode, batas interpretasi, dan kontrol privasi LensaDiri.
        </p>
      </header>
      <ul className="border-line mt-12 border-t">
        {articles.map((article, index) => (
          <li
            className="border-line grid gap-5 border-b py-8 md:grid-cols-[3rem_0.9fr_1.1fr_auto] md:items-center md:gap-8"
            key={article.title}
          >
            <span className="text-ink-muted font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-ink text-xl font-medium tracking-[-0.02em]">{article.title}</h2>
            <p className="text-ink-muted leading-7">{article.summary}</p>
            <Link
              className="focus-ring text-aperture hover:text-ink inline-flex min-h-11 items-center rounded-md font-medium transition-colors"
              href={article.href}
            >
              Baca <span aria-hidden="true">↗</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
