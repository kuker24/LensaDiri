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
    <section className="container-shell py-16 sm:py-24">
      <div className="bg-surface mx-auto max-w-2xl rounded-[1.2rem] border border-white/14 p-7 sm:p-10">
        <p className="mono-label text-aperture">Sebelum mulai</p>
        <h1 className="mt-4 text-3xl font-medium tracking-[-0.03em]">
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
