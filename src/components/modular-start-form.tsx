"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type {
  AssessmentMode,
  AssessmentModeProfile,
  AssessmentModuleDefinition,
  AssessmentSelectionInput,
  ComboPresetDefinition,
} from "@/lib/assessment/catalog";
import {
  estimateModularAssessment,
  getAssessmentCatalog,
  getComboCatalog,
} from "@/lib/assessment/client";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import { saveAssessmentSelection } from "@/lib/assessment/selection-storage";

const tierLabels: Record<string, string> = {
  A: "Evidence A",
  B: "Evidence B",
  B_EXPERIMENTAL: "Evidence B · eksperimental",
  C: "Lensa reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

const errorLabels: Record<string, string> = {
  age_restricted: "Pilihan ini memiliki batas usia yang belum terpenuhi.",
  experimental_acknowledgment_required: "Konfirmasi lensa eksperimental sebelum melanjutkan.",
  feature_unavailable: "Assessment modular belum tersedia untuk publik.",
  invalid_module_count: "Pilih satu lensa atau beberapa lensa untuk combo.",
  mode_unavailable: "Mode ini belum tersedia.",
  module_unavailable: "Salah satu lensa belum tersedia.",
  preset_mismatch: "Isi preset tidak sesuai katalog terbaru.",
  preset_unavailable: "Preset ini belum tersedia.",
  request_failed: "Estimasi belum dapat dihitung. Coba lagi.",
  selection_type_mismatch: "Pilihan lensa dan jenis eksplorasi tidak cocok.",
};

function publicError(error: unknown): string {
  const code = error instanceof Error ? error.message : "request_failed";
  return errorLabels[code] ?? errorLabels.request_failed!;
}

export function ModularStartForm() {
  const router = useRouter();
  const [modules, setModules] = useState<AssessmentModuleDefinition[]>([]);
  const [modes, setModes] = useState<AssessmentModeProfile[]>([]);
  const [combos, setCombos] = useState<ComboPresetDefinition[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [mode, setMode] = useState<AssessmentMode>("standard");
  const [age, setAge] = useState<number | null>(18);
  const [experimentalAcknowledged, setExperimentalAcknowledged] = useState(false);
  const [estimate, setEstimate] = useState<AssessmentEstimate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [estimating, setEstimating] = useState(false);

  useEffect(() => {
    Promise.all([getAssessmentCatalog(), getComboCatalog()])
      .then(([catalog, comboCatalog]) => {
        setModules(catalog.modules);
        setModes(catalog.modes);
        setCombos(comboCatalog);
        const first = catalog.modules[0];
        if (first) setSelectedKeys([first.key]);
      })
      .catch(() => setError("Katalog modular belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, []);

  const selection = useMemo<AssessmentSelectionInput | null>(() => {
    if (selectedKeys.length === 0) return null;
    const selectedPreset = combos.find((combo) => combo.key === presetKey);
    return {
      age,
      experimentalAcknowledged,
      mode,
      moduleKeys: selectedKeys,
      presetKey,
      selectionType: selectedPreset
        ? selectedPreset.isFullSpectrum
          ? "full_spectrum"
          : "preset_combo"
        : selectedKeys.length === 1
          ? "single"
          : "custom_combo",
    };
  }, [age, combos, experimentalAcknowledged, mode, presetKey, selectedKeys]);

  useEffect(() => {
    if (!selection) return;
    let active = true;
    const timeout = window.setTimeout(() => {
      setEstimating(true);
      setError(null);
      estimateModularAssessment(selection)
        .then((value) => {
          if (active) setEstimate(value);
        })
        .catch((caught) => {
          if (active) {
            setEstimate(null);
            setError(publicError(caught));
          }
        })
        .finally(() => {
          if (active) setEstimating(false);
        });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [selection]);

  function toggleModule(key: string) {
    setPresetKey(null);
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  function selectPreset(combo: ComboPresetDefinition) {
    setPresetKey(combo.key);
    setSelectedKeys([...combo.moduleKeys]);
    setMode(combo.recommendedMode);
  }

  function continueToReview() {
    if (!selection || !estimate) return;
    saveAssessmentSelection(selection);
    router.push("/start/review");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16" aria-label="Memuat katalog">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-violet-100" />
        <div className="h-36 animate-pulse rounded-2xl bg-white" />
        <div className="h-36 animate-pulse rounded-2xl bg-white" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold text-violet-700">Assessment modular</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pilih lensa yang ingin kamu pahami.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
          Setiap lensa memakai item dan scoring independen. Hubungan antar-lensa baru dibaca setelah
          skor primer selesai.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="module-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold" id="module-heading">
              Lensa tersedia
            </h2>
            <p className="mt-2 text-[var(--muted)]">Pilih satu atau buat combo sendiri.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            Usia <span className="sr-only">opsional</span>
            <input
              className="focus-ring w-24 rounded-xl border border-[var(--line)] bg-white px-3 py-2"
              inputMode="numeric"
              max={99}
              min={13}
              onChange={(event) => setAge(event.target.value ? Number(event.target.value) : null)}
              placeholder="13+"
              type="number"
              value={age ?? ""}
            />
          </label>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {modules.map((module) => {
            const selected = selectedKeys.includes(module.key);
            return (
              <label
                className={`flex cursor-pointer gap-4 rounded-2xl border bg-white p-5 transition focus-within:ring-3 focus-within:ring-violet-200 ${selected ? "border-violet-600 bg-violet-50" : "border-[var(--line)] hover:border-violet-300"}`}
                key={module.key}
              >
                <input
                  checked={selected}
                  className="mt-1 h-5 w-5 accent-violet-700"
                  onChange={() => toggleModule(module.key)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{module.publicName}</span>
                    <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-900">
                      {tierLabels[module.evidenceTier]}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                    {module.description}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {combos.length > 0 ? (
        <section className="mt-10" aria-labelledby="combo-heading">
          <h2 className="text-2xl font-semibold" id="combo-heading">
            Preset combo
          </h2>
          <div className="mt-5 flex flex-wrap gap-4">
            {combos.map((combo) => (
              <button
                aria-pressed={presetKey === combo.key}
                className="focus-ring min-w-[min(100%,18rem)] flex-1 rounded-2xl border border-[var(--line)] bg-white p-5 text-left hover:border-violet-300 aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
                key={combo.key}
                onClick={() => selectPreset(combo)}
                type="button"
              >
                <span className="font-semibold">{combo.publicName}</span>
                <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                  {combo.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="mode-heading">
        <h2 className="text-2xl font-semibold" id="mode-heading">
          Kedalaman
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {modes.map((profile) => (
            <button
              aria-pressed={mode === profile.internalMode}
              className="focus-ring rounded-2xl border border-[var(--line)] bg-white p-5 text-left hover:border-violet-300 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:border-violet-700 aria-pressed:bg-violet-50"
              disabled={!profile.isSelectable}
              key={profile.internalMode}
              onClick={() => setMode(profile.internalMode)}
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold">{profile.publicName}</span>
                {profile.internalMode === "standard" ? (
                  <span className="text-xs font-semibold text-violet-700">Recommended</span>
                ) : null}
              </span>
              <span className="mt-2 block text-sm leading-6 text-[var(--muted)]">
                {profile.description}
              </span>
              {!profile.isSelectable ? (
                <span className="mt-2 block text-xs font-semibold text-[var(--muted)]">
                  Belum dibuka
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {modules.some((module) => selectedKeys.includes(module.key) && module.isExperimental) ? (
        <label className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <input
            checked={experimentalAcknowledged}
            className="mt-1 h-5 w-5"
            onChange={(event) => setExperimentalAcknowledged(event.target.checked)}
            type="checkbox"
          />
          Aku memahami lensa eksperimental belum memiliki validasi formal dan hanya untuk refleksi.
        </label>
      ) : null}

      <aside className="mt-10 rounded-2xl bg-[var(--foreground)] p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div aria-live="polite">
          <p className="font-semibold text-[var(--aqua)]">Estimasi dari server</p>
          {estimating ? (
            <p className="mt-2 text-indigo-100">Menghitung pilihan…</p>
          ) : estimate ? (
            <>
              <p className="mt-2 text-xl font-semibold">
                {estimate.itemCount} item · sekitar {estimate.estimatedMinutes} menit
              </p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-indigo-100">
                {estimate.disclaimer}
              </p>
            </>
          ) : (
            <p className="mt-2 text-indigo-100">Pilih lensa untuk melihat estimasi.</p>
          )}
          {error ? (
            <p className="mt-3 text-sm text-rose-200" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <button
          className="focus-ring mt-5 min-h-12 w-full shrink-0 rounded-xl bg-white px-5 font-semibold text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto"
          disabled={!estimate || estimating}
          onClick={continueToReview}
          type="button"
        >
          Tinjau pilihan
        </button>
      </aside>
    </div>
  );
}
