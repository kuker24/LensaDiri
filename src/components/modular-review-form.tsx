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
import { Button, getButtonClassName } from "@/components/ui/button";

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
      setError("Asesmen belum dapat dimulai. Pilihan mungkin belum dibuka untuk publik.");
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mono-label text-aperture">Tinjau / persetujuan</p>
      <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
        Siap memulai eksplorasi?
      </h1>
      <p className="text-ink-muted mt-4 leading-7">
        Pastikan lensa dan kedalaman sesuai waktu yang kamu punya. Susunan dan versi pertanyaan akan
        dikunci saat sesi dimulai agar tidak berubah.
      </p>

      {estimate ? (
        <div className="bg-surface mt-10 overflow-hidden rounded-lg border border-white/14">
          <div className="border-line grid gap-5 border-b p-6 sm:grid-cols-3">
            <div>
              <p className="text-ink-muted text-sm">Kedalaman</p>
              <p className="mt-1 text-lg font-semibold">{estimate.publicMode}</p>
            </div>
            <div>
              <p className="text-ink-muted text-sm">Jumlah</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">
                {estimate.itemCount} pertanyaan
              </p>
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
                  className="border-lens/30 bg-lens-soft text-aperture rounded-md border px-3 py-1.5 text-sm"
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

      <div className="border-aperture-soft bg-aperture-soft mt-8 space-y-3 rounded-lg border p-5 text-sm leading-6">
        <p>Jawaban hanya dipakai untuk penilaian dan refleksi dari lensa yang dipilih.</p>
        <p>Skor utama dihitung di server. Hubungan antar-lensa tidak mengubah skor tiap lensa.</p>
        <p>Hasil tetap privat sampai kamu membuat tautan berbagi.</p>
        <p>Kamu dapat menghapus hasil dan jawaban terkait.</p>
      </div>
      <label className="border-line bg-surface mt-5 flex items-start gap-3 rounded-lg border p-5 text-sm leading-6">
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
        <Link className={getButtonClassName("secondary", "md")} href="/start/modules">
          Ubah pilihan
        </Link>
        <Button disabled={!estimate || !consent || pending} onClick={start} type="button">
          {pending ? "Menyiapkan pertanyaan…" : "Mulai asesmen"}
        </Button>
      </div>
    </div>
  );
}
