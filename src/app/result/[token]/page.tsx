import type { Metadata } from "next";
import { ResultControls } from "@/components/result-controls";
import { ResultLoader } from "@/components/result-loader";
export const metadata: Metadata = {
  title: "Hasil Pribadi",
  robots: { follow: false, index: false },
};
export default async function ResultPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="task-shell">
      {/*
        The feedback form was removed from the UI. Its API route, repository,
        table, and admin preview stay in place and dormant, so nothing on the
        server side changed.
      */}
      <ResultLoader token={token}>
        <ResultControls token={token} />
      </ResultLoader>
    </section>
  );
}
