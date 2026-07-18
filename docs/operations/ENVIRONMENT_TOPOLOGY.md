# Environment Topology

Dokumen ini merinci topologi environment LensaDiri. Prosedur operasional harian ada di `OPERATIONS_RUNBOOK.md`.

## Environments

| Environment | Aplikasi                 | Database                      | Secrets                       | Data policy                                               |
| ----------- | ------------------------ | ----------------------------- | ----------------------------- | --------------------------------------------------------- |
| Local       | Next.js dev server       | Supabase CLI disposable       | `.env.local`, tidak di-commit | Reset dan fixture diperbolehkan                           |
| CI          | GitHub Actions ephemeral | Supabase CLI disposable       | GitHub Actions env            | Reset, seed replay, feature fixture diperbolehkan         |
| Preview     | Vercel Preview           | Preview-scoped database wajib | Preview-only                  | Tidak boleh memakai production secrets                    |
| Production  | Vercel production        | Supabase hosted               | Production-only               | Tidak boleh di-reset atau menjadi target test destructive |

## Production identity

- Vercel production alias: `https://lensadiri.vercel.app`.
- Supabase project: `lensadiri-production`, ref `fwdviygjvbotqngijdlp`, region Singapore.
- Runtime Node.js 22.x pada Vercel dan CI.

## Boundary invariants

- Preview wajib memakai database dan secret terpisah. Jika belum tersedia, status `BLOCKED_EXTERNAL`. Jangan menggantinya dengan production database atau production secret.
- Feature flags production tetap OFF sampai activation approval terpisah: `FEATURE_MODULAR_COMPOSER`, `FEATURE_COMPLEX_MODE`, `FEATURE_AI_NARRATIVE`, `FEATURE_PROVISIONAL_PRECISION`.
- Database production migration-only. Seed tidak dijalankan pada production.
- Secret tidak pernah dibaca, dicetak, atau disalin lintas environment.

## Data flow

1. Client dan Server Component memanggil route handler same-origin di `src/app/api`.
2. Route handler memvalidasi boundary, authorization, CSRF, dan rate limit.
3. `src/server/services` mengoordinasi operasi trusted; `src/server/repositories` memiliki persistence typed.
4. `src/lib/db` menyediakan akses PostgreSQL server-only dan transaksi.
5. Engine scoring `src/lib/scoring` menghitung deterministic dan versioned di server.
