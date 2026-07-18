# UI Design Readiness

## Status

```
READY
```

Core engineering PRD v2 stabil, teruji, dan privacy boundary konsisten. UI final dapat mengganti styling dan composition tanpa mengubah domain service atau API contract.

Tiga gap review manual sudah ditutup: result §17.2 menampilkan mode (Quick/Normal/Complex), confidence factors §15.4 lengkap (skipped optional, clarifier completion, item quality weight, mode depth), dan model confidence versioned lewat `qualityModelVersion` (`module-quality-1`/`module-quality-2`, dispatch fail-closed, replay deterministic). Semua test dan gate hijau.

## Kondisi terpenuhi

| Kondisi                       | Bukti                                                                                                                                                                   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend contract stabil       | Route handler `src/app/api`, service `src/server/services`, repository `src/server/repositories` typed.                                                                 |
| DTO stabil                    | `PrivateResultView`, `SafeSharedResultView`, `ExportResultView` di `src/server/repositories`.                                                                           |
| Route lengkap                 | Public, auth, assessment, result, dashboard, legal. Semua build sebagai static atau dynamic yang benar.                                                                 |
| State lengkap                 | loading, empty, error, unauthorized, expired, deleted, revoked, retry pada flow utama.                                                                                  |
| Mobile dan desktop PASS       | Playwright Desktop Chromium dan Pixel 5: 42 tests PASS.                                                                                                                 |
| Accessibility PASS            | `npm run test:a11y`: 28 tests PASS. Lihat `docs/qa/ACCESSIBILITY_ENGINEERING_AUDIT.md`.                                                                                 |
| Privacy boundary stabil       | Allowlist DTO public, forced RLS, HMAC token, no raw answer logging.                                                                                                    |
| Tidak ada scoring logic di UI | Zero `scoreConstructs`/`scoreWeightedLikert`/`assessModuleQuality` di `src/components` dan `src/app`.                                                                   |
| Mode tampil (§17.2)           | Ringkasan sesi merender mode via `getPublicModeName`. E2E assert baris Mode. Tidak bocor ke public share DTO.                                                           |
| Confidence factors (§15.4)    | `module-quality-2` versioned: skipped optional, clarifier completion, item quality weight, mode depth. Unit membuktikan arah tiap faktor, bounded, replay, fail-closed. |
| Deferred item dijelaskan      | Lihat matrix `docs/qa/PRD_V2_IMPLEMENTATION_AUDIT.md`.                                                                                                                  |

## Batas yang tetap terbuka

Hal berikut tidak menghalangi UI design readiness selama klaim produk jujur:

- Scientific validation formal: `DEFERRED_WITH_REASON`.
- AI narrative: `DEFERRED_WITH_REASON`, flag OFF.
- Live email provider dan mandatory verification: `BLOCKED_EXTERNAL`.
- Sertifikasi WCAG pihak ketiga: `DEFERRED_WITH_REASON`.

## Panduan untuk desain final

- Ganti styling dan composition komponen di `src/components` tanpa mengubah signature DTO.
- Pertahankan semantic HTML, keyboard access, visible focus, label form, progressbar semantics, dan `prefers-reduced-motion`.
- Jangan memindahkan scoring atau business rule ke client.
- Jangan menambah field ke public shared DTO tanpa review privacy.
- Jaga copy tetap dalam guardrail scientific: tidak ada klaim diagnosis, kepastian, atau validasi psikometrik formal.
