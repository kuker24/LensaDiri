-- Canonical PRD v2 module catalog and selection metadata.
-- Only Trait Profile is functionally selectable until independent item banks and
-- scoring engines are published. Other modules stay draft or experimental.

insert into public.modules (
  key, public_name, internal_name, description, evidence_tier, status, category,
  is_selectable, is_experimental, minimum_age, default_order, description_key
)
values
  (
    'trait_profile', 'Profil Trait', 'Trait Profile',
    'Lima spektrum kecenderungan sebagai backbone evidence-oriented.',
    'A', 'active', 'trait', true, false, 13, 10,
    'module.trait_profile.description'
  ),
  (
    'type_16', '16-Type Jungian-inspired', 'Jungian-inspired 16-Type',
    'Empat kecenderungan pemrosesan yang dihitung dari item modul sendiri.',
    'B', 'draft', 'typology', false, false, 13, 20,
    'module.type_16.description'
  ),
  (
    'enneagram', 'Lensa Motivasi Enneagram-inspired', 'Enneagram-inspired Motivation',
    'Sembilan pola motivasi untuk refleksi, bukan instrumen resmi.',
    'B', 'draft', 'motivation', false, false, 15, 30,
    'module.enneagram.description'
  ),
  (
    'three_center', 'Pola Tiga Pusat', 'Three-Center Pattern',
    'Pola head, heart, dan gut yang diukur dengan item independen.',
    'B', 'draft', 'motivation', false, false, 15, 40,
    'module.three_center.description'
  ),
  (
    'temperament', 'Lensa Temperamen', 'Temperament Lens',
    'Refleksi energi, tempo, dan ekspresi emosi dari item modul sendiri.',
    'B', 'draft', 'typology', false, false, 13, 50,
    'module.temperament.description'
  ),
  (
    'instinct', 'Lensa Varian Instingtual', 'Instinctual Variant Lens',
    'Kecenderungan self-preservation, social, dan one-to-one.',
    'B', 'draft', 'motivation', false, false, 15, 60,
    'module.instinct.description'
  ),
  (
    'socionics_communication', 'Komunikasi Socionics-inspired',
    'Socionics-inspired Communication',
    'Preferensi pemrosesan informasi dan interaksi dengan validasi terbatas.',
    'B_EXPERIMENTAL', 'draft', 'communication', false, true, 15, 70,
    'module.socionics_communication.description'
  ),
  (
    'riasec', 'Minat Karier RIASEC', 'RIASEC Career Interest',
    'Enam dimensi minat dan contoh lingkungan belajar atau kerja.',
    'B', 'draft', 'career', false, false, 15, 80,
    'module.riasec.description'
  ),
  (
    'attachment', 'Refleksi Attachment', 'Attachment Reflection',
    'Refleksi non-klinis tentang pola kedekatan dalam relasi.',
    'B', 'draft', 'relationship', false, false, 18, 90,
    'module.attachment.description'
  ),
  (
    'psychosophy', 'Psychosophy Eksperimental', 'Psychosophy Experimental',
    'Modul eksploratif yang tidak masuk confidence evidence-oriented.',
    'EXPERIMENTAL', 'experimental', 'experimental', false, true, 18, 100,
    'module.psychosophy.description'
  )
on conflict (key) do nothing;

insert into public.assessment_mode_profiles (
  mode, public_name, description, target_item_min, target_item_max,
  single_module_item_min, single_module_item_max, max_items_per_segment,
  seconds_per_item, provisional_precision_min, provisional_precision_max,
  is_selectable, configuration_json
)
values
  (
    'quick', 'Quick', 'Gambaran awal dengan coverage inti.',
    50, 60, 24, 40, 120, 12, 60, 70, true,
    '{"recommended":false,"clarifierMin":12,"clarifierMax":18}'::jsonb
  ),
  (
    'standard', 'Normal', 'Pilihan utama dengan coverage dan consistency lebih baik.',
    80, 90, 40, 70, 120, 12, 75, 85, true,
    '{"recommended":true,"clarifierMin":12,"clarifierMax":24}'::jsonb
  ),
  (
    'deep', 'Complex', 'Coverage mendalam dengan section dan kemungkinan multi-session.',
    100, 120, 60, 100, 120, 15, 85, 92, false,
    '{"recommended":false,"clarifierMin":12,"clarifierMax":24}'::jsonb
  )
