# PRD v2 Migration Readiness

## Scope

Migration PRD v2 memakai migration-only dan fix-forward. Tidak ada reset production, destructive data test, production seed, atau perubahan feature flag otomatis. Beberapa migration mengganti CHECK constraint dan melakukan backfill, sehingga preflight serta verifikasi per langkah wajib.

## Ordered map

| Order | Migration                                        | Dependency                                    | Data operation                                                                              | Lock risk                       |
| ----: | ------------------------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------- |
|     1 | `202607130005_modular_enum_extensions.sql`       | phase 1 enum                                  | enum value additions                                                                        | rendah, singkat                 |
|     2 | `202607130006_modular_assessment_foundation.sql` | enum extensions, MVP tables                   | modular DDL, constraint replacement, translations, mappings, legacy result-version backfill | sedang-tinggi saat DDL/backfill |
|     3 | `202607150001_modular_clarifier_runtime.sql`     | modular foundation                            | clarifier tables dan status                                                                 | rendah-sedang                   |
|     4 | `202607160001_result_module_provenance.sql`      | result module tables                          | provenance constraint/index                                                                 | rendah-sedang                   |
|     5 | `202607160002_prd_v2_release_contract.sql`       | review status, catalog, flags, session tables | release disposition, privacy/publication tables, operator functions, RLS/revokes            | sedang saat alter `modules`     |
|     6 | `202607160003_dashboard_audit_extension.sql`     | audit taxonomy in `202607130006`              | canonical audit constraint normalization                                                    | rendah-sedang saat validation   |
|     7 | `202607200001_account_recovery_foundation.sql`   | accounts, sessions, rate limits, audit logs   | recovery token table/index dan constraint replacement                                       | sedang saat DDL/validation      |

## Canonical checksum

Checksum berikut dihitung dari candidate repository pada 2026-07-17. Sebelum release, bandingkan lagi dengan commit release yang disetujui.

| Migration                                        | SHA-256                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `202607130005_modular_enum_extensions.sql`       | `b28deeba68f92e221ddc37950144ca48fdeb311552e3c863976d2b191c12d166` |
| `202607130006_modular_assessment_foundation.sql` | `f8a781e63d5c734388ec91482dd536473cc2e7c90113f2e103b4173e0f0b19c6` |
| `202607150001_modular_clarifier_runtime.sql`     | `6f567d1170305563b06b3016d831b8faca95f09c1fbd49989f59ad853cc7ef65` |
| `202607160001_result_module_provenance.sql`      | `60b33f6e61692bccce988b46a1d69db8ba86ece5f063d130c55cf264ecde06c2` |
| `202607160002_prd_v2_release_contract.sql`       | `2e75f373717a37b18e76394841d4572be344cb2c6bfb059286e21334f61244eb` |
| `202607160003_dashboard_audit_extension.sql`     | `f6e167e4ffc264e563c3bacfbd7097cb888fa41658932e45133acc68e6b73980` |
| `202607200001_account_recovery_foundation.sql`   | `bd2060b4b1c5457e24eee5bb77edc44ffc3a9677b293885ebb6a59211436400d` |

```bash
sha256sum \
  supabase/migrations/202607130005_modular_enum_extensions.sql \
  supabase/migrations/202607130006_modular_assessment_foundation.sql \
  supabase/migrations/202607150001_modular_clarifier_runtime.sql \
  supabase/migrations/202607160001_result_module_provenance.sql \
  supabase/migrations/202607160002_prd_v2_release_contract.sql \
  supabase/migrations/202607160003_dashboard_audit_extension.sql \
  supabase/migrations/202607200001_account_recovery_foundation.sql
```

Perbedaan checksum atau migration inventory adalah stop condition.

## Lock and rollout risk

