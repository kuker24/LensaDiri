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
  type AssessmentCatalog,
} from "@/lib/assessment/client";
import { estimateAssessment, type AssessmentEstimate } from "@/lib/assessment/estimate";
import { saveAssessmentSelection } from "@/lib/assessment/selection-storage";
import { getAssessmentStartErrorMessage } from "@/lib/assessment/start-errors";
import { AuthApiError } from "@/lib/auth/client";
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

function pickInitialModuleKeys(
  modules: readonly AssessmentModuleDefinition[],
  initialModuleKey?: string,
): string[] {
  const initial = modules.find(
    (module) => module.key === initialModuleKey && isPubliclyAvailableModule(module),
  );
  const first = initial ?? modules.find(isPubliclyAvailableModule);
  return first ? [first.key] : [];
}

function localEstimate(
  selection: AssessmentSelectionInput,
  modules: readonly AssessmentModuleDefinition[],
  combos: readonly ComboPresetDefinition[],
  modes: readonly AssessmentModeProfile[],
): { estimate: AssessmentEstimate | null; error: string | null } {
  const result = estimateAssessment(selection, modules, combos, modes, {
    provisionalPrecisionEnabled: false,
  });
  if (result.success) {
    return { estimate: result.estimate, error: null };
  }
  return {
    estimate: null,
    error: getAssessmentStartErrorMessage(result.code),
  };
}

