# Accessibility Engineering Audit

Status ringkas audit accessibility engineering internal LensaDiri. Constraint detail dan daftar route coverage ada di `ACCESSIBILITY_AUDIT.md`.

## Status

```
Internal accessibility engineering audit: PASS
Formal third-party certification: DEFERRED_WITH_REASON
```

Audit ini engineering-level mengikuti WCAG 2.2 AA sebagai target desain. Bukan sertifikasi formal pihak ketiga.

## Cakupan yang diperiksa

- Semantic heading: tepat satu `h1` per route, heading berurutan per section.
- Landmark dan struktur dokumen stabil pada Desktop Chromium dan Pixel 5.
- Keyboard navigation dengan visible focus dua batas pada surface terang dan gelap: inner outline canvas 3px serta outer ring `--color-lens-focus` 8px.
- Label programmatic pada kontrol autentikasi dan form. Input dan textarea memakai font minimum 16px pada viewport mobile.
- Assessment dan clarifier memiliki progressbar bernama beserta nilai minimum, maksimum, dan posisi saat ini. Chart result memiliki nama aksesibel dan nilai teks.
- Tidak ada horizontal overflow pada viewport desktop dan mobile.
- `prefers-reduced-motion` dihormati; motion dekoratif bukan satu-satunya pembawa state.
- Warna bukan satu-satunya pembawa makna.
- Kontras warna memenuhi batas minimum WCAG AA: teks normal minimum 4.5:1, teks besar minimum 3:1, dan elemen non-teks/focus ring minimum 3:1. Token `--color-aperture-on-dark` memakai `#8be0d0`, `--color-warning` memakai `#8a5a12`, dan `--color-lens-focus` memakai `#4c3ec2`.
- Copy tidak mengklaim diagnosis atau kepastian identitas.

## Evidence

| Gate                              | Hasil                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| Accessibility Playwright          | PASS: 42 tests pada Chromium desktop dan Pixel 5 pada 2026-07-18                                   |
| Full Playwright                   | PASS: 56 tests pada Chromium desktop dan Pixel 5 pada 2026-07-18                                   |
| Full unit                         | PASS: 96 tests pada 20 file                                                                        |
| Focused remediation unit coverage | PASS: 25 tests untuk contrast, timer, consent, modular start, result loader, dan assessment runner |
| Disposable DB loops               | PASS: tiga clean-reset loops, masing-masing 31 integration tests dan 236 pgTAP assertions          |
| Seed replay dan drift             | PASS pada ketiga clean-reset loops                                                                 |
| Route coverage                    | `tests/e2e/accessibility.spec.ts`                                                                  |
| Dialog behavior                   | Fixture test-only `/test-dialog`, aktif hanya saat `E2E_TEST_ROUTES=1`                             |
| Critical token contrast           | `tests/unit/contrast.test.ts`                                                                      |
| Reduced motion                    | `src/app/globals.css` `@media (prefers-reduced-motion: reduce)` dan computed-style E2E             |
| Lint, typecheck, build, audit     | PASS. Lint memakai ignore scoped untuk generated `.claude/worktrees/**`. Audit: 0 vulnerabilities  |

## Deferred

Sertifikasi WCAG pihak ketiga, audit manual screen reader menyeluruh, dan pengujian pengguna dengan disabilitas belum dilakukan. Tidak boleh diklaim selesai. Ketidakhadiran sertifikasi ini tidak menghalangi UI design readiness selama constraint engineering dijaga.
