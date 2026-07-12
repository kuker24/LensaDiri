import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mulai Eksplorasi",
  description: "Pilih kedalaman eksplorasi kepribadian di LensaDiri.",
  robots: { index: false, follow: false },
};

const modes = [
  {
    name: "Quick",
    duration: "5 sampai 8 menit",
    items: "36 sampai 48 item",
    description: "Onboarding ringan dengan hasil ringkas dan confidence yang dijelaskan.",
  },
  {
    name: "Standard",
    duration: "10 sampai 15 menit",
    items: "60 sampai 90 item",
    description: "Profil lebih lengkap dengan trait, overlay, dan arah pengembangan.",
  },
];

export default function StartPage() {
  return (
    <section className="container-shell py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
          Mulai eksplorasi
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih kedalaman yang nyaman untukmu.
        </h1>
        <p className="mt-6 text-lg leading-8 text-[var(--muted)]">
          Assessment runner sedang dibangun pada fase berikutnya. Spesifikasi mode ditampilkan
          sekarang agar alur produk dapat ditinjau tanpa mengumpulkan data pengguna sebelum fondasi
          privasi dan penyimpanan siap.
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
        {modes.map((mode) => (
          <article className="glass-panel rounded-3xl p-7 text-left" key={mode.name}>
            <div className="flex items-start justify-between gap-5">
              <h2 className="text-2xl font-semibold">{mode.name}</h2>
              <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                Segera tersedia
              </span>
            </div>
            <p className="mt-4 leading-7 text-[var(--muted)]">{mode.description}</p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-[var(--line)] pt-5 text-sm">
              <div>
                <dt className="text-[var(--muted)]">Estimasi</dt>
                <dd className="mt-1 font-semibold">{mode.duration}</dd>
              </div>
              <div>
                <dt className="text-[var(--muted)]">Jumlah</dt>
                <dd className="mt-1 font-semibold">{mode.items}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-[var(--line)] bg-white p-5 text-center text-sm leading-6 text-[var(--muted)]">
        Sambil menunggu assessment aktif, baca cara kerja evidence tier dan batasan hasil di halaman{" "}
        <Link className="focus-ring font-semibold text-violet-700 hover:underline" href="/method">
          metode
        </Link>
        .
      </div>
    </section>
  );
}
