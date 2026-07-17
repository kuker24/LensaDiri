import type { Metadata } from "next";
import { ResultLoader } from "@/components/result-loader";
export const metadata: Metadata = {
  title: "Hasil Dibagikan",
  robots: { follow: false, index: false },
};
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="container-shell py-12 sm:py-16">
      <ResultLoader shared token={token} />
      <p className="mt-8 text-center text-sm text-[var(--muted)]">
        Tampilan aman dari link berbagi eksplisit. Jawaban mentah dan ID internal tidak disertakan.
      </p>
    </section>
  );
}
