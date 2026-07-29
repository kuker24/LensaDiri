import { notFound } from "next/navigation";
import Link from "next/link";

const knownSlugs = new Set([
  "cara-membaca-confidence-tanpa-menganggapnya-kepastian",
  "mengapa-setiap-lensa-harus-punya-scoring-independen",
  "privasi-hasil-dan-share-yang-dapat-dicabut",
]);

const articles: Record<string, { title: string; content: string[] }> = {
  "cara-membaca-confidence-tanpa-menganggapnya-kepastian": {
    title: "Cara membaca tingkat keyakinan tanpa menganggapnya kepastian",
    content: [
      "Tingkat keyakinan menjelaskan cakupan dan konsistensi respons, bukan validasi identitas.",
      "Tingkat yang tinggi berarti lensa memiliki cakupan dimensi yang cukup dan respons yang konsisten, bukan bahwa hasil tersebut pasti benar.",
      "Gunakan tingkat keyakinan sebagai petunjuk kestabilan skor, bukan ukuran kebenaran mutlak.",
    ],
  },
  "mengapa-setiap-lensa-harus-punya-scoring-independen": {
    title: "Mengapa setiap lensa perlu dinilai secara terpisah",
    content: [
      "Modularitas yang jujur mencegah label dari satu modul diturunkan secara palsu ke modul lain.",
      "Setiap lensa memiliki cara penilaian, bank pertanyaan, dan templat laporan yang terpisah.",
      "Dengan demikian, hasil Enneagram tidak memengaruhi hasil Temperamen, dan sebaliknya.",
    ],
  },
  "privasi-hasil-dan-share-yang-dapat-dicabut": {
    title: "Privasi hasil dan tautan berbagi yang dapat dicabut",
    content: [
      "Hasil tetap privat sampai pengguna membuat tautan berbagi dengan masa berlaku.",
      "Tautan berbagi dapat dicabut sewaktu-waktu, dan setiap pencabutan langsung menonaktifkan akses.",
      "Data mentah tidak pernah ditampilkan melalui tautan berbagi.",
    ],
  },
};

export const dynamicParams = false;

export function generateStaticParams() {
  return [...knownSlugs].map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article || !knownSlugs.has(slug)) notFound();

  return (
    <article className="prose-shell py-16 sm:py-24">
      <Link
        className="focus-ring ui-transition text-ink-muted hover:text-ink inline-flex min-h-11 items-center rounded-[12px] text-sm font-medium tracking-[-0.01em]"
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
