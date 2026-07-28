"use client";

import { RecoveryPanel } from "@/components/recovery-panel";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className="container-shell">
      <RecoveryPanel
        description="Ruang pribadimu belum dapat dimuat. Koneksi layanan mungkin sedang lambat."
        eyebrow="Koneksi terputus"
        onRetry={reset}
        reassurance="Sesi akunmu tetap tersimpan. Gangguan ini tidak mengeluarkanmu dari akun."
        safeHref="/"
        safeLabel="Kembali ke beranda"
        title="Coba muat ruang pribadi lagi"
      />
    </div>
  );
}
