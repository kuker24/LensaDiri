import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Reveal } from "@/components/reveal";
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
    <section className="task-shell">
      <Reveal className="auth-panel mx-auto max-w-2xl p-7 sm:p-10">
        <p className="mono-label text-ink">Sebelum mulai</p>
        <h1 className="mt-4 text-3xl font-normal tracking-[-0.03em]">Persetujuan pemrosesan</h1>
        <ul className="text-ink-muted mt-6 space-y-3 leading-7">
          <li>Jawaban hanya untuk menghitung hasil refleksi.</li>
          <li>Skor dihitung di server, bukan di browser.</li>
          <li>Token acak membuka sesi dan hasil.</li>
          <li>Kamu dapat menghapus hasil beserta jawabannya.</li>
        </ul>
        <div className="mt-7">
          <StartAssessmentForm mode={mode as AssessmentMode} />
        </div>
      </Reveal>
    </section>
  );
}
