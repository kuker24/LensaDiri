import type { Metadata } from "next";
import { EvidenceBadge } from "@/components/evidence-badge";

export const metadata: Metadata = {
  title: "Metode",
  description: "Cara LensaDiri memisahkan fondasi trait, lensa reflektif, dan batasan ilmiah.",
};

const tiers = [
  {
    tier: "A" as const,
    title: "Evidence-oriented trait layer",
    body: "Fondasi dimensional yang dibaca sebagai spektrum. Scoring harus deterministik, versioned, repeatable, dan dapat diaudit.",
  },
  {
    tier: "B" as const,
    title: "Question-based reflective layer",
    body: "Kerangka tipe dan motivasi untuk membantu refleksi. Hasilnya bukan identitas mutlak atau keputusan profesional.",
  },
  {
    tier: "C" as const,
    title: "Cultural or symbolic layer",
    body: "Konten ringan yang harus dipisahkan secara visual dan tidak boleh diberi klaim biologis, medis, atau psikometrik.",
  },
];

export default function MethodPage() {
  return (
    <section className="container-shell py-16 lg:py-24">
      <div className="max-w-3xl">
        <p className="text-lens text-sm font-semibold tracking-[0.14em] uppercase">Metode</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
          Jujur tentang apa yang diukur dan apa yang tidak.
        </h1>
        <p className="text-ink-muted mt-6 text-lg leading-8">
          LensaDiri memisahkan skor trait, overlay reflektif, dan konten simbolik agar pengguna
          tidak menerima semua lensa sebagai bukti dengan tingkat kekuatan yang sama.
        </p>
      </div>

      <div className="mt-12 grid gap-5 lg:grid-cols-3">
        {tiers.map((item) => (
          <article className="border-line rounded-md border bg-white/90 p-7" key={item.tier}>
            <div className="mb-4">
              <EvidenceBadge tier={item.tier} />
            </div>
            <h2 className="mt-6 text-xl font-semibold">{item.title}</h2>
            <p className="text-ink-muted mt-3 leading-7">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <article className="border-line rounded-md border bg-white/90 p-7">
          <h2 className="text-ink text-2xl font-semibold">Aturan scoring</h2>
          <ul className="text-ink-muted mt-5 space-y-3 leading-7">
            <li>Client hanya mengirim jawaban mentah, bukan skor final.</li>
            <li>Reverse coding dan normalisasi memakai fungsi deterministik.</li>
            <li>Setiap hasil terikat pada versi modul dan versi scoring.</li>
            <li>AI hanya boleh menjelaskan skor yang sudah ada, bukan menghitungnya.</li>
          </ul>
        </article>
        <article className="border-line rounded-md border bg-white/90 p-7">
          <h2 className="text-ink text-2xl font-semibold">Batasan penting</h2>
          <ul className="text-ink-muted mt-5 space-y-3 leading-7">
            <li>Hasil tidak boleh diposisikan sebagai diagnosis klinis.</li>
            <li>Hasil tidak boleh menjadi satu-satunya dasar rekrutmen atau pendidikan.</li>
            <li>Confidence rendah harus dijelaskan, bukan disembunyikan.</li>
            <li>Klaim publik hanya boleh meningkat setelah validasi formal memadai.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
