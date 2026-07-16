-- Release-reviewed PRD v2 catalog boundary.
-- Only independently scored modules are selectable. All production flags remain false.

update public.modules
set release_disposition = 'RELEASE_READY', availability_reason = null
where key in ('trait_profile', 'type_16', 'enneagram', 'temperament');

update public.modules
set
  is_selectable = false,
  release_disposition = 'DEFERRED_WITH_REASON',
  availability_reason = case key
    when 'three_center' then 'Item bank dan scoring independen belum melewati review construct, bahasa, bias, dan pilot.'
    when 'instinct' then 'Item bank dan scoring independen belum release-ready; hasil tidak boleh diturunkan dari Enneagram.'
    when 'socionics_communication' then 'Modul eksperimental belum memiliki content review dan scoring provenance yang cukup untuk publikasi.'
    when 'riasec' then 'Item minat karier dan report guardrail belum melewati review domain serta pilot.'
    when 'attachment' then 'Konten sensitif non-klinis memerlukan review keamanan bahasa, usia, dan domain sebelum publikasi.'
    when 'psychosophy' then 'Modul eksperimental belum memiliki item, scoring, consent khusus, dan report boundary yang release-ready.'
  end
where key in (
  'three_center', 'instinct', 'socionics_communication', 'riasec', 'attachment', 'psychosophy'
);

-- Complex uses two 60-item segments for the 100-120 item experience.
update public.assessment_mode_profiles
set max_items_per_segment = 60
where mode = 'deep' and max_items_per_segment <> 60;

-- Curated presets only contain release-ready independently scored modules.
delete from public.combo_preset_modules
where combo_preset_id in (
  select id from public.combo_presets where key in ('core_personality', 'deep_self_discovery', 'full_spectrum')
);

with preset_modules(preset_key, module_key, display_order) as (
  values
    ('core_personality', 'trait_profile', 1),
    ('core_personality', 'type_16', 2),
    ('deep_self_discovery', 'trait_profile', 1),
    ('deep_self_discovery', 'type_16', 2),
    ('deep_self_discovery', 'enneagram', 3),
    ('deep_self_discovery', 'temperament', 4),
    ('full_spectrum', 'trait_profile', 1),
    ('full_spectrum', 'type_16', 2),
    ('full_spectrum', 'enneagram', 3),
    ('full_spectrum', 'temperament', 4)
)
insert into public.combo_preset_modules (
  combo_preset_id, module_id, module_version_id, display_order, required, dependency_rule_json
)
select
  combo_presets.id,
  modules.id,
  module_versions.id,
  preset_modules.display_order,
  true,
  '{}'::jsonb
from preset_modules
inner join public.combo_presets on combo_presets.key = preset_modules.preset_key
inner join public.modules on modules.key = preset_modules.module_key
inner join lateral (
  select candidate.id
  from public.module_versions as candidate
  where candidate.module_id = modules.id and candidate.status in ('active', 'published')
  order by
    case when modules.key = 'trait_profile' and candidate.version = 'modular-1' then 0 else 1 end,
    candidate.published_at desc nulls last,
    candidate.created_at desc
  limit 1
) as module_versions on true;

update public.combo_presets
set
  description = case key
    when 'core_personality' then 'Profil Trait dan 16-Type untuk membaca kecenderungan umum dari dua lensa independen.'
    when 'deep_self_discovery' then 'Empat lensa release-ready untuk refleksi trait, pemrosesan, motivasi, dan temperamen.'
    when 'full_spectrum' then 'Seluruh modul yang saat ini release-ready dan kompatibel, dengan segmentasi untuk mode Complex.'
    else description
  end,
  status = 'published',
  published_at = coalesce(published_at, now())
where key in ('core_personality', 'deep_self_discovery', 'full_spectrum')
  and status = 'draft';

insert into public.retention_policies (
  key, subject, retention_days, deletion_action, legal_or_security_basis, status, published_at
)
values
  (
    'guest_incomplete_session', 'Sesi guest belum selesai', 30, 'rolling_cleanup',
    'Data minimization untuk sesi tanpa akun yang kedaluwarsa.', 'published', now()
  ),
  (
    'account_result', 'Hasil akun', null, 'user_controlled',
    'Disimpan sampai pengguna menghapus hasil atau akun.', 'published', now()
  ),
  (
    'rate_limit_bucket', 'Bucket rate limit', 90, 'rolling_cleanup',
    'Keamanan layanan dengan batas retensi maksimum.', 'published', now()
  ),
  (
    'audit_security_event', 'Audit keamanan', 365, 'rolling_cleanup',
    'Investigasi insiden dan akuntabilitas operasional.', 'published', now()
  )
on conflict (key) do nothing;

insert into public.consent_policy_versions (
  consent_type, version, purpose, required_for_core, retention_policy_key, status, published_at
)
values
  (
    'assessment_processing', 'prd-v2-1',
    'Memproses jawaban untuk membuat skor deterministic dan report dari lensa yang dipilih.',
    true, 'guest_incomplete_session', 'published', now()
  ),
  (
    'result_storage', 'prd-v2-1',
    'Menyimpan hasil private agar dapat dibuka, dibagikan secara eksplisit, diekspor, atau dihapus.',
    true, 'account_result', 'published', now()
  ),
  (
    'research_optional', 'prd-v2-1',
    'Mengizinkan penggunaan data teragregasi untuk evaluasi kualitas setelah proses minimization.',
    false, 'account_result', 'published', now()
  ),
  (
    'marketing_optional', 'prd-v2-1',
    'Mengizinkan komunikasi produk terpisah dari fungsi inti assessment.',
    false, 'account_result', 'published', now()
  ),
  (
    'ai_feature_optional', 'prd-v2-1',
    'Mengizinkan fitur naratif AI terkontrol bila tersedia tanpa mengubah skor primer.',
    false, 'account_result', 'published', now()
  )
on conflict (consent_type, version) do nothing;
