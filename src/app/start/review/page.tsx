import type { Metadata } from "next";

import { ModularReviewForm } from "@/components/modular-review-form";

export const metadata: Metadata = {
  title: "Tinjau Asesmen",
  robots: { follow: false, index: false },
};

export default function AssessmentReviewPage() {
  return (
    <section className="container-shell py-12 sm:py-16">
      <ModularReviewForm />
    </section>
  );
}
