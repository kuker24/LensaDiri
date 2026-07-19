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
import { isPubliclyAvailableModule } from "@/lib/assessment/catalog";
import {
  estimateModularAssessment,
  getAssessmentCatalog,
  getComboCatalog,
} from "@/lib/assessment/client";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import { saveAssessmentSelection } from "@/lib/assessment/selection-storage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const tierLabels: Record<string, string> = {
  A: "Evidence A",
  B: "Evidence B",
  B_EXPERIMENTAL: "Evidence B · eksperimental",
  C: "Lensa reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

const errorLabels: Record<string, string> = {
  age_restricted: "Pilihan ini memiliki batas usia yang belum terpenuhi.",
  assessment_service_busy: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
  coverage_unavailable: "Kombinasi ini membutuhkan coverage di atas kapasitas mode terpilih.",
  experimental_acknowledgment_required: "Konfirmasi lensa eksperimental sebelum melanjutkan.",
  feature_unavailable: "Assessment modular belum tersedia untuk publik.",
  invalid_module_count: "Pilih satu lensa atau beberapa lensa untuk combo.",
  mode_unavailable: "Mode ini belum tersedia.",
  module_unavailable: "Salah satu lensa belum tersedia.",
  preset_mismatch: "Isi preset tidak sesuai katalog terbaru.",
  preset_unavailable: "Preset ini belum tersedia.",
  rate_limit_unavailable: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
  request_failed: "Estimasi belum dapat dihitung. Coba lagi.",
  selection_type_mismatch: "Pilihan lensa dan jenis eksplorasi tidak cocok.",
  service_temporarily_busy: "Sistem sedang sibuk. Coba lagi beberapa saat.",
};

function publicError(error: unknown): string {
  const code = error instanceof Error ? error.message : "request_failed";
  return errorLabels[code] ?? errorLabels.request_failed!;
}

