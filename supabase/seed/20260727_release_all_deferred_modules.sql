-- Guarded beta release for the six independently scored deferred modules.
-- Four modules are pilot/beta. Socionics-inspired Communication and Psychosophy
-- remain experimental. Questions and translations intentionally remain `draft`.
-- Access is explicit through `config_json.guardedBeta=true`, so no formal review
-- stage or `approved` publication status is claimed.

-- Adjust quotas to match constructed item-bank capacity so composer allocation
-- does not request more items than available.
update public.module_versions
set composer_config_json = case modules.key
  when 'three_center' then '{"quickQuota":15,"standardQuota":21,"deepQuota":21}'::jsonb
  when 'instinct' then '{"quickQuota":12,"standardQuota":18,"deepQuota":18}'::jsonb
  when 'riasec' then '{"quickQuota":24,"standardQuota":36,"deepQuota":36}'::jsonb
  else module_versions.composer_config_json
end
from public.modules
where module_versions.module_id = modules.id
  and modules.key in ('three_center', 'instinct', 'riasec')
  and module_versions.status = 'draft';

-- Mark the versions as an explicit guarded beta before exposing them. The
-- authored item and translation review statuses remain draft and visible as such
-- to operators.
update public.module_versions
set
  config_json = module_versions.config_json || '{"guardedBeta":true}'::jsonb,
  status = (
    case
      when modules.key in ('socionics_communication', 'psychosophy') then 'experimental'
      else 'pilot'
    end
  )::public.module_status
from public.modules
where module_versions.module_id = modules.id
  and modules.key in (
    'three_center', 'instinct', 'socionics_communication',
    'riasec', 'attachment', 'psychosophy'
  )
  and module_versions.status = 'draft';

-- Expose the modules as selectable with an honest status.
update public.modules
set
  is_selectable = true,
  release_disposition = 'RELEASE_READY',
  availability_reason = null,
  status = (
    case
      when key in ('socionics_communication', 'psychosophy') then 'experimental'
      else 'pilot'
    end
  )::public.module_status
where key in (
  'three_center', 'instinct', 'socionics_communication',
  'riasec', 'attachment', 'psychosophy'
);

-- Only presets whose coverage fits an enabled public mode are visible.
-- Deep Self-Discovery needs Complex (minimum coverage 102 > Quick/Standard cap).
-- Full Spectrum exceeds even the 120-item Complex ceiling.
update public.combo_presets
set
  status = (
    case key
      when 'core_personality' then 'published'
      when 'motivation_instinct' then 'pilot'
      when 'career_learning' then 'pilot'
      when 'communication_relationship' then 'experimental'
      when 'deep_self_discovery' then 'draft'
      when 'full_spectrum' then 'draft'
      else status::text
    end
  )::public.module_status,
  description = case key
    when 'core_personality' then 'Profil Trait dan 16-Type untuk membaca kecenderungan umum dari dua lensa independen.'
    when 'motivation_instinct' then 'Motivasi, varian instingtual beta, dan attachment beta untuk refleksi pola dorongan dan kedekatan.'
    when 'career_learning' then 'Profil Trait, RIASEC beta, dan 16-Type untuk refleksi gaya belajar dan lingkungan kerja.'
    when 'communication_relationship' then '16-Type, Temperamen, dan komunikasi Socionics-inspired eksperimental untuk gaya interaksi.'
    when 'deep_self_discovery' then 'Enam lensa dengan minimum coverage 102 item; menunggu aktivasi mode Complex.'
    when 'full_spectrum' then 'Sepuluh lensa memerlukan coverage di atas batas Complex saat ini; belum dapat dipilih sebagai satu preset.'
    else description
  end
where key in (
  'core_personality', 'motivation_instinct', 'career_learning',
  'communication_relationship', 'deep_self_discovery', 'full_spectrum'
);

-- Rebuild the six canonical preset mappings so module versions point to the
-- new pilot/experimental versions.
delete from public.combo_preset_modules
where combo_preset_id in (
  select id
  from public.combo_presets
  where key in (
    'core_personality', 'motivation_instinct', 'career_learning',
    'communication_relationship', 'deep_self_discovery', 'full_spectrum'
  )
);

with preset_modules(preset_key, module_key, display_order, required, dependency_rule_json) as (
  values
    ('core_personality', 'trait_profile', 1, true, '{}'::jsonb),
    ('core_personality', 'type_16', 2, true, '{}'::jsonb),
    ('motivation_instinct', 'enneagram', 1, true, '{}'::jsonb),
    ('motivation_instinct', 'instinct', 2, true, '{"recommendedWith":"enneagram"}'::jsonb),
    ('motivation_instinct', 'attachment', 3, true, '{}'::jsonb),
    ('career_learning', 'trait_profile', 1, true, '{}'::jsonb),
    ('career_learning', 'riasec', 2, true, '{}'::jsonb),
    ('career_learning', 'type_16', 3, true, '{}'::jsonb),
    ('communication_relationship', 'type_16', 1, true, '{}'::jsonb),
    ('communication_relationship', 'temperament', 2, true, '{}'::jsonb),
    ('communication_relationship', 'socionics_communication', 3, true, '{}'::jsonb),
    ('deep_self_discovery', 'trait_profile', 1, true, '{}'::jsonb),
    ('deep_self_discovery', 'type_16', 2, true, '{}'::jsonb),
    ('deep_self_discovery', 'enneagram', 3, true, '{}'::jsonb),
    ('deep_self_discovery', 'three_center', 4, true, '{}'::jsonb),
    ('deep_self_discovery', 'temperament', 5, true, '{}'::jsonb),
    ('deep_self_discovery', 'instinct', 6, true, '{}'::jsonb),
    ('full_spectrum', 'trait_profile', 1, true, '{}'::jsonb),
    ('full_spectrum', 'type_16', 2, true, '{}'::jsonb),
    ('full_spectrum', 'enneagram', 3, true, '{}'::jsonb),
    ('full_spectrum', 'three_center', 4, true, '{}'::jsonb),
    ('full_spectrum', 'temperament', 5, true, '{}'::jsonb),
    ('full_spectrum', 'instinct', 6, true, '{}'::jsonb),
    ('full_spectrum', 'riasec', 7, true, '{}'::jsonb),
    ('full_spectrum', 'attachment', 8, true, '{}'::jsonb),
    ('full_spectrum', 'socionics_communication', 9, true, '{}'::jsonb),
    ('full_spectrum', 'psychosophy', 10, false, '{"requiresExperimentalAcknowledgment":true}'::jsonb)
)
insert into public.combo_preset_modules (
  combo_preset_id, module_id, module_version_id, display_order, required,
  dependency_rule_json
)
select
  combo_presets.id,
  modules.id,
  module_versions.id,
  preset_modules.display_order,
  preset_modules.required,
  preset_modules.dependency_rule_json
from preset_modules
inner join public.combo_presets on combo_presets.key = preset_modules.preset_key
inner join public.modules on modules.key = preset_modules.module_key
inner join lateral (
  select candidate.id
  from public.module_versions as candidate
  where candidate.module_id = modules.id
    and candidate.status in ('active', 'pilot', 'published', 'experimental')
  order by
    case when modules.key = 'trait_profile' and candidate.version = 'modular-1' then 0 else 1 end,
    candidate.published_at desc nulls last,
    candidate.created_at desc
  limit 1
) as module_versions on true;
