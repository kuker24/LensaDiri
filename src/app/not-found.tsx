import { RecoveryPanel } from "@/components/recovery-panel";

export default function NotFound() {
  return (
    <div className="container-shell">
      <RecoveryPanel
        description="Alamat ini mungkin sudah berubah atau tidak tersedia."
        eyebrow="Tidak ditemukan"
        title="Halaman tidak ditemukan"
      />
    </div>
  );
}
