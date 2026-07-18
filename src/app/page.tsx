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
          <p className="mb-5 inline-flex rounded-full border border-lens-soft bg-white/70 px-4 py-2 text-sm font-semibold text-lens">
            Self-discovery yang jujur dan privacy-first
          </p>
          <h1 className="font-display max-w-3xl text-5xl font-semibold tracking-[-0.025em] text-balance sm:text-6xl lg:text-7xl">
            Kenali pola dirimu lewat banyak lensa.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-pretty text-ink-muted sm:text-xl">
            LensaDiri membantu kamu memahami gaya berpikir, motivasi, emosi, relasi, dan arah
            pengembangan diri tanpa mengubah hasil refleksi menjadi label mutlak.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="focus-ring rounded-sm bg-lens px-6 py-4 text-center font-semibold text-canvas shadow-surface transition-colors duration-150 ease-out hover:bg-lens-strong"
              href="/start"
            >
              Mulai eksplorasi
            </Link>
            <Link
              className="focus-ring rounded-sm border border-line bg-white/70 px-6 py-4 text-center font-semibold text-ink transition-colors duration-150 ease-out hover:bg-white"
              href="/method"
            >
              Pelajari metode
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-ink-muted">
            Bukan diagnosis klinis dan bukan pengganti asesmen profesional.
          </p>
        </div>

        <div className="lens-glow relative overflow-hidden rounded-lg border border-line bg-white/70 p-6 shadow-surface sm:p-8">
          <div className="relative">
            <p className="text-sm font-semibold tracking-[0.14em] text-lens uppercase">
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
                    <span className="tabular-nums text-ink-muted">{value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-lens"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 rounded-md border border-lens-soft bg-lens-soft/50 p-4 text-sm leading-6 text-lens-strong">
              Skor dibaca sebagai kecenderungan pada spektrum. Angka di atas hanya ilustrasi
              tampilan, bukan hasil asesmen pengguna.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-white/55 py-20" id="cara-kerja">
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-lens uppercase">
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
              <article className="rounded-lg border border-line bg-white p-6" key={number}>
                <p className="tabular-nums text-sm font-semibold text-lens">{number}</p>
                <h3 className="font-display mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-ink-muted">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-[0.14em] text-lens uppercase">
              Banyak lensa, posisi bukti tetap jelas
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pisahkan fondasi trait dari lensa reflektif.
            </h2>
          </div>
          <Link className="focus-ring font-semibold text-lens hover:underline" href="/method">
            Baca metodologi lengkap
          </Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {lenses.map((lens) => (
            <article className="rounded-lg border border-line bg-white/70 p-7 shadow-surface" key={lens.title}>
              <EvidenceBadge tier={lens.tier} />
              <h3 className="font-display mt-6 text-2xl font-semibold">{lens.title}</h3>
              <p className="mt-3 leading-7 text-ink-muted">{lens.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-20 lg:pb-28">
        <div className="overflow-hidden rounded-lg bg-ink px-6 py-10 text-canvas sm:px-10 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-14 lg:py-14">
          <div>
            <p className="text-sm font-semibold tracking-[0.14em] text-aperture uppercase">
              Trust by design
            </p>
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Kamu tetap memegang kontrol atas data dan hasilmu.
            </h2>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            {principles.map((principle) => (
              <li className="rounded-md border border-white/10 bg-white/5 p-4 leading-6" key={principle}>
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
