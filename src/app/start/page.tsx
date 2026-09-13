import type { Metadata } from "next";
import { GenderSelectionGate } from "@/components/gender-selection-gate";

export const metadata: Metadata = {
  title: "Pilih Wujudmu",
  robots: { follow: false, index: false },
};

export default function StartPage() {
  return <GenderSelectionGate />;
}
