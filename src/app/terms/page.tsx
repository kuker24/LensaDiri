import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ketentuan Penggunaan",
  description: "Ketentuan dan pedoman penggunaan layanan refleksi LensaDiri.",
};

export default function TermsPage() {
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
            href="/privacy"
          >
            Kebijakan Privasi →
          </Link>
        </div>

        <article className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50/80 via-white to-white p-6 shadow-sm sm:p-10 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold tracking-wider text-blue-800 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span>Ketentuan Penggunaan</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Gunakan hasil sebagai{" "}
            <span
              style={{
                fontFamily: "var(--font-poly), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              bahan refleksi diri
            </span>
            .
          </h1>

          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Dengan mengakses dan menggunakan platform LensaDiri, kamu menyetujui prinsip-prinsip
            etis dan batasan penggunaan yang kami terapkan demi ruang refleksi yang aman dan saling
            menghargai.
          </p>

          <div className="mt-10 space-y-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs sm:p-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                1. Ruang Lingkup Layanan
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                LensaDiri menyediakan instrumen asesmen reflektif mandiri dan bukan layanan terapi
                medis, diagnosis klinis, rekrutmen pegawai, atau penentu nasib berisiko tinggi.
                Penggunaan hasil harus ditempatkan sebagai wawasan awal dialog dengan diri sendiri.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                2. Akun dan Keamanan Akses
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Pengguna bertanggung jawab menjaga kerahasiaan kredensial akun mereka. Sesi, tautan
                berbagi privat, dan ekspor hasil hanya boleh digunakan untuk data yang memang berhak
                kamu akses secara sah.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                3. Integritas Konten & Interpretasi
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Hasil asesmen menggambarkan kecenderungan respons pada saat pengisian. Jangan
                menggunakan satu hasil sebagai label permanen atau dasar tunggal untuk mengambil
                keputusan hidup yang krusial.
              </p>
            </section>

            <section className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
                4. Privasi dan Hak Penghapusan
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Hasil bersifat privat secara bawaan. Pengguna memiliki hak penuh untuk mengekspor
                data, mencabut izin tautan berbagi, serta menghapus rekaman jawaban atau akun kapan
                saja secara seketika tanpa arsip cadangan tersembunyi.
              </p>
            </section>
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <Link
              href="/privacy"
              className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
            >
              <span>Baca Kebijakan Privasi Lengkap →</span>
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
