import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privasi",
  description: "Prinsip privasi dan kontrol data pengguna di LensaDiri.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-shell py-16 lg:py-24">
      <p className="text-sm font-semibold tracking-[0.14em] text-lens uppercase">Privasi</p>
      <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
        Private by default, kontrol tetap di tangan pengguna.
      </h1>
      <p className="mt-6 text-lg leading-8 text-ink-muted">
        Dokumen ini adalah ringkasan prinsip produk selama tahap pengembangan dan belum menjadi
        kebijakan privasi final untuk peluncuran publik.
      </p>

      <div className="mt-12 space-y-8 rounded-md border border-line bg-white p-7 sm:p-10 shadow-surface">
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Data sensitif</h2>
          <p className="mt-3 leading-7 text-ink-muted">
            Pola jawaban, skor kepribadian, dan laporan naratif diperlakukan sebagai data sensitif.
            Data tersebut tidak boleh dikirim ke analytics pihak ketiga dalam bentuk mentah.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Akses dan berbagi</h2>
          <p className="mt-3 leading-7 text-ink-muted">
            Hasil dibuat private. Tautan berbagi hanya dibuat melalui tindakan eksplisit pengguna,
            memakai token berentropi tinggi, dapat kedaluwarsa, dapat dicabut, dan disimpan sebagai
            hash.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Hak pengguna</h2>
          <p className="mt-3 leading-7 text-ink-muted">
            Target MVP mendukung akses hasil, penghapusan hasil, ekspor data minimal, pencabutan
            tautan berbagi, dan penarikan consent opsional.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-semibold text-ink">Prinsip penyimpanan</h2>
          <p className="mt-3 leading-7 text-ink-muted">
            Sistem akan meminimalkan data, membatasi masa retensi, menerapkan default deny pada
            tabel sensitif, dan menolak akses ketika validasi otorisasi gagal.
          </p>
        </section>
      </div>
    </article>
  );
}
