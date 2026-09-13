import type { Metadata } from "next";
import Link from "next/link";
import { CollectiblePageHero } from "@/components/collectible-page-hero";

export const metadata: Metadata = {
  title: "Tentang LensaDiri",
  description:
    "Ruang refleksi kepribadian modular, jujur, dan bebas vonis kaku untuk pengguna Indonesia.",
};

function ArrowUpRightIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M7 7h10v10" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

const coreValues = [
  {
    num: "01",
    tag: "Kebebasan Diri",
    title: "Lensa, Bukan Sangkar",
    summary: "Kami tidak pernah memenjarakanmu dalam kode empat huruf atau stempel permanen.",
    details:
      "Kecenderunganmu dibaca sebagai spektrum dinamis yang terus beradaptasi dan berkembang seiring pengalaman hidup dan pendewasaan diri.",
    accentBorder: "hover:border-emerald-300",
    pillColor: "border-emerald-200 bg-emerald-50 text-emerald-800",
    numColor: "text-emerald-600",
  },
  {
    num: "02",
    tag: "Kedaulatan Privasi",
    title: "Rahasia yang Tetap Milikmu",
    summary:
      "Pola psikologismu bukan komoditas untuk dijual kepada broker data atau jaringan iklan.",
    details:
      "Tidak ada pelacak Meta Pixel atau Google Ads. Hasilmu privat sejak detik pertama, dan kamu memegang kendali penuh untuk menyimpan, mengekspor, atau memusnahkannya.",
    accentBorder: "hover:border-sky-300",
    pillColor: "border-sky-200 bg-sky-50 text-sky-800",
    numColor: "text-sky-600",
  },
  {
    num: "03",
    tag: "Integritas Ilmiah",
    title: "Sains Rendah Hati Tanpa Klaim Palsu",
    summary: "Kami tidak menjanjikan ramalan nasib, tes kepribadian ajaib, atau diagnosis klinis.",
    details:
      "LensaDiri adalah instrumen refleksi diri untuk memantik percakapan hangat dan jujur dengan dirimu sendiri, didukung oleh transparansi formula deterministik server.",
    accentBorder: "hover:border-amber-300",
    pillColor: "border-amber-200 bg-amber-50 text-amber-800",
    numColor: "text-amber-600",
  },
];

const journeySteps = [
  {
    step: "01",
    title: "Pilih Ritme Refleksi",
    desc: "Mulai dari sesi kilat 5 menit hingga eksplorasi mendalam sesuai kesiapan hatimu hari ini.",
  },
  {
    step: "02",
    title: "Bercermin Jujur",
    desc: "Tidak ada jawaban benar atau salah. Tanggapi setiap butir pertanyaan dengan kecenderunganmu yang paling alami.",
  },
  {
    step: "03",
    title: "Pahami Spektrum Polamu",
    desc: "Dapatkan peta spektrum kepribadian berlapis yang jernih, dapat diunduh, dan disimpan secara aman.",
  },
];

