const messages: Readonly<Record<string, string>> = {
  age_restricted: "Masukkan usia 13–99. Beberapa lensa memiliki batas usia lebih tinggi.",
  assessment_service_busy: "Sistem sedang sibuk. Pilihan tetap di halaman ini; coba lagi sebentar.",
  body_too_large: "Pilihan tersimpan tidak valid. Pilih lensa kembali.",
  coverage_unavailable:
    "Kombinasi ini melebihi kapasitas kedalaman yang dipilih. Kurangi lensa atau bagi menjadi beberapa sesi.",
  csrf_invalid: "Sesi keamanan kedaluwarsa. Coba lagi untuk memperbarui sesi keamanan.",
  experimental_acknowledgment_required: "Konfirmasi lensa eksperimental sebelum melanjutkan.",
  feature_unavailable: "Asesmen modular sedang tidak tersedia.",
  invalid_body: "Pilihan tersimpan tidak valid. Pilih lensa kembali.",
  invalid_module_count: "Pilih satu lensa, atau 2–10 lensa untuk kombinasi.",
  mode_unavailable: "Kedalaman ini belum tersedia.",
  module_unavailable: "Salah satu lensa tidak lagi tersedia. Perbarui pilihanmu.",
  preset_mismatch: "Isi pilihan siap pakai berubah. Pilih ulang dari katalog terbaru.",
  preset_unavailable: "Pilihan siap pakai ini tidak lagi tersedia.",
  rate_limited: "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.",
  request_failed: "Layanan belum dapat dihubungi. Pilihan tetap di halaman ini; coba lagi.",
  selection_type_mismatch: "Pilihan tersimpan tidak konsisten. Pilih lensa kembali.",
  service_temporarily_busy:
    "Sistem sedang sibuk. Pilihan tetap di halaman ini; coba lagi sebentar.",
  service_unavailable: "Layanan belum tersedia. Pilihan tetap di halaman ini; coba lagi.",
};

export function getAssessmentStartErrorMessage(code: string): string {
  return messages[code] ?? "Asesmen belum dapat diproses. Pilihan tetap di halaman ini; coba lagi.";
}
