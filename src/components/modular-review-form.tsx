"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AssessmentModuleDefinition } from "@/lib/assessment/catalog";
import {
  estimateModularAssessment,
  getAssessmentCatalog,
  startModularAssessment,
} from "@/lib/assessment/client";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import { loadAssessmentSelection } from "@/lib/assessment/selection-storage";
import { Button } from "@/components/ui/button";

export function ModularReviewForm() {
  const router = useRouter();
  const [estimate, setEstimate] = useState<AssessmentEstimate | null>(null);
  const [modules, setModules] = useState<AssessmentModuleDefinition[]>([]);
  const [consent, setConsent] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const selection = loadAssessmentSelection();
    if (!selection) {
      Promise.resolve().then(() => setError("Pilihan tidak ditemukan. Pilih lensa kembali."));
      return;
    }
    Promise.all([estimateModularAssessment(selection), getAssessmentCatalog()])
      .then(([assessmentEstimate, catalog]) => {
        setEstimate(assessmentEstimate);
        setModules(catalog.modules.filter((module) => selection.moduleKeys.includes(module.key)));
      })
      .catch(() => setError("Pilihan tidak lagi tersedia. Periksa katalog kembali."));
  }, []);

  async function start() {
    const selection = loadAssessmentSelection();
    if (!selection || !consent) return;
    setPending(true);
    setError(null);
    try {
      const token = await startModularAssessment(selection);
      router.push(`/test/${token}`);
    } catch {
      setError("Assessment belum dapat dimulai. Pilihan mungkin belum dibuka untuk publik.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-lens text-sm font-semibold">Tinjau dan consent</p>
      <h1 className="font-display mt-3 text-4xl font-semibold tracking-tight">
        Siap memulai eksplorasi?
      </h1>
      <p className="text-ink-muted mt-4 leading-7">
        Pastikan lensa dan kedalaman sesuai waktu yang kamu punya. Blueprint akan dikunci saat sesi
        dimulai agar urutan dan versi item tidak berubah.
      </p>

      {estimate ? (
        <div className="border-line mt-8 overflow-hidden rounded-lg border bg-white">
          <div className="border-line grid gap-5 border-b p-6 sm:grid-cols-3">
            <div>
              <p className="text-ink-muted text-sm">Mode</p>
              <p className="mt-1 text-lg font-semibold">{estimate.publicMode}</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm">Jumlah</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{estimate.itemCount} item</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm">Durasi</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                ± {estimate.estimatedMinutes} menit
              </p>
            </div>
          </div>
          <div className="p-6">
            <h2 className="font-semibold">Lensa dipilih</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {modules.map((module) => (
                <li
                  className="border-lens-soft bg-lens-soft text-lens-strong rounded-sm border px-3 py-1.5 text-sm"
                  key={module.key}
                >
                  {module.publicName}
                </li>
              ))}
            </ul>
            <p className="text-ink-muted mt-5 text-sm leading-6">{estimate.disclaimer}</p>
          </div>
        </div>
      ) : null}

      <div className="border-line bg-lens-soft/40 mt-8 space-y-3 rounded-md border p-5 text-sm leading-6">
        <p>Jawaban dipakai hanya untuk scoring dan refleksi dari lensa yang dipilih.</p>
        <p>Skor primer dihitung di server. Correlation tidak mengubah skor module.</p>
        <p>Hasil private sampai kamu membuat link berbagi.</p>
        <p>Kamu dapat menghapus hasil dan jawaban terkait.</p>
      </div>
      <label className="border-line mt-5 flex items-start gap-3 rounded-md border bg-white p-5 text-sm leading-6">
        <input
          checked={consent}
          className="accent-lens mt-1 h-5 w-5"
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        Aku setuju jawabanku diproses untuk menghasilkan hasil reflektif. Aku memahami hasil bukan
        diagnosis atau penilaian mutlak.
      </label>
      {error ? (
        <p className="text-danger mt-4 text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link
          className="focus-ring border-line text-ink hover:bg-mist inline-flex min-h-12 items-center justify-center rounded-sm border bg-white px-5 py-3 text-center font-semibold transition-colors duration-150 ease-out"
          href="/start/modules"
        >
          Ubah pilihan
        </Link>
        <Button disabled={!estimate || !consent || pending} onClick={start} type="button">
          {pending ? "Menyusun blueprint…" : "Mulai assessment"}
        </Button>
      </div>
    </div>
  );
}
