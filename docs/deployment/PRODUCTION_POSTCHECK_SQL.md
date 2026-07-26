# Production Postcheck SQL (read-only)

Operator-only pack. Run on a **trusted server-side** session (service role / owner), never from browser roles, never from agent chat with printed credentials.

**Rules**

- SELECT only. Abort if any statement is not read-only.
- Do not enable flags, publish content, or touch secrets here.
- Record counts/outcomes in `.pi/EVIDENCE.md` or audit notes without pasting secrets or PII.
- If linked CLI is used, prefer `supabase migration list --linked` for migration parity (no table data).

## 1. Migration parity (CLI)

```bash
npx --no-install supabase migration list --linked
# Expect Local == Remote through latest expected version (e.g. 202607290001)
```

## 2. Feature flags

```sql
select key, enabled, updated_at
from public.feature_flags
order by key;
```

Expected hobby posture (adjust only after approved activation):

| key                             | expected (2026-07-26) |
| ------------------------------- | --------------------- |
| `FEATURE_MODULAR_COMPOSER`      | `true`                |
| `FEATURE_COMPLEX_MODE`          | `true`                |
| `FEATURE_PROVISIONAL_PRECISION` | `true`                |
| `FEATURE_AI_NARRATIVE`          | `false`               |

## 3. Module selectability and tiers

```sql
select
  m.key,
  m.status,
  m.is_selectable,
  m.release_disposition,
  m.minimum_age,
  mv.version,
  mv.status as version_status,
  coalesce(mv.config_json->>'guardedBeta', 'false') as guarded_beta
from public.modules m
left join lateral (
  select *
  from public.module_versions mv
  where mv.module_id = m.id
  order by mv.created_at desc nulls last
  limit 1
) mv on true
order by m.key;
```

Expect 10 rows selectable; pilot/experimental tiers honest; guarded beta on deferred six as documented.

## 4. Draft item / translation counts (guarded six)

```sql
select
  m.key,
  count(q.id) as question_count,
  count(q.id) filter (where q.review_status = 'draft') as draft_questions,
  count(t.id) as translation_count,
  count(t.id) filter (where t.review_status = 'draft') as draft_translations
from public.modules m
join public.module_versions mv on mv.module_id = m.id
left join public.questions q on q.module_version_id = mv.id
left join public.question_translations t on t.question_id = q.id
where m.key in (
  'three_center',
  'instinct',
  'riasec',
  'attachment',
  'socionics_communication',
  'psychosophy'
)
group by m.key
order by m.key;
```

Document actual totals; readiness docs historically cited ~147 draft question+translation rows for the six — **verify, do not invent**.

## 5. guardedBeta scope

```sql
select
  m.key,
  mv.version,
  mv.config_json->>'guardedBeta' as guarded_beta
from public.module_versions mv
join public.modules m on m.id = mv.module_id
where coalesce(mv.config_json->>'guardedBeta', 'false') = 'true'
order by m.key, mv.version;
```

Expect only the six guarded targets (or current approved set). Flag unexpected keys.

## 6. Combo presets visibility

```sql
select key, status, is_full_spectrum, target_item_count
from public.combo_presets
order by key;
```

Expect `deep_self_discovery` status `pilot` (Complex activation 2026-07-26); `full_spectrum` remains `draft` (capacity decision: multi-session only — `docs/product/FULL_SPECTRUM_CAPACITY_DECISION.md`).

## 7. Public API cross-check (no DB creds)

```bash
curl -sS https://lensadiri.vercel.app/api/health
curl -sS https://lensadiri.vercel.app/api/modules | head -c 2000
curl -sS https://lensadiri.vercel.app/api/combos | head -c 2000
```

Confirm health ok; 10 modules; deep/full absent from public combos while draft.

## 8. Stop conditions

- Any unexpected `enabled=true` on Complex / precision / AI → incident: CAS false after approval if unapproved.
- Selectable module count ≠ 10 → stop feature work; investigate content.
- Published items mutated → immutability incident; forward-fix only.
