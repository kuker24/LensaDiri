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
- Keyboard navigation dengan visible focus, `outline-style` bukan `none`.
- Label programmatic pada kontrol autentikasi dan form.
- Progressbar semantics dan nilai teks pada chart result.
- Tidak ada horizontal overflow pada viewport desktop dan mobile.
- `prefers-reduced-motion` dihormati; motion dekoratif bukan satu-satunya pembawa state.
- Warna bukan satu-satunya pembawa makna.
- Kontras warna memenuhi batas minimum WCAG AA: teks normal minimum 4.5:1, teks besar minimum 3:1, dan elemen non-teks/focus ring minimum 3:1. Token khusus seperti `--color-aperture-on-dark` (#f39257) digunakan untuk latar gelap dan `--color-warning` digelapkan ke `#91621e` pada latar canvas.
- Copy tidak mengklaim diagnosis atau kepastian identitas.

## Evidence

| Gate                | Hasil                                                           |
| ------------------- | --------------------------------------------------------------- |
| `npm run test:a11y` | PASS: 28 tests                                                  |
| Route coverage      | `tests/e2e/accessibility.spec.ts` desktop dan Pixel 5           |
| Reduced motion      | `src/app/globals.css` `@media (prefers-reduced-motion: reduce)` |

## Deferred

Sertifikasi WCAG pihak ketiga, audit manual screen reader menyeluruh, dan pengujian pengguna dengan disabilitas belum dilakukan. Tidak boleh diklaim selesai. Ketidakhadiran sertifikasi ini tidak menghalangi UI design readiness selama constraint engineering dijaga.
