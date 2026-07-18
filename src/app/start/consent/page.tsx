import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StartAssessmentForm } from "@/components/start-assessment-form";
import type { AssessmentMode } from "@/server/repositories/assessment";

export const metadata: Metadata = {
  title: "Consent Assessment",
  robots: { follow: false, index: false },
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (mode !== "quick" && mode !== "standard") notFound();
  return (
    <section className="container-shell py-14 sm:py-20">
      <div className="border-line shadow-surface mx-auto max-w-2xl rounded-xl border bg-white/90 p-7 sm:p-10">
        <p className="text-lens text-sm font-semibold">Sebelum mulai</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-tight">
          Consent pemrosesan assessment
        </h1>
        <ul className="text-ink-muted mt-6 space-y-3 leading-7">
          <li>Jawaban dipakai hanya untuk menghitung hasil refleksi.</li>
          <li>Skor dihitung di server dan tidak dapat dikirim sebagai skor final oleh browser.</li>
          <li>Token acak diperlukan untuk membuka sesi dan hasil.</li>
          <li>Kamu dapat menghapus hasil beserta jawaban terkait.</li>
        </ul>
        <div className="mt-7">
          <StartAssessmentForm mode={mode as AssessmentMode} />
        </div>
      </div>
    </section>
  );
}
