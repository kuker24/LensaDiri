# MVP Local Verification

## Status

Local MVP: **VERIFIED** on 2026-07-13.

Production deployment: **VERIFIED FOR HOBBY BASELINE** on 2026-07-13 at `https://lensadiri.vercel.app` with one Supabase hosted project in Singapore. Health, public pages, security headers, and disposable register/login/dashboard/permanent-delete lifecycle passed. Formal monitoring, backup/restore drill, custom domain, staging separation, and full remote E2E remain unverified.

## Implemented scope

- Public landing, method, privacy, and disclaimer pages.
- Internal account registration, login, logout, session, CSRF, and rate limiting.
- Password-confirmed permanent account deletion, including linked sessions, consents, assessments, results, shares, and account-related audit records.
- Liveness-only `GET /api/health`.
- Quick assessment with 40 original Indonesian items.
- Standard assessment with 60 original Indonesian items.
- Versioned deterministic server-side trait scoring plus Jungian-inspired 16-Type, motivation, and temperament reflective overlays.
- Explicit consent, autosave, resume, atomic completion, private result tokens, account result summaries, and result feedback.
- Safe summary sharing, share revocation, JSON export, and permanent result deletion.
- Desktop Chromium and Pixel 5 browser coverage.

## Verification commands

Commands below completed successfully against local Docker-backed Supabase:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
npm audit --audit-level=high
npm run db:reset
TEST_DATABASE_URL='local disposable PostgreSQL URL' npm run test:integration
npm run test:db
npm run test:e2e
git diff --check
```

Evidence covered:

- clean migration and seed application;
- 60 seeded questions, including 40 Quick items;
- forced RLS and revoked browser privileges;
- account hard-delete authorization and cascade;
- account/auth browser lifecycle;
- assessment autosave and resume;
- server-authoritative completion and five trait scores;
- private result access;
- safe export without raw answers or internal IDs;
- share creation, public safe DTO, revocation, and expiry checks;
- result feedback validation and persistence;
- result deletion and token invalidation;
- desktop and Pixel 5 browser behavior;
- keyboard skip-link smoke coverage.

## Security and privacy boundaries

- Browser roles receive no direct database table access.
- Session, assessment, result, and share tokens are stored only as HMAC hashes.
- Passwords use Argon2id.
- Cookie-authenticated mutations require same-origin CSRF proof.
- Result is private unless user explicitly creates a share token.
- Shared and exported DTOs omit raw answers and internal identifiers.
- Account deletion requires current password and exact `HAPUS AKUN` confirmation.

## Remaining risks

- Item bank and scoring have not received formal psychometric validation, norming, or domain-expert review.
- Only Indonesian item text exists.
- Admin item-bank UI is not implemented.
- Email verification and password reset are not implemented.
- Formal automated WCAG audit is not included; current evidence is semantic/keyboard/mobile smoke coverage.
- No separate staging environment or full destructive remote E2E.
- No production monitoring integration, backup/restore drill, or custom-domain verification.
- Production currently uses Vercel default domain and Supabase free-tier constraints.
