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
      <div className="mx-auto max-w-2xl rounded-3xl border border-[var(--line)] bg-white p-7 shadow-[var(--shadow)] sm:p-10">
        <p className="text-sm font-semibold text-violet-700">Sebelum mulai</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Consent pemrosesan assessment
        </h1>
        <ul className="mt-6 space-y-3 leading-7 text-[var(--muted)]">
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
