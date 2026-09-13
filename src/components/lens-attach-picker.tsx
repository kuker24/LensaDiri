"use client";

import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { StageCode } from "@/components/result-podium";
import { continueIdentityJourney, getIdentityJourney } from "@/lib/assessment/client";
import { getStoredGender } from "@/lib/assessment/gender-storage";
import { getIdentityJourneyAccess } from "@/lib/assessment/journey-storage";
import type { IdentityJourneyView } from "@/server/repositories/identity-journeys";

export type LensAttachPickerProps = {
  resultToken: string;
  onBack?: () => void;
  onDone?: () => void;
  temperamentCode?: StageCode;
};

const LABELS = {
  type_16: { name: "16-Type", description: "Gaya kognitif dan kelompok visual." },
  enneagram: { name: "Enneagram", description: "Motivasi, tiga pusat, dan insting." },
  socionics_communication: {
    name: "Socionics-inspired",
    description: "Pola pemrosesan informasi dan interaksi eksperimental.",
  },
  trait_profile: { name: "Big Five / SLOAN", description: "Lima spektrum trait dan kode SLOAN." },
  psychosophy: {
    name: "Attitudinal Psyche",
    description: "Urutan F, E, L, dan V eksperimental.",
  },
} as const;

const STAGE = {
  NT: { fill: "#6eb5ff", ink: "#0b2f52" },
  NF: { fill: "#e882b4", ink: "#681847" },
  SJ: { fill: "#6bbf7a", ink: "#002109" },
  SP: { fill: "#f4845f", ink: "#6c1e02" },
  NEUTRAL: { fill: "#e4e2de", ink: "#30312e" },
} as const;

export function LensAttachPicker({
  resultToken,
  onBack,
  onDone,
  temperamentCode = "NEUTRAL",
}: LensAttachPickerProps) {
  const router = useRouter();
  const [access] = useState(() => getIdentityJourneyAccess());
  const [journey, setJourney] = useState<IdentityJourneyView | null>(null);
  const [failed, setFailed] = useState(() => !access);
  const [pending, setPending] = useState(false);
  const [experimentalAcknowledged, setExperimentalAcknowledged] = useState(false);
  const stage = STAGE[temperamentCode];
  const gender = getStoredGender();

  useEffect(() => {
    if (!access) return;
    let active = true;
    getIdentityJourney(access.token)
      .then((value) => {
        if (active) setJourney(value);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [access]);

  const available = journey?.steps.find((step) => step.status === "available");
  const needsExperimentalConsent = Boolean(available);

  async function startNextTest() {
    if (!access || !available || pending) return;
    if (needsExperimentalConsent && !experimentalAcknowledged) return;
    setPending(true);
    setFailed(false);
    try {
      const next = await continueIdentityJourney({
        age: access.age,
        experimentalAcknowledged,
        journeyToken: access.token,
      });
      router.push(`/test/${next.token}`);
    } catch {
      setFailed(true);
      setPending(false);
    }
  }

  function showCollection() {
    if (onDone) onDone();
    else router.push(`/result/${resultToken}`);
  }

  return (
    <main className="bg-canvas text-ink min-h-screen px-5 py-7 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <section className="border-line bg-surface rounded-[28px] border p-5 shadow-[0_14px_36px_rgb(27_28_26_/_0.08)]">
          <div className="bg-surface-raised relative aspect-[4/5] overflow-hidden rounded-[20px]">
            <div className="absolute inset-0 opacity-25" style={{ backgroundColor: stage.fill }} />
            <NextImage
              src={gender === "laki" ? "/figurines/base-male.png" : "/figurines/base-female.png"}
              alt="Figurine dengan atribut dari lensa yang telah selesai"
              fill
              sizes="(max-width: 1024px) 90vw, 420px"
              className="object-contain object-bottom p-5 drop-shadow-[0_14px_22px_rgb(27_28_26_/_0.18)]"
            />
          </div>
          <p className="text-ink-muted mt-4 text-center text-sm">
            {journey?.identity.line || "Memuat identitas yang sudah terbentuk…"}
          </p>
        </section>

        <section aria-labelledby="journey-heading">
          <p
            className="mb-2 font-mono text-xs font-bold tracking-[0.12em] uppercase"
            style={{ color: stage.ink }}
          >
            Perjalanan 5 lensa
          </p>
          <h1 id="journey-heading" className="font-display text-4xl uppercase sm:text-5xl">
            Workbench Polamu
          </h1>
          <p className="text-ink-muted mt-3 max-w-xl leading-7">
            Kerjakan satu per satu. Empat lensa lanjutan boleh ditunda, dan hasil parsial tetap
            tersimpan.
          </p>

          <ol aria-label="Progres koleksi" className="mt-7 space-y-3">
            {journey?.steps.map((step) => {
              const label = LABELS[step.moduleKey];
              const current = step.status === "available" || step.status === "active";
              return (
                <li
                  key={step.moduleKey}
                  aria-current={current ? "step" : undefined}
                  className="border-line bg-surface flex items-start gap-4 rounded-[18px] border p-4"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-bold"
                    style={{
                      backgroundColor: step.status === "completed" ? stage.fill : "#f5f3ef",
                      color: stage.ink,
                    }}
                  >
                    {step.status === "completed" ? "✓" : step.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-bold">{label.name}</span>
                    <span className="text-ink-muted mt-1 block text-sm">{label.description}</span>
                  </span>
                  <span className="text-ink-muted text-xs font-semibold uppercase">
                    {step.status === "completed"
                      ? "Selesai"
                      : step.status === "available"
                        ? "Berikutnya"
                        : step.status === "active"
                          ? "Aktif"
                          : "Terkunci"}
                  </span>
                </li>
              );
            })}
          </ol>

          {needsExperimentalConsent ? (
            <label className="border-line bg-surface mt-5 flex items-start gap-3 rounded-[16px] border p-4 text-sm">
              <input
                type="checkbox"
                checked={experimentalAcknowledged}
                onChange={(event) => setExperimentalAcknowledged(event.target.checked)}
                className="mt-1 h-4 w-4"
              />
              <span>
                Aku memahami lensa berikut bersifat eksperimental, belum tervalidasi formal, dan
                hanya untuk refleksi.
              </span>
            </label>
          ) : null}

          {failed ? (
            <p role="alert" className="text-danger mt-4 text-sm">
              Perjalanan tidak dapat dimuat. Coba lagi.
            </p>
          ) : null}
          {!journey && !failed ? (
            <p role="status" className="text-ink-muted mt-4">
              Memuat progres…
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {available ? (
              <button
                type="button"
                onClick={startNextTest}
                disabled={pending || (needsExperimentalConsent && !experimentalAcknowledged)}
                className="pressable focus-ring min-h-12 flex-1 rounded-full px-6 font-bold disabled:cursor-not-allowed disabled:opacity-45"
                style={{ backgroundColor: stage.fill, color: stage.ink }}
              >
                {pending ? "Menyiapkan tes…" : `Mulai ${LABELS[available.moduleKey].name}`}
              </button>
            ) : null}
            <button
              type="button"
              onClick={showCollection}
              className="focus-ring border-line bg-surface min-h-12 rounded-full border px-6 font-semibold"
            >
              Simpan dan lihat koleksi
            </button>
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="focus-ring min-h-12 px-4 font-semibold"
              >
                Kembali
              </button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
