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
      <section className="container-shell grid gap-12 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-5 inline-flex rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-semibold text-violet-700">
            Self-discovery yang jujur dan privacy-first
          </p>
          <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            Kenali pola dirimu lewat banyak lensa.
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-[var(--muted)] sm:text-xl">
            LensaDiri membantu kamu memahami gaya berpikir, motivasi, emosi, relasi, dan arah
            pengembangan diri tanpa mengubah hasil refleksi menjadi label mutlak.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              className="focus-ring rounded-2xl bg-[var(--brand)] px-6 py-4 text-center font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-[var(--brand-strong)]"
              href="/start"
            >
              Mulai eksplorasi
            </Link>
            <Link
              className="focus-ring rounded-2xl border border-[var(--line)] bg-white/70 px-6 py-4 text-center font-semibold transition hover:bg-white"
              href="/method"
            >
              Pelajari metode
            </Link>
          </div>
          <p className="mt-5 text-sm leading-6 text-[var(--muted)]">
            Bukan diagnosis klinis dan bukan pengganti asesmen profesional.
          </p>
        </div>

        <div className="glass-panel relative overflow-hidden rounded-[2rem] p-6 sm:p-8">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-300/30 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
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
                    <span className="tabular-nums text-[var(--muted)]">{value}</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-violet-100">
                    <div
                      aria-hidden="true"
                      className="h-full rounded-full bg-gradient-to-r from-violet-500 to-teal-400"
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-8 rounded-2xl bg-violet-50 p-4 text-sm leading-6 text-violet-950">
              Skor dibaca sebagai kecenderungan pada spektrum. Angka di atas hanya ilustrasi
              tampilan, bukan hasil asesmen pengguna.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-white/55 py-20" id="cara-kerja">
        <div className="container-shell">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
              Cara kerja
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Refleksi yang ringan, transparan, dan bisa ditindaklanjuti.
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              ["01", "Pilih kedalaman", "Mulai dari mode Quick atau Standard sesuai waktu dan kebutuhanmu."],
              ["02", "Jawab dengan tenang", "Progress tersimpan dan pertanyaan dirancang untuk nyaman di perangkat mobile."],
              ["03", "Baca sebagai pola", "Hasil menjelaskan kecenderungan, confidence, batasan, dan langkah pengembangan."],
            ].map(([number, title, description]) => (
              <article className="rounded-3xl border border-[var(--line)] bg-white p-6" key={number}>
                <p className="text-sm font-semibold text-violet-600">{number}</p>
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-[var(--muted)]">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-20 lg:py-28">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-violet-700">
              Banyak lensa, posisi bukti tetap jelas
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Pisahkan fondasi trait dari lensa reflektif.
            </h2>
          </div>
          <Link className="focus-ring font-semibold text-violet-700 hover:underline" href="/method">
            Baca metodologi lengkap
          </Link>
        </div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {lenses.map((lens) => (
            <article className="glass-panel rounded-3xl p-7" key={lens.title}>
              <EvidenceBadge tier={lens.tier} />
              <h3 className="mt-6 text-2xl font-semibold">{lens.title}</h3>
              <p className="mt-3 leading-7 text-[var(--muted)]">{lens.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-20 lg:pb-28">
        <div className="overflow-hidden rounded-[2rem] bg-[#17182c] px-6 py-10 text-white sm:px-10 lg:grid lg:grid-cols-[0.85fr_1.15fr] lg:gap-14 lg:px-14 lg:py-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-300">
              Trust by design
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              Kamu tetap memegang kontrol atas data dan hasilmu.
            </h2>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-0">
            {principles.map((principle) => (
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4 leading-6" key={principle}>
                {principle}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