on conflict (mode) do nothing;

insert into public.combo_presets (
  key, public_name, description, status, recommended_mode, is_full_spectrum,
  default_order, compatibility_json, published_at
)
values
  (
    'core_personality', 'Kenali Pola Dasar',
    'Profil Trait dan 16-Type untuk gaya umum berpikir dan berperilaku.',
    'draft', 'standard', false, 10, '{}'::jsonb, null
  ),
  (
    'motivation_instinct', 'Motivasi dan Relasi',
    'Motivasi, varian instingtual, dan attachment untuk pola dorongan dan kedekatan.',
    'draft', 'standard', false, 20,
    '{"recommendTogether":["enneagram","instinct"]}'::jsonb, null
  ),
  (
    'career_learning', 'Belajar dan Karier',
    'Profil Trait, RIASEC, dan 16-Type untuk refleksi belajar dan lingkungan kerja.',
    'draft', 'standard', false, 30, '{}'::jsonb, null
  ),
  (
    'communication_relationship', 'Komunikasi',
    '16-Type, Temperamen, dan komunikasi Socionics-inspired.',
    'draft', 'standard', false, 40, '{}'::jsonb, null
  ),
  (
    'deep_self_discovery', 'Deep Self-Discovery',
    'Enam lensa core untuk refleksi lintas pola yang lebih mendalam.',
    'draft', 'deep', false, 50, '{}'::jsonb, null
  ),
  (
    'full_spectrum', 'Full Spectrum',
    'Seluruh modul published dan kompatibel, dibagi menjadi beberapa segment bila perlu.',
    'draft', 'deep', true, 60, '{}'::jsonb, null
  )
on conflict (key) do nothing;

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
    ('full_spectrum', 'socionics_communication', 7, true, '{}'::jsonb),
    ('full_spectrum', 'riasec', 8, true, '{}'::jsonb),
    ('full_spectrum', 'attachment', 9, true, '{}'::jsonb),
    ('full_spectrum', 'psychosophy', 10, false, '{"requiresExperimentalAcknowledgment":true}'::jsonb)
)
insert into public.combo_preset_modules (
  combo_preset_id, module_id, module_version_id, display_order, required,
  dependency_rule_json
)
select
  combo_presets.id,
  modules.id,
  latest_version.id,
  preset_modules.display_order,
  preset_modules.required,
  preset_modules.dependency_rule_json
from preset_modules
inner join public.combo_presets on combo_presets.key = preset_modules.preset_key
inner join public.modules on modules.key = preset_modules.module_key
left join lateral (
  select module_versions.id
  from public.module_versions
  where module_versions.module_id = modules.id
  order by module_versions.published_at desc nulls last, module_versions.created_at desc
  limit 1
) as latest_version on true
on conflict (combo_preset_id, module_id) do nothing;

insert into public.feature_flags (key, enabled, description, configuration_json)
values
  (
    'FEATURE_MODULAR_COMPOSER', false,
    'Routes new assessment starts through immutable modular blueprints.',
    '{}'::jsonb
  ),
  (
    'FEATURE_COMPLEX_MODE', false,
    'Allows public selection of deep/Complex mode.',
    '{}'::jsonb
  ),
  (
    'FEATURE_PROVISIONAL_PRECISION', false,
    'Shows provisional depth ranges with scientific-honesty disclaimer.',
    '{"disclaimerRequired":true}'::jsonb
  ),
  (
    'FEATURE_AI_NARRATIVE', false,
    'Allows consent-gated AI-assisted wording after deterministic scoring.',
    '{"requiresConsent":true,"primaryScoringForbidden":true}'::jsonb
  )
on conflict (key) do nothing;
