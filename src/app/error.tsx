"use client";

import { RecoveryPanel } from "@/components/recovery-panel";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container-shell">
      <RecoveryPanel
        description="Layanan sedang tidak dapat menampilkan halaman ini. Tunggu sebentar, lalu coba kembali."
        onRetry={reset}
        reassurance="Data dan pilihanmu tidak berubah."
        title="Halaman belum dapat dimuat"
      />
    </div>
  );
}