export function ModularStartForm({ initialModuleKey }: { initialModuleKey?: string }) {
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
        const initial = catalog.modules.find(
          (module) => module.key === initialModuleKey && isPubliclyAvailableModule(module),
        );
        const first = initial ?? catalog.modules.find(isPubliclyAvailableModule);
        setEstimate(null);
        setError(null);
        setEstimating(Boolean(first));
        setSelectedKeys(first ? [first.key] : []);
      })
      .catch(() => setError("Katalog modular belum dapat dimuat."))
      .finally(() => setLoading(false));
  }, [initialModuleKey]);

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
      estimateModularAssessment(selection)
        .then((value) => {
          if (active) setEstimate(value);
        })
        .catch((caught) => {
          if (active) setError(publicError(caught));
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

  function prepareEstimate(hasSelection = selectedKeys.length > 0) {
    setEstimate(null);
    setError(null);
    setEstimating(hasSelection);
  }

  function updateSelection(nextKeys: string[]) {
    prepareEstimate(nextKeys.length > 0);
    setSelectedKeys(nextKeys);
  }

  function toggleModule(key: string) {
    setPresetKey(null);
    updateSelection(
      selectedKeys.includes(key)
        ? selectedKeys.filter((item) => item !== key)
        : [...selectedKeys, key],
    );
  }

  function selectPreset(combo: ComboPresetDefinition) {
    setPresetKey(combo.key);
    updateSelection([...combo.moduleKeys]);
    setMode(combo.recommendedMode);
  }

  function continueToReview() {
    if (!selection || !estimate) return;
    saveAssessmentSelection(selection);
    router.push("/start/review");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16" role="status">
        <span className="sr-only">Memuat katalog assessment…</span>
        <div aria-hidden="true" className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="max-w-3xl">
        <p className="text-lens text-sm font-semibold">Assessment modular</p>
        <h1 className="font-display mt-3 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Pilih lensa yang ingin kamu pahami.
        </h1>
        <p className="text-ink-muted mt-5 max-w-2xl text-lg leading-8">
          Setiap lensa memakai item dan scoring independen. Hubungan antar-lensa baru dibaca setelah
          skor primer selesai.
        </p>
      </div>

      <section className="mt-10" aria-labelledby="module-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold" id="module-heading">
              Lensa tersedia
            </h2>
            <p className="text-ink-muted mt-2">Pilih satu atau buat combo sendiri.</p>
          </div>
          <label className="flex items-center gap-3 text-sm font-medium">
            Usia <span className="sr-only">wajib</span>
            <Input
              className="w-24"
              inputMode="numeric"
              max={99}
              min={13}
              onChange={(event) => {
                prepareEstimate();
                setAge(event.target.value ? Number(event.target.value) : null);
              }}
              placeholder="13+"
              required
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
                className={`focus-within:ring-lens-soft flex cursor-pointer gap-4 rounded-lg border bg-white/90 p-5 shadow-[0_1px_2px_rgb(23_24_44_/_0.04)] transition-[border-color,background-color] duration-150 ease-out focus-within:ring-3 ${selected ? "border-lens bg-lens-soft/60" : "border-line hover:border-lens/50"}`}
                key={module.key}
              >
                <input
                  checked={selected}
                  className="accent-lens mt-1 h-5 w-5"
                  onChange={() => toggleModule(module.key)}
                  type="checkbox"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{module.publicName}</span>
                    <Badge tone="lens">{tierLabels[module.evidenceTier]}</Badge>
                    {module.status === "pilot" ? <Badge tone="aperture">Beta</Badge> : null}
                    {module.status === "experimental" ? (
                      <Badge tone="warning">Eksperimental</Badge>
                    ) : null}
                  </span>
                  <span className="text-ink-muted mt-2 block text-sm leading-6">
                    {module.description}
                  </span>
                  <span className="text-ink-muted mt-2 block text-xs font-semibold">
                    Usia minimum {module.minimumAge}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      {combos.length > 0 ? (
        <section className="mt-10" aria-labelledby="combo-heading">
          <h2 className="font-display text-2xl font-semibold" id="combo-heading">
            Preset combo
          </h2>
          <div className="mt-5 flex flex-wrap gap-4">
            {combos.map((combo) => (
              <button
                aria-pressed={presetKey === combo.key}
                className="focus-ring border-line hover:border-lens/50 aria-pressed:border-lens aria-pressed:bg-lens-soft min-w-[min(100%,18rem)] flex-1 rounded-lg border bg-white/90 p-5 text-left shadow-[0_1px_2px_rgb(23_24_44_/_0.04)] transition-[border-color,background-color] duration-150 ease-out"
                key={combo.key}
                onClick={() => selectPreset(combo)}
                type="button"
              >
                <span className="font-semibold">{combo.publicName}</span>
                <span className="text-ink-muted mt-2 block text-sm leading-6">
                  {combo.description}
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-10" aria-labelledby="mode-heading">
        <h2 className="font-display text-2xl font-semibold" id="mode-heading">
          Kedalaman
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {modes.map((profile) => (
            <button
              aria-pressed={mode === profile.internalMode}
              className="focus-ring border-line hover:border-lens/50 aria-pressed:border-lens aria-pressed:bg-lens-soft rounded-lg border bg-white/90 p-5 text-left shadow-[0_1px_2px_rgb(23_24_44_/_0.04)] transition-[border-color,background-color] duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!profile.isSelectable}
              key={profile.internalMode}
              onClick={() => {
                prepareEstimate();
                setMode(profile.internalMode);
              }}
              type="button"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-lg font-semibold">{profile.publicName}</span>
                {profile.internalMode === "standard" ? (
                  <span className="text-lens text-xs font-semibold">Recommended</span>
                ) : null}
              </span>
              <span className="text-ink-muted mt-2 block text-sm leading-6">
                {profile.description}
              </span>
              {!profile.isSelectable ? (
                <span className="text-ink-muted mt-2 block text-xs font-semibold">
                  Belum dibuka
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {modules.some((module) => selectedKeys.includes(module.key) && module.isExperimental) ? (
        <label className="border-aperture-soft bg-aperture-soft text-ink mt-6 flex items-start gap-3 rounded-md border p-4 text-sm leading-6">
          <input
            checked={experimentalAcknowledged}
            className="accent-aperture mt-1 h-5 w-5"
            onChange={(event) => {
              prepareEstimate();
              setExperimentalAcknowledged(event.target.checked);
            }}
            type="checkbox"
          />
          Aku memahami lensa eksperimental yang dipilih belum memiliki validasi formal, bukan
          instrumen resmi, dan hanya digunakan untuk refleksi.
        </label>
      ) : null}

      <aside className="lens-glow text-canvas shadow-surface relative mt-10 overflow-hidden rounded-xl bg-[#4c3ec2] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8">
        <div aria-live="polite">
          <p className="text-aperture-on-dark font-semibold">Estimasi dari server</p>
          {estimating ? (
            <p className="text-canvas/85 mt-2">Menghitung pilihan…</p>
          ) : estimate ? (
            <>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {estimate.itemCount} item · sekitar {estimate.estimatedMinutes} menit
              </p>
              <p className="text-canvas/85 mt-2 max-w-2xl text-sm leading-6">
                {estimate.disclaimer}
              </p>
            </>
          ) : (
            <p className="text-canvas/85 mt-2">Pilih lensa untuk melihat estimasi.</p>
          )}
          {error ? (
            <p className="text-danger-soft mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <Button
          className="bg-canvas text-lens-strong mt-5 w-full shrink-0 border-transparent hover:bg-white sm:mt-0 sm:w-auto"
          disabled={!estimate || estimating}
          onClick={continueToReview}
          type="button"
          variant="secondary"
        >
          Tinjau pilihan
        </Button>
      </aside>
    </div>
  );
}
