import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disclaimer",
  description: "Batasan ilmiah, klinis, dan penggunaan hasil LensaDiri.",
};

export default function DisclaimerPage() {
  return (
    <article className="container-shell max-w-4xl py-16 lg:py-24">
      <p className="text-sm font-semibold tracking-[0.16em] text-violet-700 uppercase">
        Disclaimer
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Alat refleksi diri, bukan diagnosis atau keputusan profesional.
      </h1>
      <div className="mt-10 space-y-7 rounded-3xl border border-amber-200 bg-amber-50/80 p-7 text-amber-950 sm:p-10">
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
