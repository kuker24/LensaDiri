import { notFound } from "next/navigation";
import Link from "next/link";

const knownSlugs = new Set([
  "cara-membaca-confidence-tanpa-menganggapnya-kepastian",
  "mengapa-setiap-lensa-harus-punya-scoring-independen",
  "privasi-hasil-dan-share-yang-dapat-dicabut",
]);

const articles: Record<string, { title: string; content: string[] }> = {
  "cara-membaca-confidence-tanpa-menganggapnya-kepastian": {
    title: "Cara membaca confidence tanpa menganggapnya kepastian",
    content: [
      "Confidence menjelaskan coverage dan konsistensi respons, bukan validasi identitas.",
      "Skor confidence tinggi berarti modul memiliki cukup coverage dimensi dan respons konsisten, bukan bahwa hasil tersebut pasti benar.",
      "Gunakan confidence sebagai petunjuk seberapa stabil skormu, bukan sebagai ukuran kebenaran absolut.",
    ],
  },
  "mengapa-setiap-lensa-harus-punya-scoring-independen": {
    title: "Mengapa setiap lensa harus punya scoring independen",
    content: [
      "Modularitas yang jujur mencegah label dari satu modul diturunkan secara palsu ke modul lain.",
      "Setiap lensa memiliki scoring engine, item bank, dan report template yang terpisah.",
      "Dengan demikian, hasil Enneagram tidak memengaruhi hasil Temperament, dan sebaliknya.",
    ],
  },
  "privasi-hasil-dan-share-yang-dapat-dicabut": {
    title: "Privasi hasil dan share yang dapat dicabut",
    content: [
      "Hasil tetap private sampai pengguna membuat link terbatas dengan masa berlaku.",
      "Token share dapat dicabut sewaktu-waktu, dan setiap pencabutan langsung menonaktifkan akses.",
      "Data mentah tidak pernah diekspos melalui link berbagi.",
    ],
  },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article || !knownSlugs.has(slug)) notFound();

  return (
    <article className="prose-shell py-16 sm:py-24">
      <Link
        className="focus-ring text-ink-muted hover:text-ink inline-flex min-h-11 items-center rounded-md text-sm transition-colors"
        href="/blog"
      >
        ← Kembali ke catatan
      </Link>
      <p className="mono-label text-ink mt-10">Catatan LensaDiri</p>
      <h1 className="mt-5 text-4xl leading-tight font-medium tracking-[-0.035em] sm:text-6xl">
        {article.title}
      </h1>
      <div className="border-line mt-12 border-t pt-4">
        {article.content.map((paragraph, index) => (
          <p className="text-ink-muted mt-6 leading-8" key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
