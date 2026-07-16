# Content Publication Workflow

## Tujuan

Workflow ini berlaku untuk item, module version, curated combo, dan feature flag. Seluruh operasi dijalankan oleh operator tepercaya melalui koneksi database server-side. Browser roles tetap tidak memiliki privilege langsung.

## Prinsip wajib

- Published content immutable. Revisi selalu memakai version baru.
- Item harus melewati `draft -> language_review -> construct_review -> bias_review -> pilot -> approved|rejected`.
- Module hanya dapat dipublish bila `release_disposition='RELEASE_READY'`, seluruh item aktif approved, dan terjemahan Indonesia approved.
- Combo hanya dapat dipublish bila minimal dua required module memiliki version published dan release-ready.
- Feature flag menggunakan compare-and-set dan alasan perubahan. Production tetap OFF sampai change review terpisah.
- Satu transaksi untuk satu publication event. Jangan mencampur publikasi content dengan migration schema.

## Item review

```sql
begin;
select public.transition_question_review(
  '<question-uuid>',
  'draft'::public.review_status,
  'language_review'::public.review_status,
  '<operator-account-uuid>',
  'Memulai review bahasa untuk item version baru.'
);
commit;
```

Ulangi dengan expected status yang tepat. Function menolak lompatan state, concurrent drift, dan perubahan content published.

## Publish module version

```sql
begin;
select public.publish_module_version(
  '<module-version-uuid>',
  '<operator-account-uuid>',
  'Seluruh gate content, construct, bias, pilot, dan translation telah disetujui.'
);
commit;
```

Post-check:

```sql
select
  modules.key,
  modules.release_disposition,
  modules.is_selectable,
  module_versions.version,
  module_versions.status,
  module_versions.published_at,
  count(questions.id) as item_count,
  count(*) filter (where questions.review_status = 'approved') as approved_count
from public.module_versions
join public.modules on modules.id = module_versions.module_id
left join public.questions on questions.module_version_id = module_versions.id
where module_versions.id = '<module-version-uuid>'
group by modules.id, module_versions.id;
```

## Publish curated combo

Pastikan mapping mengunci `module_version_id`, bukan hanya `module_id`.

```sql
begin;
select public.publish_combo_preset(
  '<combo-preset-uuid>',
  '<operator-account-uuid>',
  'Preset telah melalui compatibility review dan seluruh required version published.'
);
commit;
```

## Feature flag

Gunakan hanya setelah migration, smoke test, observability, rollback owner, dan change approval siap.

```sql
begin;
select public.set_feature_flag_state(
  'FEATURE_COMPLEX_MODE',
  false,
  true,
  '<operator-account-uuid>',
  'Release window disetujui dan rollback owner sedang aktif.'
);
commit;
```

Production flags dalam seed selalu `false`. CI hanya mengaktifkan fixture pada database lokal disposable setelah reset.

## Rollback dan forward-fix

- Content published tidak diubah atau dihapus.
- Bila wording atau scoring salah, retire version lama setelah version pengganti published.
- Bila flag menyebabkan error, compare-and-set kembali ke `false` terlebih dahulu.
- Bila migration sudah committed dan data telah ditulis, gunakan forward-fix additive. Jangan drop kolom atau type saat incident.
- Audit `content_publication_events` sebelum dan sesudah perubahan. Ledger ini append-only.
