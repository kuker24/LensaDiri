import Link from "next/link";
import { EvidenceBadge } from "@/components/evidence-badge";
import { HeroAmbient } from "@/components/hero-ambient";
import { ReflectionPass } from "@/components/reflection-pass";
import { getButtonClassName } from "@/components/ui/button";

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
      <section className="relative isolate overflow-hidden">
        <HeroAmbient />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -z-10 h-px bg-linear-to-r from-transparent via-white/20 to-transparent"
        />

        <div className="container-shell grid min-h-[calc(100svh-5.5rem)] gap-14 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="mono-label text-aperture">Refleksi modular · private by default</p>
            <h1 className="mt-8 max-w-4xl leading-[0.92] tracking-[-0.03em]">
              <span className="display-italic block text-[clamp(3rem,8vw,5.5rem)] text-[#f0f0f0]">
                Kenali pola{" "}
              </span>
              <span className="mt-2 block text-[clamp(2.25rem,5.5vw,4rem)] font-normal">
                dirimu lewat banyak lensa.
              </span>
            </h1>
            <p className="text-steel mt-8 max-w-xl text-lg leading-8 sm:text-xl sm:leading-9">
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
            <p className="text-steel mt-6 text-sm">
              Bukan diagnosis klinis dan bukan pengganti asesmen profesional.
            </p>
          </div>

          <ReflectionPass />
        </div>
      </section>

      <section className="container-shell section-band" id="cara-kerja">
        <p className="section-stamp max-w-full overflow-hidden">Cara melihat</p>
        <div className="mt-12 border-t border-white/12">
          {steps.map(([number, title, description]) => (
            <article
              className="grid gap-4 border-b border-white/12 py-8 sm:grid-cols-[4rem_0.7fr_1fr] sm:items-baseline sm:gap-8"
              key={number}
            >
              <p className="font-mono text-sm text-[#f0f0f0]/70 tabular-nums">{number}</p>
              <h2 className="text-xl font-normal tracking-[-0.02em] sm:text-2xl">{title}</h2>
              <p className="text-steel max-w-xl leading-7">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-band border-y border-white/10">
        <div className="container-shell">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mono-label text-aperture">Satu diri · lebih dari satu sudut</p>
              <h2 className="mt-5 text-4xl leading-[1.1] tracking-[-0.03em] sm:text-5xl">
                Tidak ada satu lensa yang harus menjelaskan semuanya.
              </h2>
            </div>
            <Link
              className="focus-ring text-aperture hover:text-ink inline-flex min-h-11 items-center rounded-md font-normal transition-colors"
              href="/modules"
            >
              Jelajahi semua lensa <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-14 flex flex-col border-t border-white/12">
            {lenses.map((lens, index) => (
              <article
                className="grid gap-5 border-b border-white/12 py-8 md:grid-cols-[3rem_0.8fr_1.2fr_auto] md:items-center md:gap-8"
                key={lens.title}
              >
                <span className="font-mono text-xs text-[#f0f0f0]/70 tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-2xl font-normal tracking-[-0.025em]">{lens.title}</h3>
                <p className="text-steel max-w-2xl leading-7">{lens.description}</p>
                <EvidenceBadge tier={lens.tier} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="container-shell section-band">
        <div className="grid overflow-hidden rounded-[1.2rem] border border-white/14 lg:grid-cols-[0.82fr_1.18fr]">
          <div className="violet-bloom flex min-h-72 flex-col justify-between p-8 text-white sm:p-10">
            <p className="mono-label">Privasi adalah struktur</p>
            <h2 className="max-w-lg text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Kamu memegang kontrol atas data dan hasilmu.
            </h2>
          </div>
          <div className="bg-surface p-8 sm:p-10">
            {trustPrinciples.map(([title, description]) => (
              <article
                className="grid gap-2 border-b border-white/12 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
                key={title}
              >
                <h3 className="mono-label text-[#f0f0f0]">{title}</h3>
                <p className="text-steel leading-7">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
