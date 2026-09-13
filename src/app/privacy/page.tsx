import type { Metadata } from "next";
import Link from "next/link";
import { CollectiblePageHero } from "@/components/collectible-page-hero";

export const metadata: Metadata = {
  title: "Privasi & Kedaulatan Data",
  description:
    "Prinsip perlindungan data terenkripsi, bebas pelacak iklan, dan kendali privasi mutlak di LensaDiri.",
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

const dataPillars = [
  {
    num: "01",
    tag: "Akses Fleksibel",
    title: "Mode Tamu Bebas Identitas",
    summary:
      "Jelajahi dan selesaikan seluruh asesmen tanpa perlu membuat akun, tanpa email, dan tanpa nomor ponsel.",
    details:
      "Sesi tamu disimpan sementara dan kedaluwarsa secara otomatis. Tidak ada paksaan untuk menyerahkan kontak pribadi jika kamu hanya ingin bercermin.",
    accent: "border-emerald-200 bg-emerald-50 text-emerald-800",
    dot: "bg-emerald-500",
  },
  {
    num: "02",
    tag: "Kerahasiaan Utuh",
    title: "Hasil Privat Secara Bawaan",
    summary:
      "Skor dan narasi refleksi dirancang eksklusif untuk pandanganmu sendiri sejak detik pertama.",
    details:
      "LensaDiri tidak menyediakan direktori profil publik. Mesin pencari seperti Google tidak dapat mengindeks jawaban maupun hasil analisismu.",
    accent: "border-sky-200 bg-sky-50 text-sky-800",
    dot: "bg-sky-500",
  },
  {
    num: "03",
    tag: "Kendali Berbagi",
    title: "Tautan Berbagi di Bawah Kontrolmu",
    summary:
      "Jika ingin berdiskusi dengan orang terdekat, kamu yang memutuskan kapan dan apa yang dibagikan.",
    details:
      "Tautan publik diamankan dengan token kriptografi unik. Detail diagnostik mentah disaring otomatis, dan kamu dapat mencabut atau mematikan tautan kapan saja.",
    accent: "border-purple-200 bg-purple-50 text-purple-800",
    dot: "bg-purple-500",
  },
  {
    num: "04",
    tag: "Bebas Komersialisasi",
    title: "Nol Pelacak Iklan Pihak Ketiga",
    summary:
      "Pola psikologis dan jawaban kepribadianmu bukan komoditas untuk dijual kepada pengiklan.",
    details:
      "Kami tidak memasang Meta Pixel, Google AdSense, atau skrip pialang data yang memantau kebiasaan berselancarmu untuk target iklan.",
    accent: "border-amber-200 bg-amber-50 text-amber-800",
    dot: "bg-amber-500",
  },
  {
    num: "05",
    tag: "Hak Hapus Permanen",
    title: "Kedaulatan Hapus Bersih Seketika",
    summary:
      "Kapan pun kamu ingin menyudahi, seluruh riwayat atau akun dapat dimusnahkan secara permanen.",
    details:
      "Penghapusan data dilakukan tuntas dari basis data tanpa menyimpan arsip bayangan. Kamu juga bebas mengekspor salinan hasil ke format PDF atau JSON sebelum menghapusnya.",
    accent: "border-rose-200 bg-rose-50 text-rose-800",
    dot: "bg-rose-500",
  },
];

const ledgerItems = [
  {
    category: "Identitas Akun",
    whatStored: "Email dan hash kata sandi (jika kamu memilih mendaftar).",
    howProtected:
      "Kata sandi di-hash menggunakan algoritma Argon2id berbobot tinggi. Kami tidak pernah mengetahui atau menyimpan kata sandi aslimu.",
  },
  {
    category: "Jawaban & Skor",
    whatStored: "Pilihan respons Likert dan skor numerik per dimensi.",
    howProtected:
      "Tersimpan dalam basis data terisolasi dengan akses ketat. Terhapus permanen saat kamu memilih menghapus sesi atau akun.",
  },
  {
    category: "Data Jaringan",
    whatStored: "Hash kriptografi anonim dari sidik jari permintaan.",
    howProtected:
      "Kami tidak mencatat raw IP address atau raw user-agent. Hash digunakan semata-mata untuk mencegah serangan spam dan pembatasan laju (rate limiting).",
  },
  {
    category: "Pelacak Pihak Ketiga",
    whatStored: "Tidak ada (nol).",
    howProtected:
      "Tidak ada kuki pelacak iklan atau analitik pihak ketiga yang disematkan di halaman LensaDiri.",
  },
];

function PrivacyVaultCard() {
  return (
    <div className="border-line bg-surface flex flex-col gap-4 rounded-3xl border p-6 shadow-[0_10px_30px_rgb(27_28_26_/_0.08)]">
      <div className="flex items-center justify-between">
        <span className="border-line-strong bg-surface rounded-full border px-3 py-1 font-mono text-xs font-semibold">
          Zero Tracking Guarantee
        </span>
        <span className="text-ink-muted font-mono text-xs">100% Privat</span>
      </div>

      <h2 className="font-['Anton',var(--font-anton),sans-serif] text-2xl tracking-wide uppercase sm:text-3xl">
        Kedaulatan Data 🛡️
      </h2>

      <p className="text-ink-muted text-xs leading-relaxed sm:text-sm">
        Data psikologismu adalah hak intimmu. Tidak pernah dikomodifikasi, tidak diindeks mesin
        pencari, dan kamu bebas menghapusnya kapan saja.
      </p>

      <div className="border-line grid grid-cols-2 gap-2 border-y py-3 font-mono text-xs">
        <div className="border-line bg-surface-raised rounded-2xl border p-2.5">
          <span className="block font-bold">Mode Tamu</span>
          <span className="text-steel text-[11px]">Tanpa email / sandi</span>
        </div>
        <div className="border-line bg-surface-raised rounded-2xl border p-2.5">
          <span className="text-success block font-bold">Hard Delete</span>
          <span className="text-steel text-[11px]">Tanpa arsip bayangan</span>
        </div>
      </div>

      <Link
        href="/start"
        className="bg-iris text-canvas hover:bg-iris-deep inline-flex min-h-[48px] w-full items-center justify-center rounded-full py-3 text-sm font-bold shadow-sm transition-all duration-150 ease-out active:scale-95"
      >
        Mulai Mode Tamu Sekarang →
      </Link>
    </div>
  );
}

export default function PrivacyPage() {
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
          badgeText="KEDAULATAN DATA & PRIVASI"
          ghostText="PRIVASI"
          stageColor="#6BBF7A"
          stageInk="#002109"
          headline={
            <h1 className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(30px,5vw,52px)] leading-[1.04] tracking-tight uppercase">
              Ruang refleksi pribadimu, tanpa kompromi data.
            </h1>
          }
          subheadline={
            <p className="text-sm leading-relaxed sm:text-base">
              Jawaban dan hasil refleksi adalah milikmu seutuhnya. Kami tidak menjual data ke
              pengiklan, tidak menyematkan pelacak pihak ketiga, dan memberi kendali penuh.
            </p>
          }
          rightCard={<PrivacyVaultCard />}
        />

        {/* 2. 5 DATA SOVEREIGNTY PILLARS */}
        <section className="px-2 py-6 sm:px-4">
          <div className="max-w-3xl">
            <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
              5 CORE COMMITMENTS
            </span>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Lima Prinsip Kedaulatan Data</h2>
            <p className="text-ink-muted mt-1 text-sm">
              Fondasi keamanan privasi yang kami bangun sejak baris pertama arsitektur sistem.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dataPillars.map((pillar) => (
              <article
                key={pillar.num}
                className="group border-line bg-surface hover:border-line-strong hover:bg-surface-raised flex flex-col justify-between rounded-3xl border p-8 shadow-[0_6px_20px_rgb(27_28_26_/_0.06)] transition-all duration-200 ease-out hover:-translate-y-1 sm:p-9"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="border-line bg-surface inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase">
                      <span className={`h-1.5 w-1.5 rounded-full ${pillar.dot}`} />
                      {pillar.tag}
                    </span>
                    <span className="text-steel font-mono text-xs font-bold">{pillar.num}</span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold tracking-tight">{pillar.title}</h3>

                  <p className="text-ink-muted mt-3 text-sm leading-relaxed font-medium">
                    {pillar.summary}
                  </p>

                  <p className="text-steel mt-3 text-xs leading-relaxed">{pillar.details}</p>
                </div>
              </article>
            ))}
          </div>

          {/* 3. STORAGE TRANSPARENCY LEDGER */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-8 backdrop-blur-md sm:p-12">
            <div className="max-w-2xl">
              <span className="text-success font-mono text-xs font-semibold tracking-wider uppercase">
                TRANSPARANSI PENYIMPANAN
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Apa yang kami simpan, dan bagaimana kami menjaganya?
              </h2>
              <p className="text-ink-muted mt-2 text-sm leading-relaxed">
                Berikut adalah fakta teknis mengenai tata kelola data di seluruh sistem LensaDiri:
              </p>
            </div>

            <div className="mt-8 divide-y divide-white/15">
              {ledgerItems.map((item) => (
                <div
                  key={item.category}
                  className="grid gap-2 py-5 sm:grid-cols-[1.2fr_2fr_2.5fr] sm:items-start sm:gap-6"
                >
                  <div>
                    <span className="text-sm font-bold">{item.category}</span>
                  </div>
                  <div>
                    <p className="text-ink-muted text-xs leading-relaxed font-medium">
                      {item.whatStored}
                    </p>
                  </div>
                  <div>
                    <p className="text-ink-muted text-xs leading-relaxed">{item.howProtected}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. BOTTOM ACTION BANNER */}
          <div className="border-line bg-surface mt-16 rounded-3xl border p-10 text-center shadow-xl backdrop-blur-md">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Mulai refleksi diri dengan ketenangan mutlak
            </h2>
            <p className="text-ink-muted mx-auto mt-2 max-w-xl text-sm leading-relaxed">
              Tidak ada data yang kami komodifikasi. Keamanan dan kenyamanan ruang batinmu adalah
              prioritas tertinggi.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/start"
                className="bg-iris text-canvas hover:bg-iris-deep hover:bg-surface inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-[#1b5e20] shadow-lg transition-all duration-150 ease-out active:scale-95"
              >
                <span>Mulai Mode Tamu</span>
                <ArrowUpRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