export function ModularStartForm({
  initialCatalog,
  initialCombos,
  initialModuleKey,
}: {
  initialCatalog?: AssessmentCatalog;
  initialCombos?: ComboPresetDefinition[];
  initialModuleKey?: string;
}) {
  const router = useRouter();
  const hasServerCatalog = Boolean(initialCatalog);
  const [modules, setModules] = useState<AssessmentModuleDefinition[]>(
    () => initialCatalog?.modules ?? [],
  );
  const [modes, setModes] = useState<AssessmentModeProfile[]>(() => initialCatalog?.modes ?? []);
  const [combos, setCombos] = useState<ComboPresetDefinition[]>(() => initialCombos ?? []);
  const [selectedKeys, setSelectedKeys] = useState<string[]>(() =>
    pickInitialModuleKeys(initialCatalog?.modules ?? [], initialModuleKey),
  );
  const [presetKey, setPresetKey] = useState<string | null>(null);
  const [mode, setMode] = useState<AssessmentMode>("standard");
  const [age, setAge] = useState<number | null>(18);
  const [experimentalAcknowledged, setExperimentalAcknowledged] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectionRejected, setSelectionRejected] = useState(false);
  const [loading, setLoading] = useState(() => !hasServerCatalog);
  const [validating, setValidating] = useState(false);
  const [catalogRequest, setCatalogRequest] = useState(0);

  useEffect(() => {
    // Server already hydrated the picker; only hit the client APIs on retry or
    // when SSR catalog was unavailable (so we never stick on an empty skeleton).
    if (hasServerCatalog && catalogRequest === 0) {
      return;
    }

    let active = true;
    getAssessmentCatalog()
      .then((catalog) => {
        if (!active) return;
        setModules(catalog.modules);
        setModes(catalog.modes);
        setCombos(catalog.combos);
        const nextKeys = pickInitialModuleKeys(catalog.modules, initialModuleKey);
        setCatalogError(null);
        setSelectedKeys(nextKeys);
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalogError(
            error instanceof AuthApiError && error.code === "feature_unavailable"
              ? getAssessmentStartErrorMessage(error.code)
              : "Katalog modular belum dapat dimuat.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [catalogRequest, hasServerCatalog, initialModuleKey]);

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

  // Preview stays instant; the continue action still requires authoritative server capacity.
  const { estimate, error: selectionError } = useMemo(() => {
    if (!selection || modules.length === 0 || modes.length === 0) {
      return { estimate: null, error: null as string | null };
    }
    return localEstimate(selection, modules, combos, modes);
  }, [combos, modes, modules, selection]);

  const error = catalogError ?? selectionError ?? validationError;

  function updateSelection(nextKeys: string[]) {
    setValidationError(null);
    setSelectionRejected(false);
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

  async function continueToReview() {
    if (!selection || !estimate) return;
    setValidating(true);
    setValidationError(null);
    try {
      await estimateModularAssessment(selection);
      saveAssessmentSelection(selection);
      router.push("/start/review");
    } catch (error) {
      const code = error instanceof AuthApiError ? error.code : "request_failed";
      setValidationError(getAssessmentStartErrorMessage(code));
      setSelectionRejected(
        ![
          "assessment_service_busy",
          "csrf_invalid",
          "rate_limited",
          "request_failed",
          "service_temporarily_busy",
          "service_unavailable",
        ].includes(code),
      );
      setValidating(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-16" role="status">
        <span className="sr-only">Memuat pilihan lensa…</span>
        <div aria-hidden="true" className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-36 rounded-[16px]" />
          <Skeleton className="h-36 rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (catalogError && modules.length === 0) {
    return (
      <RecoveryPanel
        description={catalogError}
        onRetry={() => {
          setCatalogError(null);
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
    <div className="mx-auto max-w-4xl pb-28 sm:pb-8">
      <div className="max-w-2xl">
        <p className="mono-label text-ink">Susun eksplorasi</p>
        <h1 className="mt-4 text-4xl font-normal tracking-[-0.035em] sm:text-5xl">
          Apa yang ingin kamu pahami?
        </h1>
        <p className="text-ink-muted mt-4 max-w-2xl leading-7">
          Satu lensa atau beberapa. Tiap lensa dinilai sendiri, lalu dibaca bersama.
        </p>
      </div>

      <ol
        aria-label="Langkah penyusunan"
        className="mt-8 flex flex-wrap gap-2 border-y border-white/12 py-4"
      >
        {[
          ["01", "Lensa"],
          ["02", "Kedalaman"],
          ["03", "Tinjau"],
        ].map(([step, label]) => (
          <li
            className="border-line bg-surface text-ink-muted inline-flex min-h-11 items-center gap-2 rounded-[12px] border px-3 text-xs font-medium tracking-[-0.01em]"
            key={step}
          >
            <span className="text-ink tabular-nums">{step}</span>
            <span>{label}</span>
          </li>
        ))}
      </ol>

      {combos.length > 0 ? (
        <details className="border-line mt-8 border-y py-4">
          <summary className="focus-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 font-medium [&::-webkit-details-marker]:hidden">
            <span>Butuh pilihan cepat? Gunakan pilihan siap pakai</span>
            <span aria-hidden="true" className="text-ink-muted font-mono text-lg">
              +
            </span>
          </summary>
          <div className="mt-3 grid gap-px overflow-hidden rounded-[16px] border border-white/14 bg-white/14 sm:grid-cols-2">
            {combos.map((combo) => (
              <button
                aria-pressed={presetKey === combo.key}
                className="focus-ring decision-tile bg-canvas aria-pressed:bg-surface-raised hover:bg-surface min-h-28 p-4 text-left disabled:opacity-50"
                disabled={validating}
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
            <h2 className="text-xl font-normal tracking-[-0.02em]" id="module-heading">
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
              disabled={validating}
              onChange={(event) => {
                setValidationError(null);
                setSelectionRejected(false);
                setAge(event.target.value ? Number(event.target.value) : null);
              }}
              placeholder="13+"
              required
              type="number"
              value={age ?? ""}
            />
          </label>
        </div>
        <div className="border-line mt-5 overflow-hidden rounded-[16px] border">
          {modules.map((module) => {
            const selected = selectedKeys.includes(module.key);
            const available = isPubliclyAvailableModule(module);
            const selectionLimitReached = selectedKeys.length >= 10 && !selected;
            return (
              <label
                className={`focus-within:ring-frost decision-tile relative flex min-h-28 cursor-pointer gap-4 border-b p-4 last:border-b-0 focus-within:z-10 focus-within:ring-2 sm:p-5 ${selected ? "border-line bg-surface-raised" : "border-line bg-canvas hover:bg-surface"}`}
                key={module.key}
              >
                <input
                  checked={selected}
                  className="accent-lens mt-1 h-5 w-5"
                  disabled={!available || selectionLimitReached || validating}
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
                    {available
                      ? `Usia minimum ${module.minimumAge}`
                      : (module.availabilityReason ?? "Belum tersedia")}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="mt-10" aria-labelledby="mode-heading">
        <h2 className="text-xl font-normal tracking-[-0.02em]" id="mode-heading">
          2. Pilih kedalaman
        </h2>
        <div className="border-line mt-5 grid overflow-hidden rounded-[16px] border sm:grid-cols-3">
          {modes.map((profile) => (
            <button
              aria-pressed={mode === profile.internalMode}
              className="focus-ring decision-tile border-line bg-canvas aria-pressed:bg-surface-raised hover:bg-surface min-h-32 border-b p-4 text-left last:border-b-0 disabled:cursor-not-allowed disabled:opacity-50 sm:border-r sm:border-b-0 sm:last:border-r-0"
              disabled={!profile.isSelectable || validating}
              key={profile.internalMode}
              onClick={() => {
                setValidationError(null);
                setSelectionRejected(false);
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
        <label className="border-aperture-soft bg-aperture-soft text-ink mt-6 flex items-start gap-3 rounded-[12px] border p-4 text-sm leading-6">
          <input
            checked={experimentalAcknowledged}
            className="accent-aperture mt-1 h-5 w-5"
            disabled={validating}
            onChange={(event) => {
              setValidationError(null);
              setSelectionRejected(false);
              setExperimentalAcknowledged(event.target.checked);
            }}
            type="checkbox"
          />
          Aku memahami lensa eksperimental yang dipilih belum memiliki validasi formal, bukan
          instrumen resmi, dan hanya digunakan untuk refleksi.
        </label>
      ) : null}

      <aside className="lens-glow fixed inset-x-0 bottom-0 z-20 border-t border-white/20 px-4 py-4 sm:static sm:mt-10 sm:border-y sm:px-5">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
          <div aria-live="polite" className="min-w-0">
            <p className="mono-label text-ink">Pilihanmu</p>
            {estimate ? (
              <>
                <p className="mt-2 text-lg font-normal tabular-nums sm:text-xl">
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
            className="w-full shrink-0 sm:w-auto"
            disabled={!estimate || validating || selectionRejected}
            onClick={continueToReview}
            type="button"
          >
            {validating ? "Memeriksa pilihan…" : "Tinjau pilihan"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
