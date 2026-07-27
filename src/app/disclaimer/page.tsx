import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Batasan ilmiah, klinis, dan penggunaan hasil LensaDiri.",
};

export default function DisclaimerPage() {
  return (
    <article className="prose-shell py-16 sm:py-24">
      <p className="mono-label text-ink">Batas penggunaan</p>
      <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
        Alat refleksi diri, bukan diagnosis atau keputusan profesional.
      </h1>
      <div className="border-aperture/25 bg-aperture-soft text-ink mt-12 space-y-7 rounded-[16px] border p-7 sm:p-10">
        <p className="leading-7">
          LensaDiri tidak mendiagnosis kondisi kesehatan mental, gangguan kepribadian, kemampuan
          intelektual, atau kelayakan seseorang untuk pekerjaan, pendidikan, maupun hubungan.
        </p>
        <p className="leading-7">
          Hasil menggambarkan pola respons pada saat asesmen dan dapat berubah karena konteks,
          pengalaman, pemahaman item, serta kualitas jawaban. Hasil perlu dibaca sebagai gambaran,
          bukan batasan identitas.
        </p>
        <p className="leading-7">
          Untuk kebutuhan klinis, hukum, pendidikan formal, atau keputusan berisiko tinggi, gunakan
          layanan dan instrumen yang sesuai di bawah tenaga profesional yang berwenang.
        </p>
      </div>
    </article>
  );
}
