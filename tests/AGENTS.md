# Tests Agent Guide

## Purpose

`tests/` verifies Phase 0 behavior through deterministic unit tests and public browser smoke tests.

## Ownership

- `unit/`: Vitest tests for scoring and token primitives.
- `e2e/`: Playwright smoke tests for public landing and information routes.

## Local Contracts

- Keep tests deterministic and independent of production credentials, `.env` contents, network-only state, and test order.
- Test security behavior without logging secrets, raw token values, raw answers, or private result data.
- Current unit coverage verifies Likert scoring, reverse scoring, normalization, input and weight validation, token generation, HMAC hashing, serta invalid-token handling.
- Add explicit regression coverage for Likert range boundaries and other security-sensitive behavior when related code changes; source use of `timingSafeEqual` is not evidence of timing-characteristic test coverage.
- Treat PRD integration, RLS, auth, rate-limit, CSRF, assessment, result, and admin tests as future coverage. Do not report them as implemented from current smoke or unit tests.

## Work Guidance

1. Place pure domain tests in `unit/`; place browser-visible public flow checks in `e2e/`.
2. Add regression coverage with bug fixes and behavior changes.
3. Use accessible Playwright locators such as role, label, and visible user-facing text.
4. Do not weaken assertions or skip tests to make checks pass.

## Verification

```bash
npm test
npm run test:e2e
```

Run root formatting, lint, typecheck, test, and build gates before PR.

## Child DOX Index

No child DOX. `unit/` and `e2e/` are test areas currently covered here.
