# Release Rollback — v0.9.0-hobby-modular

Checkpoint: `main` @ `bdeeec5` (tag `v0.9.0-hobby-modular`, 2026-07-26).
Production: `https://lensadiri.vercel.app`.

Use the smallest lever that restores safety. Prefer flag CAS and prior Vercel deployment over schema reverse.

## 1. Application deploy (code)

1. In Vercel → Deployments → promote last known-good Production deployment **before** the bad SHA.
2. Or redeploy a prior git SHA: `git checkout <good-sha>` then promote via Vercel (migration-only workflow; do not reset hosted DB).
3. Smoke: `GET /api/health` → `200` `{"status":"ok"}`; `/api/modules` modes; `/api/combos`.

## 2. Feature flags (Complex / precision)

Linked SQL (operator; approve writes explicitly):

```sql
begin;
select public.set_feature_flag_state(
  'FEATURE_COMPLEX_MODE',
  true,
  false,
  null,
  'Rollback Complex after activation window.'
);
select public.set_feature_flag_state(
  'FEATURE_PROVISIONAL_PRECISION',
  true,
  false,
  null,
  'Rollback provisional precision.'
);
commit;
```

Effect: deep mode becomes non-selectable (after #38 overlay); precision bands follow flag. Composer may stay ON.

Optional combo:

```sql
-- only if product wants deep preset hidden again
update public.combo_presets
set status = 'draft'
where key = 'deep_self_discovery' and status = 'pilot';
```

Prefer publication workflow functions when available; avoid ad-hoc content edits for items.

## 3. Composer (nuclear modular UI)

```sql
select public.set_feature_flag_state(
  'FEATURE_MODULAR_COMPOSER',
  true,
  false,
  null,
  'Emergency disable modular composer.'
);
```

Legacy Quick/Standard routes remain.

## 4. Email / verification (when secrets exist)

1. Remove `RESEND_API_KEY` and/or `EMAIL_FROM` from the environment → redeploy (transport dormant; APIs safe).
2. Set `FEATURE_REQUIRE_EMAIL_VERIFICATION=0` or remove → redeploy.
3. Compromised key: rotate Resend, update env, redeploy. Unused recovery tokens expire (~30 min).

No schema rollback for recovery tables.

## 5. Database

- **Fix-forward only.** Do not `db reset` production. Do not reverse applied migrations through `202607290001`.
- Data incidents: follow `docs/operations/BACKUP_RESTORE_RUNBOOK.md` and `INCIDENT_RESPONSE.md`.
- Free-plan limits: PITR / long-lived staging may be unavailable; use documented disposable drill pattern.

## 6. Post-rollback checks

| Check                    | Expect                                       |
| ------------------------ | -------------------------------------------- |
| `/api/health`            | 200 ok                                       |
| Flags                    | match intended emergency posture             |
| Legacy start/complete    | works                                        |
| Modular (if composer ON) | estimate/start fail-closed on bad provenance |
| No secrets in logs/chat  | confirmed                                    |

## 7. What not to do

- Do not claim rollback “restores certification” (none was claimed).
- Do not force item `approved` or publish `full_spectrum` as part of rollback.
- Do not paste secrets into issues, chat, or git.
