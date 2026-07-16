# PRD v2 Migration Readiness

## Scope

Migration PRD v2 bersifat additive. Tidak ada reset production, destructive backfill, atau perubahan feature flag otomatis.

## Ordered map

| Order | Migration                                        | Dependency                                    | Data operation                                         | Lock risk                   |
| ----: | ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------ | --------------------------- |
|     1 | `202607130005_modular_enum_extensions.sql`       | phase 1 enum                                  | enum value additions                                   | rendah, singkat             |
|     2 | `202607130006_modular_assessment_foundation.sql` | enum extensions, MVP tables                   | table/index/trigger modular                            | sedang saat DDL             |
|     3 | `202607150001_modular_clarifier_runtime.sql`     | modular foundation                            | clarifier tables dan status                            | rendah-sedang               |
|     4 | `202607160001_result_module_provenance.sql`      | result module tables                          | provenance constraint/index                            | rendah-sedang               |
|     5 | `202607160002_prd_v2_release_contract.sql`       | review status, catalog, flags, session tables | release disposition, policy tables, operator functions | sedang saat alter `modules` |

## Checksum

Sebelum release, rekam SHA-256 file migration dari commit yang disetujui:

```bash
sha256sum supabase/migrations/*.sql
```

Checksum production harus dibandingkan dengan commit release. Perbedaan adalah stop condition.

## Lock and rollout risk

- `alter table public.modules add column ... default` berisiko lock singkat. Tabel catalog kecil dan tidak berada pada hot answer path.
- Index baru pada `modules` kecil. Tidak memerlukan backfill besar.
- Tabel policy dan publication event baru tidak mengubah row existing.
- Function publication dan retention tidak berjalan otomatis saat migration.
- Seed release catalog bukan migration production otomatis. Operator harus review content diff dan menjalankannya hanya pada environment yang dituju.

Rollback threshold sebelum writer dibuka:

- migration error apa pun
- checksum mismatch
- browser privilege atau RLS regression
- module selectable tanpa version published
- production feature flag berubah dari false
- post-migration query menghasilkan invariant violation

Setelah data baru ditulis, gunakan forward-fix additive. Jangan drop type, column, atau table sebagai rollback insiden.

## Backfill

Tidak ada backfill jawaban atau hasil legacy. Legacy result reader tetap dipertahankan.

Release disposition existing diisi default `RELEASE_READY`, lalu canonical seed menetapkan enam modul belum siap menjadi `DEFERRED_WITH_REASON` dan `is_selectable=false`. Sebelum production rollout, operator wajib menjalankan query invariant setelah content update.

## Post-migration queries

```sql
-- Forced RLS dan browser default deny untuk tabel baru.
select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('consent_policy_versions', 'retention_policies', 'content_publication_events');

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('consent_policy_versions', 'retention_policies', 'content_publication_events')
  and grantee in ('anon', 'authenticated', 'PUBLIC');

-- Tidak boleh ada deferred module yang selectable.
select key, release_disposition, is_selectable, availability_reason
from public.modules
where release_disposition <> 'RELEASE_READY'
  and (is_selectable or availability_reason is null);

-- Selectable module harus memiliki version published.
select modules.key
from public.modules
where modules.is_selectable
  and not exists (
    select 1 from public.module_versions
    where module_versions.module_id = modules.id
      and module_versions.status in ('active', 'published')
  );

-- Published combo harus mengunci required version yang published.
select combo_presets.key, modules.key
from public.combo_presets
join public.combo_preset_modules on combo_preset_modules.combo_preset_id = combo_presets.id
join public.modules on modules.id = combo_preset_modules.module_id
left join public.module_versions on module_versions.id = combo_preset_modules.module_version_id
where combo_presets.status = 'published'
  and combo_preset_modules.required
  and (
    combo_preset_modules.module_version_id is null
    or module_versions.status <> 'published'
    or modules.release_disposition <> 'RELEASE_READY'
  );

-- Production flags tetap OFF sebelum change approval.
select key, enabled from public.feature_flags order by key;
```

Seluruh query invariant selain daftar flag harus menghasilkan zero rows. Flag production harus seluruhnya false pada tahap ini.

## External blockers

- Staging Supabase project terisolasi: `BLOCKED_EXTERNAL`
- Preview-scoped Vercel secrets: `BLOCKED_EXTERNAL`
- Hosted backup restore drill: `BLOCKED_EXTERNAL`
- Production migration window dan operator approval: `BLOCKED_EXTERNAL`

Tidak satu pun blocker tersebut boleh diselesaikan dengan memakai production sebagai test environment.
