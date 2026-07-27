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
import { RecoveryPanel } from "@/components/recovery-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const tierLabels: Record<string, string> = {
  A: "Bukti A",
  B: "Reflektif B",
  B_EXPERIMENTAL: "Reflektif B · eksperimental",
  C: "Reflektif C",
  EXPERIMENTAL: "Eksperimental",
};

const errorLabels: Record<string, string> = {
  age_restricted: "Pilihan ini memiliki batas usia yang belum terpenuhi.",
  assessment_service_busy: "Permintaan belum dapat diproses. Coba lagi beberapa saat.",
  coverage_unavailable: "Jumlah pertanyaan melebihi kapasitas kedalaman yang dipilih.",
  experimental_acknowledgment_required: "Konfirmasi lensa eksperimental sebelum melanjutkan.",
  feature_unavailable: "Asesmen dengan beberapa lensa belum tersedia.",
  invalid_module_count: "Pilih satu lensa atau beberapa lensa untuk kombinasi.",
  mode_unavailable: "Kedalaman ini belum tersedia.",
  module_unavailable: "Salah satu lensa belum tersedia.",
  preset_mismatch: "Isi pilihan siap pakai tidak sesuai katalog terbaru.",
  preset_unavailable: "Pilihan siap pakai ini belum tersedia.",
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
  const [catalogRequest, setCatalogRequest] = useState(0);

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
  }, [catalogRequest, initialModuleKey]);

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
        <span className="sr-only">Memuat pilihan lensa…</span>
        <div aria-hidden="true" className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-36 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error && modules.length === 0) {
    return (
      <RecoveryPanel
        description="Katalog lensa belum dapat dihubungi. Coba lagi tanpa kehilangan pilihan sebelumnya."
        onRetry={() => {
          setError(null);
          setLoading(true);
          setCatalogRequest((request) => request + 1);
        }}
        reassurance="Belum ada pilihan yang diproses."
        safeHref="/start"
        safeLabel="Pilih jalur lain"
        title="Pilihan lensa belum dapat dimuat"
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="max-w-2xl">
        <p className="mono-label text-ink">Susun eksplorasi</p>
        <h1 className="mt-4 text-4xl font-normal tracking-[-0.035em] sm:text-5xl">
          Apa yang ingin kamu pahami?
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl leading-7">
          Satu lensa atau beberapa. Tiap lensa dinilai sendiri, lalu dibaca bersama.
        </p>
      </div>

      {combos.length > 0 ? (
        <details className="border-line mt-8 border-y py-4">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>Butuh pilihan cepat? Gunakan pilihan siap pakai</span>
            <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
              +
            </span>
          </summary>
          <div className="mt-3 grid gap-px overflow-hidden rounded-lg border border-white/14 bg-white/14 sm:grid-cols-2">
            {combos.map((combo) => (
              <button
                aria-pressed={presetKey === combo.key}
                className="focus-ring bg-canvas aria-pressed:bg-surface-raised hover:bg-surface min-h-28 p-4 text-left transition-colors duration-200 ease-out disabled:opacity-50"
                key={combo.key}
                onClick={() => selectPreset(combo)}
                type="button"
              >
                <span className="font-semibold">{combo.publicName}</span>
                <span className="text-ink-muted mt-1 block text-sm leading-6">
                  {combo.description}
                </span>
              </button>
            ))}
          </div>
        </details>
      ) : null}

      <section className="mt-10" aria-labelledby="module-heading">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-medium" id="module-heading">
              1. Pilih lensa
            </h2>
            <p className="text-ink-muted mt-1 text-sm">Satu lensa sudah cukup untuk mulai.</p>
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
        <div className="border-line mt-5 overflow-hidden rounded-lg border">
          {modules.map((module) => {
            const selected = selectedKeys.includes(module.key);
            return (
              <label
                className={`focus-within:ring-frost relative flex min-h-28 cursor-pointer gap-4 border-b p-4 transition-colors duration-200 ease-out last:border-b-0 focus-within:z-10 focus-within:ring-2 sm:p-5 ${selected ? "border-line bg-surface-raised" : "border-line bg-canvas hover:bg-surface"}`}
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
                    <span className="font-semibold sm:text-lg">{module.publicName}</span>
                    <Badge tone="lens">{tierLabels[module.evidenceTier]}</Badge>
                    {module.status === "pilot" ? <Badge tone="aperture">Uji terbatas</Badge> : null}
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

      <section className="mt-10" aria-labelledby="mode-heading">
        <h2 className="text-xl font-medium" id="mode-heading">
          2. Pilih kedalaman
        </h2>
        <div className="border-line mt-5 grid overflow-hidden rounded-lg border sm:grid-cols-3">
          {modes.map((profile) => (
            <button
              aria-pressed={mode === profile.internalMode}
              className="focus-ring border-line bg-canvas aria-pressed:bg-surface-raised hover:bg-surface min-h-32 border-b p-4 text-left transition-colors duration-200 ease-out last:border-b-0 disabled:cursor-not-allowed disabled:opacity-50 sm:border-r sm:border-b-0 sm:last:border-r-0"
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
                  <span className="text-ink font-mono text-[0.625rem] tracking-[-0.02em] uppercase">
                    Disarankan
                  </span>
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
        <label className="border-aperture-soft bg-aperture-soft text-ink mt-6 flex items-start gap-3 rounded-[2px] border p-4 text-sm leading-6">
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

      <aside className="lens-glow bg-surface mt-10 border-y border-white/20 px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:px-5">
        <div aria-live="polite">
          <p className="mono-label text-ink">Pilihanmu</p>
          {estimating ? (
            <p className="text-ink-muted mt-2">Menghitung pilihan…</p>
          ) : estimate ? (
            <>
              <p className="mt-2 text-xl font-semibold tabular-nums">
                {selectedKeys.length} lensa · {estimate.itemCount} pertanyaan · sekitar{" "}
                {estimate.estimatedMinutes} menit
              </p>
              <p className="text-ink-muted mt-1 max-w-2xl text-xs leading-5">
                {estimate.disclaimer}
              </p>
            </>
          ) : (
            <p className="text-ink-muted mt-2">Pilih lensa untuk melihat estimasi.</p>
          )}
          {error ? (
            <p className="text-danger mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <Button
          className="mt-5 w-full shrink-0 sm:mt-0 sm:w-auto"
          disabled={!estimate || estimating}
          onClick={continueToReview}
          type="button"
        >
          Tinjau pilihan
        </Button>
      </aside>
    </div>
  );
}
