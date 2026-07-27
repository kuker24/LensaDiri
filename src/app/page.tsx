import Link from "next/link";
import { EvidenceBadge } from "@/components/evidence-badge";
import { HeroAmbient } from "@/components/hero-ambient";
import { ReflectionPass } from "@/components/reflection-pass";
import { BlurFade } from "@/components/ui/blur-fade";
import { getButtonClassName } from "@/components/ui/button";

const lenses = [
  {
    title: "Profil Trait",
    tier: "A" as const,
    description: "Kecenderungan sebagai spektrum, bukan kotak tetap.",
  },
  {
    title: "Lensa 16-Type",
    tier: "B" as const,
    description: "Pola perhatian, keputusan, dan komunikasi.",
  },
  {
    title: "Lensa Motivasi",
    tier: "B" as const,
    description: "Dorongan yang sering muncul di balik tindakan.",
  },
] as const;

const steps = [
  ["01", "Pilih kedalaman", "Singkat, atau susun beberapa lensa."],
  ["02", "Jawab apa adanya", "Progress tersimpan. Tidak perlu sempurna."],
  ["03", "Baca sebagai pola", "Kecenderungan, keyakinan, dan batasan."],
] as const;

const trustPrinciples = [
  ["Privat", "Hasil tidak dibagikan sampai kamu membuat tautan."],
  ["Skor di server", "Angka dihitung di server, bukan cerita AI."],
  ["Tingkat bukti", "Setiap lensa menampilkan posisi evidensinya."],
  ["Terkendali", "Bagikan, cabut, ekspor, atau hapus kapan saja."],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="film-strip">
        <HeroAmbient />
        <div className="container-shell grid min-h-[calc(100svh-3.5rem)] gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-16 lg:py-20">
          <div className="hero-entrance max-w-3xl">
            <p className="mono-label text-ink/90">Privat · multi-lensa</p>
            <h1 className="display-stack text-ink mt-6 max-w-4xl sm:mt-8">
              <span className="display-underline block text-[clamp(2.5rem,8.5vw,5rem)] leading-[0.95]">
                Kenali pola
              </span>
              <span className="display-underline mt-1.5 block text-[clamp(2.5rem,8.5vw,5rem)] leading-[0.95] sm:mt-3">
                dirimu
              </span>
              <span className="text-ink/90 mt-3 block max-w-xl text-[clamp(1.1rem,2.3vw,1.5rem)] leading-[1.25] font-normal tracking-[-0.02em] sm:mt-4">
                lewat banyak lensa.
              </span>
            </h1>
            <p className="text-ink-muted mt-8 max-w-lg text-base leading-7 sm:text-lg sm:leading-8">
              Pahami cara berpikir, merasa, dan berelasi — tanpa label mutlak.
            </p>
            <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link
                className={`${getButtonClassName("primary", "md")} w-full sm:w-auto`}
                href="/start"
              >
                Mulai eksplorasi
                <span aria-hidden="true">↗</span>
              </Link>
              <Link
                className={`${getButtonClassName("secondary", "md")} w-full sm:w-auto`}
                href="/method"
              >
                Metode
              </Link>
            </div>
            <p className="text-ink-muted mt-6 text-sm">Bukan diagnosis klinis.</p>
          </div>

          <BlurFade delay={0.12} className="lg:justify-self-stretch">
            <ReflectionPass />
          </BlurFade>
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
          <BlurFade inView>
            <p className="section-stamp text-ink max-w-full overflow-hidden">Cara melihat</p>
          </BlurFade>
          <BlurFade inView delay={0.08} className="mt-12 border-t border-white/20">
            {steps.map(([number, title, description]) => (
              <article
                className="row-hover grid gap-4 border-b border-white/15 px-3 py-8 sm:grid-cols-[4rem_0.7fr_1fr] sm:items-baseline sm:gap-8 sm:px-4"
                key={number}
              >
                <p className="text-ink/70 font-mono text-sm tabular-nums">{number}</p>
                <h2 className="text-ink text-xl font-normal tracking-[-0.02em] sm:text-2xl">
                  {title}
                </h2>
                <p className="text-ink-muted max-w-xl leading-7">{description}</p>
              </article>
            ))}
          </BlurFade>
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
          <BlurFade inView className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-3xl">
              <h2 className="text-ink text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
                Satu lensa tak cukup menjelaskan semua.
              </h2>
              <p className="text-ink-muted mt-4 max-w-xl leading-7">
                Beberapa sudut baca, skor tetap terpisah per lensa.
              </p>
            </div>
            <Link
              className="focus-ring ui-transition text-ink hover:text-ink-muted inline-flex min-h-11 items-center rounded-[12px] text-sm font-medium tracking-[-0.01em]"
              href="/modules"
            >
              Semua lensa <span aria-hidden="true">↗</span>
            </Link>
          </BlurFade>

          <BlurFade inView delay={0.09} className="mt-14 flex flex-col border-t border-white/20">
            <p className="text-ink-muted border-b border-white/15 px-3 py-4 text-sm leading-6 md:px-4">
              Tingkat bukti di samping nama lensa:{" "}
              <strong className="text-ink font-normal">A</strong> lebih matang;{" "}
              <strong className="text-ink font-normal">B/C</strong> reflektif;{" "}
              <strong className="text-ink font-normal">Eksperimental</strong> uji terbatas. Bukan
              sertifikasi klinis.
            </p>
            {lenses.map((lens) => (
              <article
                className="row-hover grid gap-5 border-b border-white/15 px-3 py-8 md:grid-cols-[0.8fr_1.2fr_auto] md:items-center md:gap-8 md:px-4"
                key={lens.title}
              >
                <h3 className="text-ink text-2xl font-normal tracking-[-0.025em]">{lens.title}</h3>
                <p className="text-ink-muted max-w-2xl leading-7">{lens.description}</p>
                <EvidenceBadge tier={lens.tier} />
              </article>
            ))}
          </BlurFade>
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
          <BlurFade
            inView
            className="relative grid overflow-hidden rounded-[20px] border border-white/20 lg:grid-cols-[0.82fr_1.18fr]"
          >
            <div className="bg-charcoal text-ink relative flex min-h-72 flex-col justify-between overflow-hidden p-8 sm:p-10">
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[url(/media/design2/panel-void-detail.jpg)] bg-cover bg-center opacity-30"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
              />
              <div className="relative">
                <p className="mono-label">Privasi terstruktur</p>
                <h2 className="mt-6 max-w-lg text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  Data dan hasil ada di tanganmu.
                </h2>
              </div>
            </div>
            <div className="bg-surface/95 p-8 sm:p-10">
              {trustPrinciples.map(([title, description]) => (
                <article
                  className="grid gap-2 border-b border-white/12 py-5 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[9.5rem_1fr] sm:gap-6"
                  key={title}
                >
                  <h3 className="text-ink text-base font-medium tracking-[-0.02em]">{title}</h3>
                  <p className="text-ink-muted leading-7">{description}</p>
                </article>
              ))}
            </div>
          </BlurFade>
        </div>
      </section>

      <section className="border-t border-white/12">
        <div className="container-shell flex flex-col gap-6 py-16 sm:flex-row sm:items-end sm:justify-between sm:py-20">
          <BlurFade inView className="max-w-xl">
            <h2 className="text-ink text-3xl font-normal tracking-[-0.03em] sm:text-4xl">
              Siap membaca polamu?
            </h2>
            <p className="text-ink-muted mt-3 leading-7">
              Mulai tenang. Jeda kapan saja. Hasil tetap di tanganmu.
            </p>
          </BlurFade>
          <BlurFade
            inView
            delay={0.06}
            className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row"
          >
            <Link
              className={`${getButtonClassName("primary", "md")} w-full sm:w-auto`}
              href="/start"
            >
              Mulai eksplorasi
            </Link>
            <Link
              className={`${getButtonClassName("ghost", "md")} w-full sm:w-auto`}
              href="/method"
            >
              Metode
            </Link>
          </BlurFade>
        </div>
      </section>
    </>
  );
}