function AboutOverviewCard() {
  return (
    <div className="border-line bg-surface flex flex-col gap-4 rounded-3xl border p-6 shadow-[0_10px_30px_rgb(27_28_26_/_0.08)]">
      <div className="flex items-center justify-between">
        <span className="border-line-strong bg-surface rounded-full border px-3 py-1 font-mono text-xs font-semibold">
          Reflektif & Mandiri
        </span>
        <span className="text-ink-muted font-mono text-xs">Filosofi Inti</span>
      </div>

      <h2 className="font-display text-2xl tracking-wide uppercase sm:text-3xl">
        Sebuah Cermin 🪞
      </h2>

      <blockquote className="border-line-strong text-ink-muted border-l-2 pl-3 text-sm leading-relaxed italic">
        &ldquo;Cermin tidak pernah menyuruhmu untuk berubah. Cermin hanya menunjukkan apa adanya
        dengan jujur, memberi ketenangan untuk melangkah ke depan.&rdquo;
      </blockquote>

      <p className="text-ink-muted text-xs leading-relaxed">
        Platform ini didesain bagi siapa pun yang ingin memahami kebiasaan berpikir, watak, dan
        dinamika relasi mereka tanpa merasa diadili.
      </p>

      <Link
        href="/start"
        className="bg-iris text-canvas hover:bg-iris-deep inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-bold shadow-sm transition-all duration-150 ease-out active:scale-95"
      >
        Mulai Eksplorasi →
      </Link>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-canvas text-ink relative min-h-screen p-4 sm:p-6 md:p-8">
      {/* Subtle Grain Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
        }}
      />

      <div className="relative z-10 mx-auto max-w-7xl space-y-12">
        {/* 1. COLLECTIBLE HERO */}
        <CollectiblePageHero
          badgeText="TENTANG KAMI · RUANG REFLEKSI"
          ghostText="TENTANG"
          stageColor="#6BBF7A"
          stageInk="#002109"
          headline={
            <h1 className="font-display text-[clamp(30px,5vw,52px)] leading-[1.04] tracking-tight uppercase">
              Ruang aman untuk mendengarkan dirimu sendiri.
            </h1>
          }
          subheadline={
            <p className="text-sm leading-relaxed sm:text-base">
              Di dunia yang sibuk menilaimu, LensaDiri hadir sebagai cermin yang jujur, hangat, dan
              bebas dari vonis kurungan empat huruf.
            </p>
          }
          rightCard={<AboutOverviewCard />}
        />

        {/* 2. ORIGIN & PHILOSOPHY BENTO */}
        <section className="px-2 py-6 sm:px-4">
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            <div className="border-line bg-surface rounded-3xl border p-8 shadow-[0_6px_20px_rgb(27_28_26_/_0.06)] sm:p-10">
              <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
                KISAH DI BALIK LENSA
              </span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Sebuah cermin, bukan kurungan</h2>
              <p className="text-ink-muted mt-4 text-sm leading-relaxed">
                Setiap hari kita dihadapkan pada ekspektasi sosial, karier, dan hubungan yang
                menuntut kita untuk selalu seragam. Saat kita mencoba tes kepribadian daring untuk
                mencari pemahaman, kita sering hanya diberi stempel dangkal atau dipaksa menyerahkan
                data pribadi demi analitik periklanan.
              </p>
              <p className="text-ink-muted mt-3 text-sm leading-relaxed">
                LensaDiri dirancang sebagai antitesis: ruang digital hening di mana setiap orang
                Indonesia dapat berefleksi secara mandiri, didukung oleh psikometri terbuka yang
                transparan, dan dilindungi oleh komitmen privasi mutlak.
              </p>
            </div>

            <div className="border-line bg-surface flex flex-col justify-between rounded-3xl border p-8 backdrop-blur-md sm:p-10">
              <div>
                <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
                  FILOSOFI KAMI
                </span>
                <blockquote className="mt-4 font-serif text-xl leading-relaxed italic sm:text-2xl">
                  &ldquo;Cermin tidak pernah menyuruhmu untuk berubah. Cermin hanya menunjukkan apa
                  adanya dengan jujur, memberi kamu ketenangan untuk melangkah ke depan.&rdquo;
                </blockquote>
              </div>
              <p className="text-steel mt-6 font-mono text-xs font-semibold tracking-wider uppercase">
                — Prinsip Inti LensaDiri
              </p>
            </div>
          </div>

          {/* 3. THREE CORE VALUES */}
          <div className="mt-16">
            <div className="max-w-2xl">
              <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
                TIGA JANJI UTAMA
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Prinsip yang kami jaga di setiap baris kode
              </h2>
            </div>

            <div className="mt-8 grid gap-8 md:grid-cols-3">
              {coreValues.map((item) => (
                <article
                  key={item.num}
                  className="group border-line bg-surface hover:border-line-strong hover:bg-surface-raised flex flex-col justify-between rounded-3xl border p-8 shadow-[0_6px_20px_rgb(27_28_26_/_0.06)] transition-all duration-200 ease-out hover:-translate-y-1 sm:p-9"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-success font-mono text-sm font-bold tracking-wider">
                        {item.num}
                      </span>
                      <span className="border-line bg-surface inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-bold tracking-tight">{item.title}</h3>

                    <p className="text-ink-muted mt-3 text-sm leading-relaxed font-medium">
                      {item.summary}
                    </p>

                    <p className="text-steel mt-3 text-xs leading-relaxed">{item.details}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* 4. 3-STEP JOURNEY STRIP */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-8 backdrop-blur-md sm:p-12">
            <div className="max-w-xl">
              <span className="text-steel font-mono text-xs font-semibold tracking-wider uppercase">
                CARA MEMULAI
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Tiga Langkah Perjalanan Refleksi
              </h2>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-3">
              {journeySteps.map((step) => (
                <div
                  key={step.step}
                  className="border-line bg-surface-raised rounded-2xl border p-6 shadow-sm backdrop-blur-sm"
                >
                  <span className="text-success font-mono text-xs font-bold uppercase">
                    Langkah {step.step}
                  </span>
                  <h3 className="mt-3 text-base font-bold">{step.title}</h3>
                  <p className="text-ink-muted mt-2 text-xs leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. BOTTOM ACTION BANNER */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-10 text-center shadow-xl backdrop-blur-md">
            <h2 className="text-2xl font-bold sm:text-3xl">Mulailah bercermin tanpa beban</h2>
            <p className="text-ink-muted mx-auto mt-2 max-w-xl text-sm leading-relaxed">
              Pilih satu lensa pertama dan temukan sudut pandang baru tentang caramu bergerak di
              dunia.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/start"
                className="bg-iris text-canvas hover:bg-iris-deep hover:bg-surface inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-[#1b5e20] shadow-lg transition-all duration-150 ease-out active:scale-95"
              >
                <span>Mulai Eksplorasi</span>
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
