import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kontak & Bantuan",
  description: "Pusat bantuan, dukungan produk, dan pelaporan teknis LensaDiri.",
};

export default function ContactPage() {
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
            href="/about"
          >
            Tentang LensaDiri →
          </Link>
        </div>

        <article className="rounded-3xl border border-gray-200 bg-gradient-to-b from-gray-50/80 via-white to-white p-6 shadow-sm sm:p-10 md:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 font-mono text-xs font-semibold tracking-wider text-blue-800 uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
            <span>Pusat Bantuan & Komunitas</span>
          </div>

          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Bantuan dan laporan{" "}
            <span
              style={{
                fontFamily: "var(--font-poly), Georgia, serif",
                fontStyle: "italic",
                fontWeight: 400,
              }}
            >
              keamanan
            </span>
            .
          </h1>

          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            Kami menjaga LensaDiri sebagai ruang terbuka yang aman. Gunakan kanal resmi untuk
            pertanyaan produk atau pelaporan teknis tanpa menyertakan kredensial atau data pribadi.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs sm:p-8">
              <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                Dukungan Produk
              </span>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Pertanyaan & Masukan</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Temukan kendala saat mengisi asesmen atau memiliki saran pengembangan fitur?
                Sampaikan langsung melalui repositori publik kami.
              </p>
              <div className="mt-6">
                <Link
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-semibold shadow-xs transition-[transform,background-color] duration-150 ease-out hover:bg-blue-700 active:scale-[0.97]"
                  href="https://github.com/kuker24/LensaDiri/issues/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Buat Laporan Produk</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs sm:p-8">
              <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
                Keamanan & Etika
              </span>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Laporan Kerentanan</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Demi keamanan bersama, jangan mempublikasikan detail eksploitasi di repositori
                publik. Harap hubungi tim teknis kami secara langsung.
              </p>
              <div className="mt-6">
                <a
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 shadow-2xs transition-[transform,background-color] duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                  href="mailto:security@lensadiri.com"
                >
                  <span>Email Tim Keamanan</span>
                  <span aria-hidden="true">✉</span>
                </a>
              </div>
            </section>

            {/*
              Spans both columns so the third card does not leave a dangling
              half-row on the small-screen two-up grid.
            */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-2xs sm:col-span-2 sm:p-8">
              <span className="inline-flex rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                Data Pribadi
              </span>
              <h2 className="mt-4 text-xl font-semibold text-gray-900">Permintaan Hapus Data</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Hasil asesmen dapat kamu hapus sendiri lewat tombol hapus di halaman hasil, tanpa
                perlu menghubungi siapa pun. Kanal ini khusus untuk data akun lama: LensaDiri sudah
                menutup pendaftaran, jadi jika kamu pernah membuat akun di versi sebelumnya dan
                ingin data itu dimusnahkan, kirim permintaan ke alamat di bawah. Jangan sertakan
                kata sandi.
              </p>
              <div className="mt-6">
                <a
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-xs font-semibold text-gray-800 shadow-2xs transition-[transform,background-color] duration-150 ease-out hover:bg-gray-50 active:scale-[0.97]"
                  href="mailto:security@lensadiri.com?subject=Permintaan%20hapus%20data%20akun"
                >
                  <span>Kirim Permintaan Hapus</span>
                  <span aria-hidden="true">✉</span>
                </a>
              </div>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
