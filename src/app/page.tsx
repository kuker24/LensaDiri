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
] as const;

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
      <section className="film-strip">
        <HeroAmbient />
        <div className="container-shell grid min-h-[calc(100svh-3.5rem)] gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="mono-label text-ink">Refleksi modular · private by default</p>
            <h1 className="display-stack text-ink mt-8 max-w-4xl">
              <span className="display-underline block text-[clamp(2.75rem,9vw,5rem)]">
                Kenali pola
              </span>
              <span className="display-underline mt-3 block text-[clamp(2.75rem,9vw,5rem)]">
                dirimu
              </span>
              <span className="text-ink/90 mt-4 block max-w-xl text-[clamp(1.15rem,2.4vw,1.5rem)] leading-[1.15] font-normal tracking-[-0.02em]">
                lewat banyak lensa.
              </span>
            </h1>
            <p className="text-ink-muted mt-8 max-w-xl text-base leading-7 sm:text-lg sm:leading-8">
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

          <ReflectionPass />
        </div>
      </section>

      <section className="film-strip" id="cara-kerja" style={{ minHeight: "auto" }}>
        <div
          aria-hidden="true"
          className="film-strip-media"
          style={{ backgroundImage: "url(/media/design2/strip-ice-chamber.jpg)" }}
        />
        <div className="film-strip-scrim" />
        <div className="container-shell section-band">
          <p className="section-stamp text-ink max-w-full overflow-hidden">Cara melihat</p>
          <div className="mt-12 border-t border-white/20">
            {steps.map(([number, title, description]) => (
              <article
                className="grid gap-4 border-b border-white/15 py-8 sm:grid-cols-[4rem_0.7fr_1fr] sm:items-baseline sm:gap-8"
                key={number}
              >
                <p className="text-ink/70 font-mono text-sm tabular-nums">{number}</p>
                <h2 className="text-ink text-xl font-normal tracking-[-0.02em] sm:text-2xl">
                  {title}
                </h2>
                <p className="text-ink-muted max-w-xl leading-7">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="film-strip" style={{ minHeight: "auto" }}>
        <div
          aria-hidden="true"
          className="film-strip-media"
          style={{ backgroundImage: "url(/media/design2/strip-dune-glass.jpg)" }}
        />
        <div className="film-strip-scrim" />
        <div className="container-shell section-band">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <p className="mono-label text-ink">Satu diri · lebih dari satu sudut</p>
              <h2 className="text-ink mt-5 text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Tidak ada satu lensa yang harus menjelaskan semuanya.
              </h2>
            </div>
            <Link
              className="focus-ring text-ink hover:text-ink-muted inline-flex min-h-11 items-center rounded-[2px] font-mono text-xs tracking-[-0.02em] uppercase transition-colors"
              href="/modules"
            >
              Jelajahi semua lensa <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="mt-14 flex flex-col border-t border-white/20">
            {lenses.map((lens, index) => (
              <article
                className="grid gap-5 border-b border-white/15 py-8 md:grid-cols-[3rem_0.8fr_1.2fr_auto] md:items-center md:gap-8"
                key={lens.title}
              >
                <span className="text-ink/70 font-mono text-xs tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="text-ink text-2xl font-normal tracking-[-0.025em]">{lens.title}</h3>
                <p className="text-ink-muted max-w-2xl leading-7">{lens.description}</p>
                <EvidenceBadge tier={lens.tier} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="film-strip" style={{ minHeight: "auto" }}>
        <div
          aria-hidden="true"
          className="film-strip-media"
          style={{ backgroundImage: "url(/media/design2/strip-mirror-garden.jpg)" }}
        />
        <div className="film-strip-scrim" />
        <div className="container-shell section-band">
          <div className="grid overflow-hidden rounded-[20px] border border-white/20 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-charcoal text-ink relative flex min-h-72 flex-col justify-between overflow-hidden p-8 sm:p-10">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[url(/media/design2/panel-void-detail.jpg)] bg-cover bg-center opacity-40"
              />
              <div className="relative">
                <p className="mono-label">Privasi adalah struktur</p>
                <h2 className="mt-6 max-w-lg text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  Kamu memegang kontrol atas data dan hasilmu.
                </h2>
              </div>
            </div>
            <div className="bg-surface/90 p-8 backdrop-blur-[2px] sm:p-10">
              {trustPrinciples.map(([title, description]) => (
                <article
                  className="grid gap-2 border-b border-white/12 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[8rem_1fr] sm:gap-6"
                  key={title}
                >
                  <h3 className="mono-label text-ink">{title}</h3>
                  <p className="text-ink-muted leading-7">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
