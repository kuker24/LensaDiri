import type { Metadata } from "next";
import { ResultControls } from "@/components/result-controls";
import { ResultFeedbackForm } from "@/components/result-feedback-form";
import { ResultLoader } from "@/components/result-loader";
export const metadata: Metadata = {
  title: "Hasil Pribadi",
  robots: { follow: false, index: false },
};
export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="container-shell py-12 sm:py-16">
      <ResultLoader token={token} />
      <ResultControls token={token} />
      <ResultFeedbackForm token={token} />
    </section>
  );
}
