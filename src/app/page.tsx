import Link from "next/link";
import { EvidenceBadge } from "@/components/evidence-badge";
import { getButtonClassName } from "@/components/ui/button";

const sampleScores = [
  ["Keterbukaan", 82],
  ["Keteraturan", 64],
  ["Energi sosial", 43],
  ["Kooperasi", 76],
  ["Sensitivitas", 58],
] as const;

const lenses = [
  {
    title: "Trait Profile",
    tier: "A" as const,
    description: "Kecenderungan dibaca sebagai spektrum yang bisa berubah menurut konteks.",
  },
  {
    title: "16-Type Lens",
    tier: "B" as const,
    description: "Pola perhatian, keputusan, dan komunikasi sebagai bahasa refleksi.",
  },
  {
    title: "Motivation Lens",
    tier: "B" as const,
    description: "Dorongan, kebutuhan, dan respons yang sering muncul di balik tindakan.",
  },
];

const steps = [
  ["01", "Pilih kedalaman", "Mulai singkat atau susun beberapa lensa sesuai kebutuhanmu."],
  ["02", "Jawab apa adanya", "Progress tersimpan. Tidak ada jawaban yang perlu terlihat sempurna."],
  ["03", "Baca sebagai pola", "Lihat kecenderungan, confidence, batasan, dan ruang pengembangan."],
] as const;

const trustPrinciples = [
  ["Private", "Hasil tetap privat sampai kamu memilih untuk membagikannya."],
  ["Deterministik", "Scoring primer berjalan di server, bukan dibuat oleh AI."],
  ["Terbatas", "Evidence tier dan keterbatasan hasil selalu terlihat."],
  ["Terkendali", "Kamu dapat membagikan, mencabut, mengekspor, atau menghapus hasil."],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden border-b border-white/10">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_25%_22%,rgba(175,80,255,0.2),transparent_25rem),radial-gradient(circle_at_72%_20%,rgba(225,189,255,0.07),transparent_22rem),linear-gradient(145deg,#090909_15%,#121016_58%,#090909)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -z-10 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="container-shell grid min-h-[calc(100svh-7.75rem)] gap-14 py-16 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:py-20">
          <div className="max-w-3xl">
            <p className="mono-label text-aperture">Refleksi modular / private by default</p>
            <h1 className="mt-7 text-[clamp(3rem,7vw,6rem)] leading-[0.94] tracking-[-0.04em]">
              Kenali pola dirimu
              <span className="display-italic text-aperture mt-2 block">lewat banyak lensa.</span>
            </h1>
            <p className="text-ink-muted mt-8 max-w-2xl text-lg leading-8 sm:text-xl">
              Ruang refleksi terstruktur untuk memahami cara berpikir, merasa, berelasi, dan
              bertumbuh. Tanpa mengubah hasil menjadi label mutlak.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link className={getButtonClassName("primary", "md")} href="/start">
                Mulai eksplorasi
                <span aria-hidden="true">↗</span>
              </Link>
              <Link className={getButtonClassName("secondary", "md")} href="/method">
                Pelajari metode
              </Link>
            </div>
            <p className="text-ink-muted mt-6 text-sm">
              Bukan diagnosis klinis dan bukan pengganti asesmen profesional.
            </p>
          </div>

          <aside
            aria-label="Ilustrasi cara membaca hasil"
            className="lens-glow bg-surface/70 relative overflow-hidden rounded-[1.2rem] border border-white/18 p-6 sm:p-8"
          >
            <div className="border-line flex items-center justify-between gap-4 border-b pb-5">
              <div>
                <p className="mono-label text-ink-muted">Peta refleksi</p>
                <p className="mt-2 text-lg font-medium tracking-[-0.02em]">Contoh spektrum</p>
              </div>
              <span className="border-lens/40 bg-lens-soft text-aperture rounded-full border px-3 py-1 font-mono text-xs">
                ilustrasi
              </span>
            </div>

            <div className="mt-7 space-y-5">
              {sampleScores.map(([label, value]) => (
                <div key={label}>
                  <div className="mb-2.5 flex items-center justify-between gap-4 text-sm">
                    <span>{label}</span>
                    <span className="text-ink-muted font-mono text-xs tabular-nums">{value}</span>
                  </div>
                  <div className="bg-line h-px overflow-visible">
                    <div className="bg-lens relative h-px" style={{ width: `${value}%` }}>
                      <span className="bg-lens absolute top-1/2 right-0 h-2 w-2 -translate-y-1/2 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-line mt-8 grid grid-cols-2 gap-4 border-t pt-5 text-sm">
              <div>
                <p className="text-ink-muted text-xs">Cara baca</p>
                <p className="mt-1">Spektrum, bukan kotak</p>
              </div>
              <div>
                <p className="text-ink-muted text-xs">Kontrol</p>
                <p className="mt-1">Private sampai dibagikan</p>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <section className="container-shell py-24 sm:py-28" id="cara-kerja">
        <p className="section-stamp max-w-full overflow-hidden">Cara melihat diri</p>
        <div className="border-line mt-12 border-t">
          {steps.map(([number, title, description]) => (
            <article
              className="border-line grid gap-4 border-b py-7 sm:grid-cols-[4rem_0.7fr_1fr] sm:items-baseline sm:gap-8"
              key={number}
            >
              <p className="text-lens font-mono text-sm tabular-nums">{number}</p>
              <h2 className="text-xl font-medium tracking-[-0.02em] sm:text-2xl">{title}</h2>
              <p className="text-ink-muted max-w-xl leading-7">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 py-24 sm:py-28">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mono-label text-aperture">Satu diri / lebih dari satu sudut</p>
              <h2 className="mt-5 text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
                Tidak ada satu lensa yang harus menjelaskan semuanya.
              </h2>
            </div>
            <Link
              className="focus-ring text-aperture hover:text-ink inline-flex min-h-11 items-center rounded-md font-medium transition-colors"
              href="/modules"
            >
              Jelajahi semua lensa <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-14 flex flex-col">
            {lenses.map((lens, index) => (
              <article
                className="border-line grid gap-5 border-t py-8 md:grid-cols-[3rem_0.8fr_1.2fr_auto] md:items-center md:gap-8"
                key={lens.title}
              >
                <span className="text-ink-muted font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-medium tracking-[-0.025em]">{lens.title}</h3>
                <p className="text-ink-muted max-w-2xl leading-7">{lens.description}</p>
                <EvidenceBadge tier={lens.tier} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell py-24 sm:py-28">
        <div className="grid overflow-hidden rounded-[1.2rem] border border-white/14 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="violet-bloom flex min-h-72 flex-col justify-between p-7 text-white sm:p-10">
            <p className="font-mono text-xs tracking-[0.16em] uppercase">Privasi adalah struktur</p>
            <h2 className="max-w-lg text-4xl leading-tight tracking-[-0.035em] sm:text-5xl">
              Kamu memegang kontrol atas data dan hasilmu.
            </h2>
          </div>
          <div className="bg-surface p-7 sm:p-10">
            {trustPrinciples.map(([title, description]) => (
              <article
                className="border-line grid gap-2 border-b py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
                key={title}
              >
                <h3 className="font-mono text-xs tracking-[0.08em] uppercase">{title}</h3>
                <p className="text-ink-muted leading-7">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
