import type { Metadata } from "next";
import { ResultLoader } from "@/components/result-loader";
export const metadata: Metadata = {
  title: "Hasil Dibagikan",
  robots: { follow: false, index: false },
};
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <section className="container-shell py-12 sm:py-20">
      <ResultLoader shared token={token} />
      <p className="text-ink-muted mt-8 text-center text-sm">
        Hasil ini dibagikan secara eksplisit oleh pemiliknya.
      </p>
    </section>
  );
}
