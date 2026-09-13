"use client";

import NextImage from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startIdentityJourney } from "@/lib/assessment/client";
import { saveIdentityJourneyAccess } from "@/lib/assessment/journey-storage";
import { getAssessmentStartErrorMessage } from "@/lib/assessment/start-errors";
import { AuthApiError } from "@/lib/auth/client";
import { combinedJourneyMinimumAge } from "@/lib/validation/assessment";
import {
  getStoredGender,
  saveStoredGender,
  type CharacterGender,
} from "@/lib/assessment/gender-storage";

export { type CharacterGender } from "@/lib/assessment/gender-storage";

export function GenderSelectionGate() {
  const router = useRouter();
  const [selectedGender, setSelectedGender] = useState<CharacterGender>(() => getStoredGender());
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveStoredGender(selectedGender);
  }, [selectedGender]);

  const canProceed = !pending;

  async function handleProceed() {
    if (!canProceed) return;
    saveStoredGender(selectedGender);
    setPending(true);
    setError(null);
    try {
      const { journeyToken, token } = await startIdentityJourney({
        age: combinedJourneyMinimumAge,
        characterGender: selectedGender,
      });
      saveIdentityJourneyAccess(journeyToken, combinedJourneyMinimumAge);
      router.push(`/test/${token}`);
    } catch (cause) {
      setError(
        getAssessmentStartErrorMessage(
          cause instanceof AuthApiError ? cause.code : "request_failed",
        ),
      );
      setPending(false);
    }
  }

  return (
    <div className="bg-canvas text-ink relative min-h-screen w-full overflow-x-hidden font-sans">
      {/* Ambient wash: colour lives in the light, never behind body text. */}
      <div
        aria-hidden="true"
        className="bg-iris-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] blur-3xl"
      />

      {/* Giant Ghost Text 'POLA' */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-16 z-0 flex items-center justify-center opacity-70 select-none sm:top-10 sm:opacity-100"
      >
        <span className="text-line font-['Anton',var(--font-anton),sans-serif] text-[clamp(100px,22vw,320px)] leading-none font-black tracking-tight uppercase">
          POLA
        </span>
      </div>

      {/* Header */}
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center justify-between px-6 pt-6 sm:px-8 sm:pt-8">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            className="focus-ring inline-flex min-h-11 items-center font-['Anton',var(--font-anton),sans-serif] text-base tracking-[0.18em] uppercase transition-opacity hover:opacity-80 sm:text-lg"
          >
            LENSADIRI
          </Link>
          <span className="bg-iris h-2 w-2 rounded-full" />
        </div>
      </header>

      {/* Main Form */}
      <main className="relative z-20 mx-auto flex min-h-[calc(100vh-140px)] max-w-5xl flex-col items-center justify-center px-4 py-8 sm:px-6">
        {/* Header Title & Sub */}
        <div className="mb-6 max-w-xl text-center sm:mb-8">
          <h1 className="font-['Anton',var(--font-anton),sans-serif] text-[clamp(30px,6vw,44px)] tracking-tight uppercase">
            Pilih wujudmu
          </h1>
        </div>

        {/* Two Main Figurine Selection Tiles */}
        <div
          role="radiogroup"
          aria-label="Pilihan Wujud Figurine"
          className="mb-7 grid w-full max-w-4xl grid-cols-2 gap-3 sm:mb-8 sm:gap-6"
        >
          {/* Option 1: Perempuan */}
          <div
            role="radio"
            aria-checked={selectedGender === "perempuan"}
            tabIndex={0}
            onClick={() => setSelectedGender("perempuan")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedGender("perempuan");
              }
            }}
            className={`decision-tile group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[24px] p-3 backdrop-blur-md sm:min-h-[380px] sm:rounded-3xl sm:p-6 ${
              selectedGender === "perempuan"
                ? "border-iris bg-iris-wash ring-iris/20 border-2 shadow-[0_10px_28px_rgb(27_28_26_/_0.10)] ring-4"
                : "border-line bg-surface hover:border-iris/45 hover:bg-surface-raised border-2"
            }`}
          >
            {/* Badge Indicator */}
            <div className="z-10 flex w-full items-center justify-end">
              <div
                className={`ui-transition flex h-6 w-6 items-center justify-center rounded-full ${
                  selectedGender === "perempuan"
                    ? "bg-iris text-canvas shadow-sm"
                    : "border-line border-2"
                }`}
              >
                {selectedGender === "perempuan" && (
                  <svg
                    className="h-3.5 w-3.5 stroke-[3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Figurine Display Area with Cutout & Shadow */}
            <div className="relative my-1 flex h-36 w-full items-center justify-center sm:my-2 sm:h-64">
              <div className="bg-iris-wash absolute h-40 w-40 rounded-full blur-2xl" />
              <div className="collector-figure-hover relative h-full w-28 sm:w-48">
                <NextImage
                  src="/figurines/base-female.png"
                  alt="Wujud Perempuan"
                  fill
                  sizes="200px"
                  draggable={false}
                  className="object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)] filter select-none"
                />
              </div>
              <div className="absolute bottom-0 h-3.5 w-28 rounded-full bg-[#1b1c1a]/18 blur-[3px]" />
            </div>

            {/* Label & Detail */}
            <div className="border-line z-10 w-full border-t pt-3 text-center">
              <div className="text-sm font-bold tracking-tight sm:text-lg">Perempuan</div>
            </div>
          </div>

          {/* Option 2: Laki-laki */}
          <div
            role="radio"
            aria-checked={selectedGender === "laki"}
            tabIndex={0}
            onClick={() => setSelectedGender("laki")}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedGender("laki");
              }
            }}
            className={`decision-tile group relative flex min-h-[260px] cursor-pointer flex-col items-center justify-between overflow-hidden rounded-[24px] p-3 backdrop-blur-md sm:min-h-[380px] sm:rounded-3xl sm:p-6 ${
              selectedGender === "laki"
                ? "border-iris bg-iris-wash ring-iris/20 border-2 shadow-[0_10px_28px_rgb(27_28_26_/_0.10)] ring-4"
                : "border-line bg-surface hover:border-iris/45 hover:bg-surface-raised border-2"
            }`}
          >
            {/* Badge Indicator */}
            <div className="z-10 flex w-full items-center justify-end">
              <div
                className={`ui-transition flex h-6 w-6 items-center justify-center rounded-full ${
                  selectedGender === "laki"
                    ? "bg-iris text-canvas shadow-sm"
                    : "border-line border-2"
                }`}
              >
                {selectedGender === "laki" && (
                  <svg
                    className="h-3.5 w-3.5 stroke-[3]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>

            {/* Figurine Display Area with Cutout & Shadow */}
            <div className="relative my-1 flex h-36 w-full items-center justify-center sm:my-2 sm:h-64">
              <div className="bg-iris-wash absolute h-40 w-40 rounded-full blur-2xl" />
              <div className="collector-figure-hover relative h-full w-28 sm:w-48">
                <NextImage
                  src="/figurines/base-male.png"
                  alt="Wujud Laki-laki"
                  fill
                  sizes="200px"
                  draggable={false}
                  className="object-contain object-bottom drop-shadow-[0_16px_28px_rgba(0,0,0,0.22)] filter select-none"
                />
              </div>
              <div className="absolute bottom-0 h-3.5 w-28 rounded-full bg-[#1b1c1a]/18 blur-[3px]" />
            </div>

            {/* Label & Detail */}
            <div className="border-line z-10 w-full border-t pt-3 text-center">
              <div className="text-sm font-bold tracking-tight sm:text-lg">Laki-laki</div>
            </div>
          </div>
        </div>

        {/*
          The disclosure stays even though the checkbox is gone. Starting the run
          still sends `consent` and `experimentalAcknowledged`, so the limits
          behind that acknowledgment have to be on screen before the button, not
          only in the privacy page.
        */}
        <p className="text-ink-muted mb-6 w-full max-w-md text-center text-xs leading-relaxed">
          Untuk usia {combinedJourneyMinimumAge} tahun ke atas. Dengan memulai, jawabanmu diproses
          untuk menghasilkan refleksi pribadi. Sebagian lensa masih eksperimental dan belum melewati
          validasi formal. Hasil bukan diagnosis dan tetap privat.
        </p>

        {/* Action Button */}
        <div className="flex w-full max-w-md flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleProceed}
            disabled={!canProceed}
            className="pressable focus-ring bg-iris text-canvas hover:bg-iris-deep disabled:bg-line-strong disabled:text-ink-muted flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-[18px] font-bold tracking-wide shadow-[0_8px_20px_rgb(27_28_26_/_0.14)] disabled:cursor-not-allowed disabled:shadow-none"
          >
            <span>{pending ? "Menyiapkan pertanyaan…" : "Testlensa"}</span>
            <svg
              className="h-5 w-5 stroke-[2.5]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>

          {error ? (
            <p
              className="bg-danger-soft text-danger border-danger/20 w-full rounded-[14px] border px-4 py-3 text-sm"
              role="alert"
            >
              {error}
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
