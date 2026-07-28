import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privasi",
  description: "Prinsip privasi dan kontrol data pengguna di LensaDiri.",
};

export default function PrivacyPage() {
  return (
    <article className="prose-shell py-16 sm:py-24">
      <p className="mono-label text-ink">Privasi / kontrol data</p>
      <h1 className="mt-5 text-4xl font-medium tracking-[-0.035em] sm:text-6xl">
        Privat secara bawaan, kontrol tetap di tangan pengguna.
      </h1>
      <p className="text-ink-muted mt-6 text-lg leading-8">
        Ringkasan ini menjelaskan cara LensaDiri melindungi hasil dan memberi pengguna kontrol atas
        datanya. Ringkasan ini bukan pengganti kebijakan privasi formal.
      </p>

      <div className="mt-14 space-y-10">
        <section>
          <h2 className="text-ink text-2xl font-medium">Data sensitif</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Pola jawaban, skor kepribadian, dan laporan naratif diperlakukan sebagai data sensitif.
            Data tersebut tidak boleh dikirim ke analytics pihak ketiga dalam bentuk mentah.
          </p>
        </section>
        <section>
          <h2 className="text-ink text-2xl font-medium">Akses dan berbagi</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Hasil dibuat privat. Tautan berbagi hanya dibuat melalui tindakan eksplisit pengguna,
            memakai token berentropi tinggi, dapat kedaluwarsa, dapat dicabut, dan disimpan sebagai
            hash.
          </p>
        </section>
        <section>
          <h2 className="text-ink text-2xl font-medium">Hak pengguna</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Pengguna dapat mengakses dan menghapus hasil, mengekspor ringkasan, mencabut tautan
            berbagi, serta menarik persetujuan opsional.
          </p>
        </section>
        <section>
          <h2 className="text-ink text-2xl font-medium">Penyimpanan dan penghapusan</h2>
          <p className="text-ink-muted mt-3 leading-7">
            Hasil akun disimpan sampai pengguna menghapusnya. Sesi tamu kedaluwarsa dan catatan
            pembatasan permintaan lama dibersihkan sesuai jadwal. Akses tanpa otorisasi ditolak.
          </p>
        </section>
      </div>
    </article>
  );
}
