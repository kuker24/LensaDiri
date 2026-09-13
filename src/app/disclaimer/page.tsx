import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Batasan Klinis & Penggunaan",
  description: "Batasan ilmiah, klinis, dan ruang lingkup penggunaan hasil LensaDiri.",
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white p-3 text-gray-900 selection:bg-blue-100 selection:text-blue-900 sm:p-4 md:p-6">
      <div className="mx-auto max-w-4xl py-6 sm:py-10">
        {/* Navigation Breadcrumb */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold text-gray-700 transition-[transform,background-color] duration-150 ease-out hover:bg-gray-100 hover:text-black active:scale-[0.97]"
            href="/"
          >
            <span>← Kembali ke Beranda</span>
          </Link>
          <Link
            className="inline-flex min-h-[44px] items-center px-2 text-xs font-semibold text-blue-600 hover:underline"
            href="/method"
          >
            Metodologi Sains →
          </Link>
        </div>

        <article className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50/80 via-white to-white p-6 shadow-sm sm:p-10 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-1 font-mono text-xs font-semibold tracking-wider text-amber-900 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span>Batasan Penggunaan & Sains</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Alat refleksi diri, bukan diagnosis atau{" "}
            <span
              style={{
                fontFamily: "var(--font-poly), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              keputusan profesional
            </span>
            .
          </h1>

          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            LensaDiri dirancang untuk membantu individu memahami spektrum kecenderungan diri secara
            mandiri, bukan sebagai pengganti layanan medis atau psikologis berlisensi.
          </p>

          <div className="mt-10 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs sm:p-8">
            <div className="flex items-start gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 font-mono text-xs font-bold text-amber-800">
                01
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bukan Diagnosis Medis atau Klinis
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  LensaDiri tidak mendiagnosis kondisi kesehatan mental, gangguan kepribadian,
                  kelainan neurodivergen, atau tingkat kecerdasan intelektual seseorang.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-100 pt-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-100 font-mono text-xs font-bold text-sky-800">
                02
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Bukan Alat Rekrutmen atau Seleksi Berisiko Tinggi
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Hasil refleksi ini tidak boleh digunakan sebagai penentu kelayakan tunggal untuk
                  penerimaan kerja, promosi jabatan, seleksi pendidikan formal, atau keputusan hukum
                  apa pun.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-100 pt-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 font-mono text-xs font-bold text-emerald-800">
                03
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Spektrum Respons Dinamis</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Hasil menggambarkan kecenderungan jawaban pada saat asesmen diisi. Spektrum
                  kepribadian manusia bersifat dinamis dan dapat berkembang seiring pengalaman hidup
                  dan kematangan emosi.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 border-t border-gray-100 pt-6">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 font-mono text-xs font-bold text-rose-800">
                04
              </span>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Kebutuhan Profesional</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                  Jika kamu sedang mengalami krisis emosional, tekanan psikologis berat, atau
                  membutuhkan bantuan mendalam, kami sangat menganjurkan untuk berkonsultasi
                  langsung dengan psikolog klinis atau psikiater berwenang.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Link
              href="/method"
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              <span>Pelajari Metodologi Sains Kami →</span>
            </Link>
            <Link
              href="/start"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-black px-6 py-2.5 text-xs font-semibold transition-[transform,background-color] duration-150 ease-out hover:bg-gray-800 active:scale-[0.97]"
            >
              Mulai Refleksi Mandiri
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
