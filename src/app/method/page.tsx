import type { Metadata } from "next";
import Link from "next/link";
import { EvidenceBadge } from "@/components/evidence-badge";
import { CollectiblePageHero } from "@/components/collectible-page-hero";

export const metadata: Metadata = {
  title: "Metode & Batasan Sains",
  description:
    "Pendekatan sains yang transparan, bebas vonis kaku, dan komputasi deterministik di LensaDiri.",
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

const pillars = [
  {
    tier: "A" as const,
    num: "01",
    tag: "Fondasi Utama",
    title: "Spektrum Dinamis, Bukan Kotak Mati",
    summary:
      "Manusia bernapas dan bertumbuh seiring fase hidup. Kami tidak pernah memaksamu masuk ke dalam satu kotak sempit.",
    details:
      "Setiap kecenderungan dibaca sebagai kontinum spektrum yang lentur. Skor dihasilkan lewat fungsi matematis murni yang konsisten dan dapat diverifikasi ulang kapan saja.",
    accentBorder: "hover:border-emerald-300",
    pillColor: "border-emerald-200 bg-emerald-50 text-emerald-800",
    numColor: "text-emerald-600",
  },
  {
    tier: "B" as const,
    num: "02",
    tag: "Lensa Reflektif",
    title: "Cermin Kejujuran Tanpa Menghakimi",
    summary:
      "Membantumu mengenali pola dorongan batin, dinamika relasi, dan kecenderungan komunikasi harian.",
    details:
      "Model tipologi dan motivasi digunakan untuk memantik dialog sehat dengan diri sendiri — bukan sebagai label permanen atau dasar keputusan nasib profesional.",
    accentBorder: "hover:border-sky-300",
    pillColor: "border-sky-200 bg-sky-50 text-sky-800",
    numColor: "text-sky-600",
  },
  {
    tier: "C" as const,
    num: "03",
    tag: "Integritas Komputasi",
    title: "Kalkulasi Pasti Tanpa Halusinasi AI",
    summary:
      "Skor dan laporanmu dihitung murni di server secara deterministik — bukan hasil tebakan atau generasi acak model AI.",
    details:
      "Seluruh interpretasi dan narasi disusun berbasis template psikologis teruji dan aturan penilaian eksplisit. Tidak ada data jawabanmu yang dikirim ke LLM publik untuk dinilai secara spekulatif.",
    accentBorder: "hover:border-amber-300",
    pillColor: "border-amber-200 bg-amber-50 text-amber-800",
    numColor: "text-amber-600",
  },
];

const contrastPoints = [
  {
    traditional: "Melabeli kepribadian secara kaku seumur hidup dengan vonis 4 huruf mati.",
    lensadiri:
      "Memetakan kecenderungan sebagai spektrum dinamis yang menghargai dinamika perubahan hidupmu.",
  },
  {
    traditional: "Mengklaim dapat menentukan masa depan mutlak atau menggantikan diagnosis klinis.",
    lensadiri:
      "Rendah hati mengakui batasan: ini instrumen refleksi diri, bukan diagnosis psikologis atau medis.",
  },
  {
    traditional: "Menjual data jawaban psikologismu ke broker pengiklan pihak ketiga.",
    lensadiri:
      "Privat secara bawaan: tanpa kuki pelacak iklan pihak ketiga, tanpa penjualan data apa pun.",
  },
  {
    traditional:
      "Sering memakai AI generatif mentah yang berhalusinasi menghasilkan skor berbeda-beda tiap saat.",
    lensadiri:
      "Skor primer dihitung melalui formula deterministik server yang konsisten dan teruji secara ketat.",
  },
];

function OpenScienceCard() {
  return (
    <div className="border-line bg-surface flex flex-col gap-4 rounded-3xl border p-6 shadow-[0_10px_30px_rgb(27_28_26_/_0.08)]">
      <div className="flex items-center justify-between">
        <span className="border-line-strong bg-surface rounded-full border px-3 py-1 font-mono text-xs font-semibold">
          Sains Terbuka & Deterministik
        </span>
        <span className="text-ink-muted font-mono text-xs">Tier A & B</span>
      </div>

      <h2 className="font-display text-2xl tracking-wide uppercase sm:text-3xl">
        Batas Sains & Integritas 🔬
      </h2>

      <p className="text-ink-muted text-xs leading-relaxed sm:text-sm">
        Kami transparan tentang apa yang dapat diukur secara empiris dan apa yang berfungsi sebagai
        lensa introspektif. Tanpa klaim berlebihan, tanpa ilusi kepastian mutlak.
      </p>

      <div className="border-line bg-surface-raised flex flex-col gap-2 rounded-2xl border p-3 font-mono text-xs">
        <div className="flex items-center justify-between font-semibold">
          <span>Tier A: Riset Psikometri Teruji</span>
          <span className="text-success">Empiris</span>
        </div>
        <div className="flex items-center justify-between font-semibold">
          <span>Tier B: Lensa Reflektif Tipologis</span>
          <span className="text-iris">Introspektif</span>
        </div>
      </div>

      <Link
        href="/start"
        className="bg-iris text-canvas hover:bg-iris-deep inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-bold shadow-sm transition-[background-color,color,transform] duration-150 ease-out active:scale-95"
      >
        Mulai Eksplorasi Mandiri →
      </Link>
    </div>
  );
}

export default function MethodPage() {
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
          badgeText="METODOLOGI & BATASAN SAINS"
          ghostText="METODE"
          stageColor="#E882B4"
          stageInk="#681847"
          headline={
            <h1 className="font-display text-[clamp(30px,5vw,52px)] leading-[1.04] tracking-tight uppercase">
              Bukan menilai siapa kamu, tapi menyalakan lampu di ruang hening.
            </h1>
          }
          subheadline={
            <p className="text-sm leading-relaxed sm:text-base">
              Kepribadian manusia bukanlah teka-teki mati yang selesai dalam satu stempel. LensaDiri
              menggabungkan matematika deterministik dengan transparansi mutlak.
            </p>
          }
          rightCard={<OpenScienceCard />}
        />

        {/* 2. 3 THEMATIC PILLARS */}
        <section className="px-2 py-6 sm:px-4">
          <div className="max-w-3xl">
            <span className="text-steel font-mono text-xs font-semibold tracking-wider uppercase">
              CORE METHODOLOGY PILLARS
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Tiga Landasan Ilmiah LensaDiri</h2>
            <p className="text-ink-muted mt-1 text-sm">
              Keseimbangan antara validitas instrumen empiris dan kebebasan berefleksi secara jujur.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            {pillars.map((pillar) => (
              <article
                key={pillar.num}
                className="group border-line bg-surface hover:border-line-strong hover:bg-surface-raised flex flex-col justify-between rounded-3xl border p-8 shadow-[0_6px_20px_rgb(27_28_26_/_0.06)] transition-[background-color,border-color,transform] duration-200 ease-out hover:-translate-y-1 sm:p-9"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <EvidenceBadge tier={pillar.tier} />
                    <span
                      className={`font-mono text-sm font-bold tracking-wider ${pillar.numColor}`}
                    >
                      {pillar.num}
                    </span>
                  </div>

                  <span className="border-line bg-surface mt-6 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase">
                    {pillar.tag}
                  </span>

                  <h3 className="mt-4 text-xl font-bold tracking-tight sm:text-2xl">
                    {pillar.title}
                  </h3>

                  <p className="text-ink-muted mt-3 text-sm leading-relaxed font-medium">
                    {pillar.summary}
                  </p>

                  <p className="text-steel mt-3 text-xs leading-relaxed">{pillar.details}</p>
                </div>

                <div className="border-line text-steel mt-6 border-t pt-4 font-mono text-xs font-medium">
                  <span>Transparansi formula deterministik</span>
                </div>
              </article>
            ))}
          </div>

          {/* 3. EVIDENCE TIERS EXPLAINED */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-8 backdrop-blur-md sm:p-12">
            <div className="max-w-2xl">
              <span className="text-iris font-mono text-xs font-semibold tracking-wider uppercase">
                STANDAR BUKTI ILMIAH
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Dua Tingkat Bukti dalam LensaDiri
              </h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                Kami memisahkan instrumen yang memiliki fondasi psikometri formal dari kerangka
                tipologis yang bersifat eksploratif:
              </p>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="border-line bg-surface-raised rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <EvidenceBadge tier="A" />
                  <span className="text-sm font-bold">Tingkat Bukti A: Riset Teruji</span>
                </div>
                <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                  Instrumen yang berakar dari literatur model lima faktor (Big Five) dan psikometri
                  terbuka. Memiliki dukungan ribuan studi empiris untuk memetakan kecenderungan umum
                  perilaku manusia.
                </p>
              </div>

              <div className="border-line bg-surface-raised rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <EvidenceBadge tier="B" />
                  <span className="text-sm font-bold">Tingkat Bukti B: Lensa Reflektif</span>
                </div>
                <p className="text-ink-muted mt-3 text-xs leading-relaxed">
                  Instrumen berbasis model tipologi (seperti Jungian cognitive functions atau
                  motivasi Enneagram). Sangat kaya sebagai bahasa introspeksi diri, namun tidak
                  digunakan sebagai vonis psikologis absolut.
                </p>
              </div>
            </div>
          </div>

          {/* 4. COMPARISON SHOWCASE */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-8 shadow-[0_6px_20px_rgb(27_28_26_/_0.06)] sm:p-12">
            <div className="max-w-2xl">
              <span className="text-warning font-mono text-xs font-semibold tracking-wider uppercase">
                PERBANDINGAN PENDEKATAN
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Mengapa cara ini terasa berbeda?
              </h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                Perbedaan mendasar antara tes komersial berlabel vonis dengan ruang refleksi
                LensaDiri.
              </p>
            </div>

            <div className="mt-8 divide-y divide-white/15">
              {contrastPoints.map((point, idx) => (
                <div key={idx} className="grid items-center gap-4 py-4 sm:grid-cols-2 sm:gap-8">
                  <div className="text-steel flex items-start gap-3 text-sm leading-relaxed">
                    <span className="text-danger mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/20 text-xs font-bold">
                      ✕
                    </span>
                    <span>{point.traditional}</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm leading-relaxed font-medium">
                    <span className="text-success mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/20 text-xs font-bold">
                      ✓
                    </span>
                    <span>{point.lensadiri}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. BOTTOM CTA CARD */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-10 text-center shadow-xl backdrop-blur-md">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Siap melihat refleksi dirimu dengan jernih?
            </h2>
            <p className="text-ink-muted mx-auto mt-2 max-w-xl text-sm leading-relaxed">
              Hanya membutuhkan beberapa menit dalam ruang tenang tanpa tekanan dan tanpa vonis
              kaku.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/start"
                className="bg-iris text-canvas hover:bg-iris-deep hover:bg-surface inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-[#943360] shadow-lg transition-[background-color,color,transform] duration-150 ease-out active:scale-95"
              >
                <span>Mulai Refleksi Diri</span>
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
