import Link from "next/link";
import { EvidenceBadge } from "@/components/evidence-badge";

const lenses = [
  {
    title: "Trait Profile",
    tier: "A" as const,
    description: "Melihat kecenderungan sebagai spektrum, bukan kotak identitas yang kaku.",
  },
  {
    title: "16-Type Lens",
    tier: "B" as const,
    description: "Lensa reflektif untuk memahami pola perhatian, keputusan, dan komunikasi.",
  },
  {
    title: "Motivation Lens",
    tier: "B" as const,
    description: "Mengeksplorasi kebutuhan, dorongan, dan pola respons yang sering muncul.",
  },
];

const principles = [
  "Hasil private secara default",
  "Scoring primer deterministik di server",
  "Bahasa hangat tanpa menghakimi",
  "Evidence tier ditampilkan dengan jujur",
];

export default function HomePage() {
  return (
    <>
      <section className="container-shell grid gap-12 pt-16 pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24 lg:pb-28">
        <div>
          <p className="border-lens-soft text-lens mb-5 inline-flex rounded-full border bg-white/70 px-4 py-2 text-sm font-semibold">
            Self-discovery yang jujur dan privacy-first
          </p>
          <h1 className="font-display max-w-3xl text-5xl font-semibold tracking-[-0.025em] text-balance sm:text-6xl lg:text-7xl">
            Kenali pola dirimu lewat banyak lensa.
          </h1>
          <p className="text-ink-muted mt-6 max-w-2xl text-lg leading-8 text-pretty sm:text-xl">
            LensaDiri membantu kamu memahami gaya berpikir, motivasi, emosi, relasi, dan arah
            pengembangan diri tanpa mengubah hasil refleksi menjadi label mutlak.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="focus-ring bg-lens text-canvas shadow-surface hover:bg-lens-strong rounded-sm px-6 py-4 text-center font-semibold transition-colors duration-150 ease-out"
              href="/start"
            >
              Mulai eksplorasi
            </Link>
            <Link
              className="focus-ring border-line text-ink rounded-sm border bg-white/70 px-6 py-4 text-center font-semibold transition-colors duration-150 ease-out hover:bg-white"
              href="/method"
            >
              Pelajari metode
            </Link>
          </div>
          <p className="text-ink-muted mt-5 text-sm leading-6">
            Bukan diagnosis klinis dan bukan pengganti asesmen profesional.
          </p>
        </div>

        <div className="lens-glow border-line shadow-surface relative overflow-hidden rounded-lg border bg-white/70 p-6 sm:p-8">
          <div className="relative">
            <p className="text-lens text-sm font-semibold tracking-[0.14em] uppercase">
              Contoh cara membaca hasil
            </p>
            <div className="mt-8 space-y-6">
              {[
                ["Keterbukaan pada pengalaman", 82],
                ["Keteraturan dan konsistensi", 64],
                ["Energi sosial", 43],
                ["Kooperasi", 76],
                ["Sensitivitas emosional", 58],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-ink-muted tabular-nums">{value}</span>
                  </div>
                  <div className="bg-line h-1.5 overflow-hidden rounded-full">
                    <div
                      aria-hidden="true"
                      className="bg-lens h-full rounded-full"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="border-lens-soft bg-lens-soft/50 text-lens-strong mt-8 rounded-md border p-4 text-sm leading-6">
              Skor dibaca sebagai kecenderungan pada spektrum. Angka di atas hanya ilustrasi
              tampilan, bukan hasil asesmen pengguna.
            </p>
          </div>
        </div>
      </section>

      <section className="border-line border-y bg-white/55 py-20" id="cara-kerja">
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="text-lens text-sm font-semibold tracking-[0.14em] uppercase">
              Cara kerja
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Refleksi yang ringan, transparan, dan bisa ditindaklanjuti.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              [
                "01",
                "Pilih kedalaman",
                "Mulai dari mode Quick atau Standard sesuai waktu dan kebutuhanmu.",
              ],
              [
                "02",
                "Jawab dengan tenang",
                "Progress tersimpan dan pertanyaan dirancang untuk nyaman di perangkat mobile.",
              ],
              [
                "03",
                "Baca sebagai pola",
                "Hasil menjelaskan kecenderungan, confidence, batasan, dan langkah pengembangan.",
              ],
            ].map(([number, title, description]) => (
              <article className="border-line rounded-lg border bg-white p-6" key={number}>
                <p className="text-lens text-sm font-semibold tabular-nums">{number}</p>
                <h3 className="font-display mt-5 text-xl font-semibold">{title}</h3>
                <p className="text-ink-muted mt-3 leading-7">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-lens text-sm font-semibold tracking-[0.14em] uppercase">
              Banyak lensa, posisi bukti tetap jelas
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pisahkan fondasi trait dari lensa reflektif.
            </h2>
          </div>
          <Link className="focus-ring text-lens font-semibold hover:underline" href="/method">
            Baca metodologi lengkap
          </Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {lenses.map((lens) => (
            <article
              className="border-line shadow-surface rounded-lg border bg-white/70 p-7"
              key={lens.title}
            >
              <EvidenceBadge tier={lens.tier} />
              <h3 className="font-display mt-6 text-2xl font-semibold">{lens.title}</h3>
              <p className="text-ink-muted mt-3 leading-7">{lens.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-20 lg:pb-28">
        <div className="bg-ink text-canvas overflow-hidden rounded-lg px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-14 lg:py-14">
          <div>
            <p className="text-aperture text-sm font-semibold tracking-[0.14em] uppercase">
              Trust by design
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Kamu tetap memegang kontrol atas data dan hasilmu.
            </h2>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            {principles.map((principle) => (
              <li
                className="rounded-md border border-white/10 bg-white/5 p-4 leading-6"
                key={principle}
              >
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
