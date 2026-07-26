import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privasi",
  description: "Prinsip privasi dan kontrol data pengguna di LensaDiri.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-shell py-16 sm:py-24">
      <p className="mono-label text-aperture">Privasi / kontrol data</p>
      <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
        Private by default, kontrol tetap di tangan pengguna.
      </h1>
      <p className="text-ink-muted mt-6 text-lg leading-8">
        Dokumen ini adalah ringkasan prinsip produk selama tahap pengembangan dan belum menjadi
        kebijakan privasi final untuk peluncuran publik.
      </p>

      <div className="border-line mt-12 border-t">
        <section className="border-line border-b py-7">
          <h2 className="text-ink text-2xl font-medium">Data sensitif</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Pola jawaban, skor kepribadian, dan laporan naratif diperlakukan sebagai data sensitif.
            Data tersebut tidak boleh dikirim ke analytics pihak ketiga dalam bentuk mentah.
          </p>
        </section>
        <section className="border-line border-b py-7">
          <h2 className="text-ink text-2xl font-medium">Akses dan berbagi</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Hasil dibuat private. Tautan berbagi hanya dibuat melalui tindakan eksplisit pengguna,
            memakai token berentropi tinggi, dapat kedaluwarsa, dapat dicabut, dan disimpan sebagai
            hash.
          </p>
        </section>
        <section className="border-line border-b py-7">
          <h2 className="text-ink text-2xl font-medium">Hak pengguna</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Target MVP mendukung akses hasil, penghapusan hasil, ekspor data minimal, pencabutan
            tautan berbagi, dan penarikan consent opsional.
          </p>
        </section>
        <section className="border-line border-b py-7">
          <h2 className="text-ink text-2xl font-medium">Prinsip penyimpanan</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Sistem akan meminimalkan data, membatasi masa retensi, menerapkan default deny pada
            tabel sensitif, dan menolak akses ketika validasi otorisasi gagal.
          </p>
        </section>
      </div>
    </article>
  );
}
