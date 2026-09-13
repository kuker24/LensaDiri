"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getStoredGender, type CharacterGender } from "@/lib/assessment/gender-storage";
import type { StageCode } from "@/components/result-podium";

export type CharacterClaimViewProps = {
  resultToken: string;
  onAttachNext: () => void;
  onViewResult?: () => void;
  temperamentCode?: StageCode;
  typeCode?: string | null;
};

/**
 * Cluster stages are light fills paired with their own dark ink. White on a
 * saturated stage measures 2.2-2.5:1, so labels use `--stage-ink` instead.
 */
const STAGE = {
  NT: { fill: "#6eb5ff", panel: "#8dc4ff", ink: "#0b2f52", cluster: "Analysts" },
  NF: { fill: "#e882b4", panel: "#ed9dc4", ink: "#681847", cluster: "Diplomats" },
  SJ: { fill: "#6bbf7a", panel: "#85cc92", ink: "#002109", cluster: "Sentinels" },
  SP: { fill: "#f4845f", panel: "#f79b7f", ink: "#6c1e02", cluster: "Explorers" },
  NEUTRAL: {
    fill: "#e4e2de",
    panel: "#efeeea",
    ink: "#30312e",
    cluster: "Pola refleksi",
  },
} as const;

export function CharacterClaimView({
  resultToken,
  onAttachNext,
  onViewResult,
  temperamentCode = "NF",
  typeCode,
}: CharacterClaimViewProps) {
  const stage = STAGE[temperamentCode];
  const router = useRouter();
  const [gender] = useState<CharacterGender>(() => getStoredGender());

  const figureSrc = gender === "laki" ? "/figurines/base-male.png" : "/figurines/base-female.png";

  function handleViewResult() {
    if (onViewResult) {
      onViewResult();
    } else {
      router.push(`/result/${resultToken}`);
    }
  }

  return (
    <div
      className="bg-canvas text-ink relative flex min-h-screen w-full flex-col font-sans"
      style={
        {
          "--stage": stage.fill,
          "--stage-panel": stage.panel,
          "--stage-ink": stage.ink,
        } as React.CSSProperties
      }
    >
      {/* Ambient stage wash: the cluster colour lives in the light, not the text. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[var(--stage)] opacity-[0.18] blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[var(--stage-panel)] opacity-25 blur-2xl" />
      </div>

      <header className="relative z-20 flex w-full items-center justify-between px-5 pt-6 sm:px-10">
        <div className="flex items-center gap-2.5">
          <span className="font-['Anton',var(--font-anton),sans-serif] text-base tracking-[0.18em] uppercase sm:text-lg">
            LENSADIRI
          </span>
          <span className="h-2 w-2 rounded-full bg-[var(--stage)]" />
        </div>
        <span className="text-steel mono-label border-line border-l pl-3">Tahap 01 selesai</span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center px-5 py-8 sm:px-8 lg:py-12">
        <div className="mb-7 flex flex-col items-center gap-3 text-center lg:mb-9">
          <span
            className="inline-flex items-center gap-2 rounded-full bg-[var(--stage)] px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.09em] uppercase shadow-sm"
            style={{ color: stage.ink }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Baru diklaim · masih polos
          </span>
          <h1 className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(30px,7vw,52px)] leading-[1.04] tracking-tight uppercase">
            Ini tubuh karaktermu
          </h1>
          <p className="text-ink-muted max-w-md leading-relaxed">
            Atribut lensa lain belum terpasang. Ini bukan label tetap, hanya titik awal.
          </p>
        </div>

        {/* Collector card */}
        <div className="bg-surface border-line relative w-full max-w-md rounded-[24px] border p-5 shadow-[0_18px_44px_rgb(27_28_26_/_0.10)] sm:p-7">
          <div className="border-line flex items-center justify-between border-b pb-3.5">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--stage)]" />
              <span
                className="text-[11px] font-extrabold tracking-[0.09em] uppercase"
                style={{ color: stage.ink }}
              >
                {stage.cluster}
              </span>
            </span>
            <span
              className="rounded-full bg-[var(--stage-panel)] px-2.5 py-1 font-mono text-[11px] font-bold"
              style={{ color: stage.ink }}
            >
              Lensa 1/5
            </span>
          </div>

          {/* Figure pedestal */}
          <div className="bg-surface-raised relative mt-4 aspect-[3/4] w-full overflow-hidden rounded-[18px]">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[var(--stage-panel)] opacity-30"
              style={{
                maskImage: "radial-gradient(ellipse at 50% 62%, black 0%, transparent 68%)",
                WebkitMaskImage: "radial-gradient(ellipse at 50% 62%, black 0%, transparent 68%)",
              }}
            />
            <NextImage
              src={figureSrc}
              alt="Figurine karakter polos, belum memakai atribut lensa apa pun"
              fill
              sizes="(max-width: 640px) 78vw, 420px"
              priority
              draggable={false}
              className="relative z-10 object-contain object-bottom p-4 drop-shadow-[0_14px_22px_rgb(27_28_26_/_0.16)] select-none"
            />
            <div
              aria-hidden="true"
              className="absolute bottom-5 left-1/2 z-0 h-4 w-40 -translate-x-1/2 rounded-[100%] bg-[#1b1c1a]/18 blur-[5px]"
            />
          </div>

          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <span className="text-steel mono-label block">Identitas sementara</span>
              <span className="font-mono text-lg font-bold tracking-wider">
                {typeCode ? `${typeCode} · ${temperamentCode}` : `POLA · ${temperamentCode}`}
              </span>
            </div>
            <span className="text-ink-muted max-w-[9rem] text-right text-[11px] leading-snug">
              {typeCode
                ? "Terbuka dari lensa pertama"
                : "Identitas tumbuh bersama lensa berikutnya"}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex w-full max-w-md flex-col items-stretch gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onAttachNext}
            style={{ color: stage.ink }}
            className="pressable focus-ring group flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2.5 rounded-full bg-[var(--stage)] px-7 text-base font-bold shadow-[0_8px_20px_rgb(27_28_26_/_0.14)]"
          >
            <span>Pasang lensa berikutnya</span>
            <svg
              aria-hidden="true"
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleViewResult}
            className="pressable focus-ring bg-surface border-line text-ink flex min-h-[52px] cursor-pointer items-center justify-center rounded-full border px-6 text-base font-semibold shadow-sm"
          >
            Simpan dulu
          </button>
        </div>

        <p className="text-steel mt-6 max-w-sm text-center text-xs leading-relaxed">
          Kartu ini cermin interpretasi bebas yang bertumbuh seiring perjalananmu, bukan diagnosis.
        </p>
      </main>

      <footer className="text-steel relative z-10 flex w-full items-center justify-between px-5 pb-5 font-mono text-[11px] sm:px-10">
        <span>Tersimpan otomatis · tanpa akun</span>
        <span className="hidden sm:inline">Hasil refleksi pribadi</span>
      </footer>
    </div>
  );
}
