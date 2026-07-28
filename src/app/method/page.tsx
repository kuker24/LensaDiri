import type { Metadata } from "next";
import { EvidenceBadge } from "@/components/evidence-badge";

export const metadata: Metadata = {
  title: "Metode",
  description: "Cara LensaDiri memisahkan fondasi trait, lensa reflektif, dan batasan ilmiah.",
};

const tiers = [
  {
    tier: "A" as const,
    title: "Lapisan trait berorientasi bukti",
    body: "Fondasi dimensional yang dibaca sebagai spektrum. Penilaian konsisten, berversi, dapat diulang, dan diaudit.",
  },
  {
    tier: "B" as const,
    title: "Lapisan reflektif berbasis pertanyaan",
    body: "Kerangka tipe dan motivasi untuk membantu refleksi. Hasilnya bukan identitas mutlak atau keputusan profesional.",
  },
  {
    tier: "C" as const,
    title: "Lapisan kultural atau simbolik",
    body: "Konten ringan yang dipisahkan secara visual dan tidak boleh diberi klaim biologis, medis, atau psikometrik.",
  },
];

export default function MethodPage() {
  return (
    <section className="task-shell">
      <div className="max-w-3xl">
        <p className="mono-label text-ink">Metode · batas bukti</p>
        <h1 className="mt-5 text-4xl font-normal tracking-[-0.03em] sm:text-5xl">
          Jujur tentang apa yang diukur dan apa yang tidak.
        </h1>
        <p className="text-ink-muted mt-6 text-lg leading-8">
          Trait, lensa reflektif, dan konten simbolik dipisah — tidak semua lensa punya kekuatan
          bukti yang sama.
        </p>
      </div>

      <div className="mt-14 grid gap-10 border-t border-white/12 pt-10 lg:grid-cols-3 lg:gap-14">
        {tiers.map((item) => (
          <article className="py-1" key={item.tier}>
            <div className="mb-4">
              <EvidenceBadge tier={item.tier} />
            </div>
            <h2 className="mt-6 text-xl font-normal tracking-[-0.02em]">{item.title}</h2>
            <p className="text-steel mt-3 leading-7">{item.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 grid gap-12 border-t border-white/12 pt-10 lg:grid-cols-2 lg:gap-16">
        <article>
          <h2 className="text-2xl font-normal tracking-[-0.02em]">Aturan penilaian</h2>
          <ul className="text-steel mt-5 space-y-3 leading-7">
            <li>Peramban hanya mengirim jawaban mentah, bukan skor akhir.</li>
            <li>Pembalikan skor dan normalisasi memakai fungsi yang konsisten.</li>
            <li>Setiap hasil terikat pada versi lensa dan versi penilaian.</li>
            <li>AI hanya boleh menjelaskan skor yang sudah ada, bukan menghitungnya.</li>
          </ul>
        </article>
        <article>
          <h2 className="text-2xl font-normal tracking-[-0.02em]">Batasan penting</h2>
          <ul className="text-steel mt-5 space-y-3 leading-7">
            <li>Hasil tidak boleh diposisikan sebagai diagnosis klinis.</li>
            <li>Hasil tidak boleh menjadi satu-satunya dasar rekrutmen atau pendidikan.</li>
            <li>Tingkat keyakinan rendah harus dijelaskan, bukan disembunyikan.</li>
            <li>Klaim publik hanya boleh meningkat setelah validasi formal memadai.</li>
          </ul>
        </article>
      </div>
    </section>
  );
}
