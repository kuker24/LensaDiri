import Link from "next/link";

const articles = [
  {
    title: "Cara membaca confidence tanpa menganggapnya kepastian",
    summary: "Confidence menjelaskan coverage dan konsistensi respons, bukan validasi identitas.",
    href: "/method",
  },
  {
    title: "Mengapa setiap lensa harus punya scoring independen",
    summary: "Modularitas yang jujur mencegah label dari satu modul diturunkan secara palsu ke modul lain.",
    href: "/modules",
  },
  {
    title: "Privasi hasil dan share yang dapat dicabut",
    summary: "Hasil tetap private sampai pengguna membuat link terbatas dengan masa berlaku.",
    href: "/privacy",
  },
];

export default function BlogPage() {
  return (
    <main className="container-shell py-12 sm:py-18">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-violet-700">Blog dan edukasi</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight sm:text-5xl">Membaca hasil dengan lebih hati-hati</h1>
        <p className="mt-5 leading-7 text-[var(--muted)]">Materi singkat tentang metode, batas interpretasi, dan kontrol privasi LensaDiri.</p>
      </header>
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {articles.map((article) => (
          <li className="rounded-2xl border border-[var(--line)] bg-white p-6" key={article.title}>
            <h2 className="text-xl font-semibold">{article.title}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{article.summary}</p>
            <Link className="focus-ring mt-5 inline-flex rounded-md font-semibold text-violet-700" href={article.href}>Baca materi</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
