# Resend free-tier activation (#40)

Hobby-safe path for account recovery email. **No paid plan required.** Secrets never go in git, chat, or issues.

## What already ships

| Piece              | State                                                        |
| ------------------ | ------------------------------------------------------------ |
| Schema + APIs      | live (`account_recovery_tokens`, forgot/reset/verify routes) |
| Transport          | Resend only (`src/server/email-transport.ts`)                |
| Test transport     | `RECOVERY_TEST_TRANSPORT=1` (CI / local)                     |
| Production secrets | **absent** → delivery **dormant**                            |
| Mandatory verify   | `FEATURE_REQUIRE_EMAIL_VERIFICATION` default **OFF**         |

Without both `RESEND_API_KEY` and `EMAIL_FROM`, APIs stay safe: generic `202`, no token issued for delivery.

## Free tier facts (operator)

- Resend free plan is enough for hobby volume (daily send cap; check current Resend pricing page before go-live).
- Domain verification may use a free DNS host you already control, or Resend’s documented test sender for **Preview-only** drills.
- Custom domain is recommended before Production so `EMAIL_FROM` matches a verified domain.
- **Do not buy** extra email products for this residual. If free caps are exceeded, keep delivery dormant.

## Ordered gates (do not skip)

1. Create Resend account (operator custody).
2. Prefer: verify a sending domain you own. Fallback for Preview only: use Resend’s current free test-from address if still offered.
3. Create API key; store only in Vercel env (Preview first). Never paste into issues/chat/PR.
4. Set Preview:
   - `RESEND_API_KEY` (min 20 chars; server-only)
   - `EMAIL_FROM` (must include `@`, match verified domain / allowed test sender)
   - Confirm `NEXT_PUBLIC_APP_URL` is the Preview origin (links use this origin)
5. Drill on Preview (disposable inbox):
   - Register → request verification (if used)
   - Forgot password → open fragment link `#token=`
   - Confirm single-use + 30 min expiry
   - Unknown email still returns accepted UI
6. Record evidence date + pass/fail in `.pi/EVIDENCE.md` (no secrets, no raw tokens).
7. Promote same env names to **Production** only after Preview PASS. Redeploy.
8. Leave `FEATURE_REQUIRE_EMAIL_VERIFICATION` unset/`0` until product plans legacy `email_verified_at` null users.
9. Monitor Vercel logs for `operation=recovery_email_send` counts only (no email/token fields).

## Smoke commands (operator)

```bash
# After secrets exist on target env only
# Use Preview URL first, never mix Production DB secrets into Preview.

# Health still green
curl -sS -w "\nHTTP:%{http_code}\n" "$APP_URL/api/health"

# Forgot password via UI: /login → lupa password
# Or exercise app forms; do not script raw tokens into tickets.
```

## Rollback

1. Remove `RESEND_API_KEY` and/or `EMAIL_FROM` → redeploy → dormant.
2. Mandatory verify off: unset / `0` → redeploy.
3. Compromised key: rotate in Resend, update env, redeploy. Unused tokens expire ~30 min.
4. No schema rollback.

## Done when

- [ ] Preview drill PASS + evidence note
- [ ] Production delivery smoke PASS
- [ ] Mandatory verify still OFF **or** ON with documented legacy plan
- [ ] Issue #40 closed only with that evidence

## Explicit non-claims

- Engineering cannot mark #40 done without operator secrets.
- Dormant recovery is intentional fail-closed, not a bug.
- Free tier limits may force staying dormant; that is an acceptable hobby outcome.

## Related

- Runbook: `docs/operations/OPERATIONS_RUNBOOK.md` (Account recovery email)
- Deploy env: `docs/deployment/PRODUCTION_VERCEL_SUPABASE.md`
- Rollback: `docs/deployment/RELEASE_ROLLBACK.md`
