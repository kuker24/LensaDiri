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
      <p className="text-sm font-semibold text-violet-700">Tinjau dan consent</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">Siap memulai eksplorasi?</h1>
      <p className="mt-4 leading-7 text-[var(--muted)]">
        Pastikan lensa dan kedalaman sesuai waktu yang kamu punya. Blueprint akan dikunci saat sesi
        dimulai agar urutan dan versi item tidak berubah.
      </p>

      {estimate ? (
        <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="grid gap-5 border-b border-[var(--line)] p-6 sm:grid-cols-3">
            <div>
              <p className="text-sm text-[var(--muted)]">Mode</p>
              <p className="mt-1 text-lg font-semibold">{estimate.publicMode}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Jumlah</p>
              <p className="mt-1 text-lg font-semibold">{estimate.itemCount} item</p>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">Durasi</p>
              <p className="mt-1 text-lg font-semibold">± {estimate.estimatedMinutes} menit</p>
            </div>
          </div>
          <div className="p-6">
            <h2 className="font-semibold">Lensa dipilih</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {modules.map((module) => (
                <li className="rounded-full bg-violet-100 px-3 py-1.5 text-sm" key={module.key}>
                  {module.publicName}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm leading-6 text-[var(--muted)]">{estimate.disclaimer}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-8 space-y-3 rounded-2xl bg-violet-50 p-5 text-sm leading-6">
        <p>Jawaban dipakai hanya untuk scoring dan refleksi dari lensa yang dipilih.</p>
        <p>Skor primer dihitung di server. Correlation tidak mengubah skor module.</p>
        <p>Hasil private sampai kamu membuat link berbagi.</p>
        <p>Kamu dapat menghapus hasil dan jawaban terkait.</p>
      </div>
      <label className="mt-5 flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white p-5 text-sm leading-6">
        <input
          checked={consent}
          className="mt-1 h-5 w-5 accent-violet-700"
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
        />
        Aku setuju jawabanku diproses untuk menghasilkan hasil reflektif. Aku memahami hasil bukan
        diagnosis atau penilaian mutlak.
      </label>
      {error ? (
        <p className="mt-4 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Link
          className="focus-ring min-h-12 rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-center font-semibold"
          href="/start/modules"
        >
          Ubah pilihan
        </Link>
        <button
          className="focus-ring min-h-12 rounded-xl bg-[var(--foreground)] px-6 font-semibold text-white disabled:opacity-50"
          disabled={!estimate || !consent || pending}
          onClick={start}
          type="button"
        >
          {pending ? "Menyusun blueprint…" : "Mulai assessment"}
        </button>
      </div>
    </div>
  );
}