- Enum additions tidak dapat di-rollback secara praktis. Gunakan additive fix-forward.
- `202607130006` adalah langkah terbesar. Migration mengganti constraint, memperluas tabel, mengisi translations/mappings, dan membuat satu `result_versions` per legacy result. Ukur jumlah row dan jalankan langkah ini sendiri.
- `202607160002` mengubah `modules`, membuat tabel kebijakan/publication, memasang security-definer functions, forced RLS, dan revokes. Tinjau grants serta search path.
- `202607130006`, `202607160003`, dan `202607200001` mengganti CHECK constraints. Preflight existing audit route/action values sebelum migration. `202607160003` menormalkan taxonomy canonical agar candidate upgrade dan clean reset konvergen.
- Seed release catalog bukan migration production otomatis. Production seed tidak diotorisasi dalam release aman ini.

Rollback threshold sebelum writer dibuka:

- migration error apa pun;
- checksum atau ordered-chain mismatch;
- browser privilege atau RLS regression;
- module selectable tanpa version published;
- production feature flag berubah dari false;
- post-migration query menghasilkan invariant violation;
- audit row tidak memenuhi replacement constraint.

Setelah data baru ditulis, gunakan forward-fix additive. Jangan drop type, column, table, atau migration history sebagai rollback insiden.

## Preflight read-only

Jangan mengembalikan user data. Ambil count dan invariant saja.

```sql
-- Ukur backfill legacy result_versions.
select count(*) as legacy_result_count
from public.personality_results
where deleted_at is null;

-- Nilai audit existing harus sesuai constraint pengganti yang direview.
select action, entity_type, count(*)
from public.audit_logs
group by action, entity_type
order by action, entity_type;

-- feature_flags belum ada pada baseline production yang terverifikasi.
select to_regclass('public.feature_flags') is null as feature_flags_not_yet_created;
```

Query terakhir harus `true`; nilai `false` berarti history/schema baseline berbeda dan rollout harus berhenti. Review daftar audit hanya sebagai aggregate tanpa actor, request, atau payload.

## Post-migration queries

```sql
-- Forced RLS dan browser default deny untuk tabel release baru.
select c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'consent_policy_versions',
    'retention_policies',
    'content_publication_events',
    'account_recovery_tokens'
  );

select grantee, table_name, privilege_type
from information_schema.table_privileges
where table_schema = 'public'
  and table_name in (
    'consent_policy_versions',
    'retention_policies',
    'content_publication_events',
    'account_recovery_tokens'
  )
  and grantee in ('anon', 'authenticated', 'PUBLIC');

-- Foundation backfill harus satu-ke-satu untuk result aktif.
select results.id, count(versions.id)
from public.personality_results results
left join public.result_versions versions on versions.result_id = results.id
where results.deleted_at is null
group by results.id
having count(versions.id) <> 1;

-- Tidak boleh ada deferred module yang selectable.
select key, release_disposition, is_selectable, availability_reason
from public.modules
where release_disposition <> 'RELEASE_READY'
  and (is_selectable or availability_reason is null);

-- Selectable module harus memiliki version aktif. Legacy mvp-1 tetap berstatus active;
-- publication workflow modular memakai published.
select modules.key
from public.modules
where modules.is_selectable
  and not exists (
    select 1 from public.module_versions
    where module_versions.module_id = modules.id
      and module_versions.status in ('active', 'published')
  );

-- Published combo harus mengunci required version milik module yang tepat.
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
    or module_versions.module_id <> modules.id
    or modules.release_disposition <> 'RELEASE_READY'
  );

-- Production flags tetap OFF.
select key, enabled from public.feature_flags where enabled;
```

Seluruh invariant query harus menghasilkan zero rows. RLS query harus menunjukkan `relrowsecurity=true` dan `relforcerowsecurity=true`. Grant query harus zero rows.

## External blockers dan release boundary

- Staging Supabase project terisolasi: `BLOCKED_EXTERNAL`
- Preview-scoped Vercel secrets: `BLOCKED_EXTERNAL` sampai resource dibuat
- Hosted backup restore drill: `BLOCKED_EXTERNAL` tanpa non-production restore target
- Provider email dan mandatory verification: di luar release, recovery tetap dormant
- Monitoring eksternal, formal WCAG, dan validasi psikometrik: di luar release aman

Production tidak boleh menjadi test environment. Release aman hanya memigrasikan schema, deploy aplikasi, menjalankan smoke non-destruktif, dan mempertahankan seluruh feature flag false.
