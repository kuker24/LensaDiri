-- Additive experimental item banks for the fixed five-lens journey.
-- Existing published module versions remain untouched and readable.

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version
)
select id, '2.0.0', 'enneagram_journey_likert_v1', 'enneagram-journey-score-1',
  'enneagram-journey-id-1', 'experimental',
  '{"guardedBeta":true,"scaleMin":1,"scaleMax":5,"patterns":9,"instincts":3}'::jsonb,
  '{"quickQuota":54,"standardQuota":63,"deepQuota":72}'::jsonb,
  'enneagram-journey-report-1'
from public.modules where key = 'enneagram'
on conflict (module_id, version) do nothing;

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version
)
select id, 'journey-1', 'trait_profile_journey_likert_v1', 'trait-profile-journey-1',
  'trait-profile-journey-1', 'experimental',
  '{"guardedBeta":true,"scaleMin":1,"scaleMax":5,"dimensions":5,"sloan":true}'::jsonb,
  '{"quickQuota":40,"standardQuota":60,"deepQuota":60}'::jsonb,
  'trait-profile-journey-report-1'
from public.modules where key = 'trait_profile'
on conflict (module_id, version) do nothing;

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version
)
select id, 'journey-1', 'psychosophy_journey_likert_v1', 'psychosophy-journey-score-1',
  'psychosophy-journey-id-1', 'experimental',
  '{"guardedBeta":true,"scaleMin":1,"scaleMax":5,"dimensions":4,"positions":4}'::jsonb,
  '{"quickQuota":12,"standardQuota":16,"deepQuota":20}'::jsonb,
  'psychosophy-journey-report-1'
from public.modules where key = 'psychosophy'
on conflict (module_id, version) do nothing;

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version
)
select id, '2.0.0', 'socionics_type_likert_v1', 'socionics-type-score-1',
  'socionics-type-id-1', 'experimental',
  '{"guardedBeta":true,"scaleMin":1,"scaleMax":5,"dimensions":4}'::jsonb,
  '{"quickQuota":16,"standardQuota":24,"deepQuota":24}'::jsonb,
  'socionics-type-report-1'
from public.modules where key = 'socionics_communication'
on conflict (module_id, version) do nothing;

-- Copy the reviewed original nine-pattern structure into a new immutable version.
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select target.id, source_dimensions.construct_key, source_dimensions.facet_key,
  source_dimensions.label, source_dimensions.description, source_dimensions.minimum_item_coverage
from public.module_versions as target
inner join public.modules on modules.id = target.module_id and modules.key = 'enneagram'
inner join public.module_versions as source on source.module_id = modules.id
  and source.scoring_version = 'enneagram-score-1' and source.version = '1.0.0'
inner join public.question_dimensions as source_dimensions on source_dimensions.module_version_id = source.id
where target.scoring_version = 'enneagram-journey-score-1'
on conflict (module_version_id, construct_key, facet_key) do nothing;

with instinct_dimensions(construct_key, label, description) as (
  values
    ('instinct_self_preservation', 'Insting menjaga diri', 'Perhatian pada keamanan, energi, sumber daya, dan kestabilan pribadi.'),
    ('instinct_social', 'Insting sosial', 'Perhatian pada peran, kontribusi, posisi, dan dinamika kelompok.'),
    ('instinct_one_to_one', 'Insting satu-ke-satu', 'Perhatian pada intensitas, daya tarik, dan keterlibatan mendalam satu-ke-satu.')
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, instinct_dimensions.construct_key, 'general',
  instinct_dimensions.label, instinct_dimensions.description, 4
from instinct_dimensions
inner join public.modules on modules.key = 'enneagram'
inner join public.module_versions on module_versions.module_id = modules.id
  and module_versions.scoring_version = 'enneagram-journey-score-1'
on conflict (module_version_id, construct_key, facet_key) do nothing;

insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select target.id, target_dimensions.id, 'J_' || source_questions.item_code,
  source_questions.public_text, 'Journey copy of original LensaDiri item ' || source_questions.item_code,
  source_questions.polarity, source_questions.weight, source_questions.quick_enabled,
  source_questions.mode_eligibility, source_questions.information_priority,
  source_questions.clarifier_enabled, source_questions.exposure_group,
  source_questions.sensitivity_level, 'draft', source_questions.display_order, 'active'
from public.module_versions as target
inner join public.modules on modules.id = target.module_id and modules.key = 'enneagram'
inner join public.module_versions as source on source.module_id = modules.id
  and source.scoring_version = 'enneagram-score-1' and source.version = '1.0.0'
inner join public.questions as source_questions on source_questions.module_version_id = source.id
inner join public.question_dimensions as source_dimensions on source_dimensions.id = source_questions.dimension_id
inner join public.question_dimensions as target_dimensions on target_dimensions.module_version_id = target.id
  and target_dimensions.construct_key = source_dimensions.construct_key
  and target_dimensions.facet_key = source_dimensions.facet_key
where target.scoring_version = 'enneagram-journey-score-1'
on conflict (module_version_id, item_code) do nothing;

-- Trait and Psychosophy keep their original authored constructs and items, but
-- use new immutable versions because their journey summaries add SLOAN and
-- unique positional codes respectively.
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select target.id, source_dimensions.construct_key, source_dimensions.facet_key,
  source_dimensions.label, source_dimensions.description, source_dimensions.minimum_item_coverage
from public.module_versions as target
inner join public.modules on modules.id = target.module_id
inner join public.module_versions as source on source.module_id = modules.id
  and source.version = case
    when target.scoring_version = 'trait-profile-journey-1' then 'modular-1'
    else '1.0.0'
  end
inner join public.question_dimensions as source_dimensions on source_dimensions.module_version_id = source.id
where (target.scoring_version = 'trait-profile-journey-1'
    and source.scoring_version = 'trait-profile-modular-1')
  or (target.scoring_version = 'psychosophy-journey-score-1'
    and source.scoring_version = 'psychosophy-score-1')
on conflict (module_version_id, construct_key, facet_key) do nothing;

insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select target.id, target_dimensions.id, 'J_' || source_questions.item_code,
  source_questions.public_text, 'Journey copy of original LensaDiri item ' || source_questions.item_code,
  source_questions.polarity, source_questions.weight, source_questions.quick_enabled,
  source_questions.mode_eligibility, source_questions.information_priority,
  source_questions.clarifier_enabled, source_questions.exposure_group,
  source_questions.sensitivity_level, 'draft', source_questions.display_order, 'active'
from public.module_versions as target
inner join public.modules on modules.id = target.module_id
inner join public.module_versions as source on source.module_id = modules.id
  and source.version = case
    when target.scoring_version = 'trait-profile-journey-1' then 'modular-1'
    else '1.0.0'
  end
inner join public.questions as source_questions on source_questions.module_version_id = source.id
inner join public.question_dimensions as source_dimensions on source_dimensions.id = source_questions.dimension_id
inner join public.question_dimensions as target_dimensions on target_dimensions.module_version_id = target.id
  and target_dimensions.construct_key = source_dimensions.construct_key
  and target_dimensions.facet_key = source_dimensions.facet_key
where (target.scoring_version = 'trait-profile-journey-1'
    and source.scoring_version = 'trait-profile-modular-1')
  or (target.scoring_version = 'psychosophy-journey-score-1'
    and source.scoring_version = 'psychosophy-score-1')
on conflict (module_version_id, item_code) do nothing;

with instinct_items(construct_key, item_code, public_text, polarity, display_order) as (
  values
    ('instinct_self_preservation','J_ENN_SP01','Aku cepat memperhatikan apakah energi dan kebutuhan dasarku cukup terjaga.',1,55),
    ('instinct_self_preservation','J_ENN_SP02','Rasa aman bertambah ketika persediaan, waktu, dan rencanaku tertata.',1,56),
    ('instinct_self_preservation','J_ENN_SP03','Aku peka pada perubahan tubuh, kenyamanan, dan tingkat tenagaku.',1,57),
    ('instinct_self_preservation','J_ENN_SP04','Sebelum terlibat jauh, aku memastikan fondasi hidup sehari-hari cukup stabil.',1,58),
    ('instinct_self_preservation','J_ENN_SP05','Aku jarang memikirkan batas energi atau sumber daya pribadiku.',-1,59),
    ('instinct_self_preservation','J_ENN_SP06','Menjaga ritme yang berkelanjutan lebih penting bagiku daripada dorongan sesaat.',1,60),
    ('instinct_social','J_ENN_SO01','Aku cepat membaca peran dan harapan yang berlaku dalam sebuah kelompok.',1,61),
    ('instinct_social','J_ENN_SO02','Kontribusiku pada komunitas memengaruhi rasa terhubungku.',1,62),
    ('instinct_social','J_ENN_SO03','Aku memperhatikan bagaimana keputusan memengaruhi jaringan orang yang lebih luas.',1,63),
    ('instinct_social','J_ENN_SO04','Posisi dan dinamika kelompok mudah menarik perhatianku.',1,64),
    ('instinct_social','J_ENN_SO05','Aku jarang memikirkan peranku dalam kelompok atau komunitas.',-1,65),
    ('instinct_social','J_ENN_SO06','Menjadi bagian dari tujuan bersama dapat menguatkan motivasiku.',1,66),
    ('instinct_one_to_one','J_ENN_SX01','Percakapan yang intens dan mendalam membuatku merasa sangat hidup.',1,67),
    ('instinct_one_to_one','J_ENN_SX02','Aku tertarik pada hubungan atau gagasan yang memiliki daya tarik kuat.',1,68),
    ('instinct_one_to_one','J_ENN_SX03','Keterlibatan satu-ke-satu sering terasa lebih bermakna daripada suasana kelompok.',1,69),
    ('instinct_one_to_one','J_ENN_SX04','Aku mudah memusatkan energi pada satu hubungan atau minat yang terasa kuat.',1,70),
    ('instinct_one_to_one','J_ENN_SX05','Aku lebih memilih menjaga jarak daripada masuk ke keterlibatan yang intens.',-1,71),
    ('instinct_one_to_one','J_ENN_SX06','Daya tarik dan chemistry memengaruhi apa yang ingin kudekati.',1,72)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select module_versions.id, question_dimensions.id, instinct_items.item_code,
  instinct_items.public_text, 'Original LensaDiri journey instinct item ' || instinct_items.item_code,
  instinct_items.polarity, 1, true, array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft', instinct_items.display_order, 'active'
from instinct_items
inner join public.modules on modules.key = 'enneagram'
inner join public.module_versions on module_versions.module_id = modules.id
  and module_versions.scoring_version = 'enneagram-journey-score-1'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = instinct_items.construct_key
on conflict (module_version_id, item_code) do nothing;

-- Four independent dichotomies are the minimum contract for a 16-code output.
with dimensions(construct_key, label, description) as (
  values
    ('extraversion','Orientasi energi','Kecenderungan mengarahkan energi keluar dibanding ke dalam.'),
    ('intuition','Abstraksi informasi','Kecenderungan abstrak-intuitif dibanding konkret-sensing.'),
    ('logic','Dasar penilaian','Kecenderungan logic dibanding ethics dalam menilai.'),
    ('rationality','Ritme keputusan','Kecenderungan rational dibanding irrational dalam mengatur keputusan.')
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimensions.construct_key, 'general', dimensions.label, dimensions.description, 4
from dimensions
inner join public.modules on modules.key = 'socionics_communication'
inner join public.module_versions on module_versions.module_id = modules.id
  and module_versions.scoring_version = 'socionics-type-score-1'
on conflict (module_version_id, construct_key, facet_key) do nothing;

with items(construct_key, item_code, public_text, polarity, display_order) as (
  values
    ('extraversion','J_SOC_E01','Aku mudah mengarahkan energi ke aktivitas dan orang di sekitarku.',1,1),
    ('extraversion','J_SOC_E02','Aku sering memulai keterlibatan sebelum orang lain mengajakku.',1,2),
    ('extraversion','J_SOC_E03','Lingkungan yang aktif cenderung meningkatkan energiku.',1,3),
    ('extraversion','J_SOC_E04','Aku lebih jernih setelah mengolah sesuatu sendirian.',-1,4),
    ('extraversion','J_SOC_E05','Aku cenderung menunggu sebelum masuk ke dinamika kelompok.',-1,5),
    ('extraversion','J_SOC_E06','Interaksi panjang biasanya menguras energiku.',-1,6),
    ('intuition','J_SOC_N01','Aku cepat tertarik pada pola dan kemungkinan yang belum terlihat.',1,7),
    ('intuition','J_SOC_N02','Gagasan abstrak sering lebih menarik bagiku daripada detail konkret.',1,8),
    ('intuition','J_SOC_N03','Aku mudah membayangkan beberapa arah dari satu informasi.',1,9),
    ('intuition','J_SOC_N04','Aku lebih percaya hal yang dapat diamati langsung.',-1,10),
    ('intuition','J_SOC_N05','Detail nyata biasanya lebih penting daripada kemungkinan teoretis.',-1,11),
    ('intuition','J_SOC_N06','Instruksi konkret membantuku lebih dari gambaran abstrak.',-1,12),
    ('logic','J_SOC_L01','Konsistensi aturan menjadi dasar penting saat aku menilai pilihan.',1,13),
    ('logic','J_SOC_L02','Aku memisahkan dampak emosional dari ketepatan sebuah argumen.',1,14),
    ('logic','J_SOC_L03','Struktur sebab-akibat membantu menentukan keputusanku.',1,15),
    ('logic','J_SOC_L04','Dampak keputusan pada hubungan sering lebih penting daripada konsistensi aturan.',-1,16),
    ('logic','J_SOC_L05','Aku menyesuaikan penilaian agar tetap peka pada kebutuhan orang.',-1,17),
    ('logic','J_SOC_L06','Keselarasan nilai manusia lebih meyakinkanku daripada logika yang rapi.',-1,18),
    ('rationality','J_SOC_R01','Aku nyaman menetapkan struktur sebelum bergerak lebih jauh.',1,19),
    ('rationality','J_SOC_R02','Keputusan yang sudah ditutup membuat langkah berikutnya lebih jelas.',1,20),
    ('rationality','J_SOC_R03','Aku cenderung menjaga ritme yang terencana.',1,21),
    ('rationality','J_SOC_R04','Aku lebih nyaman menyesuaikan arah sambil berjalan.',-1,22),
    ('rationality','J_SOC_R05','Pilihan terbuka membuatku lebih leluasa merespons situasi.',-1,23),
    ('rationality','J_SOC_R06','Struktur terlalu awal dapat mengganggu caraku membaca keadaan.',-1,24)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select module_versions.id, question_dimensions.id, items.item_code, items.public_text,
  'Original LensaDiri experimental Socionics-type item ' || items.item_code,
  items.polarity, 1, true, array['quick','standard','deep']::text[], 0.9,
  false, null, 0, 'draft', items.display_order, 'active'
from items
inner join public.modules on modules.key = 'socionics_communication'
inner join public.module_versions on module_versions.module_id = modules.id
  and module_versions.scoring_version = 'socionics-type-score-1'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = items.construct_key
on conflict (module_version_id, item_code) do nothing;

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
where module_versions.scoring_version in (
  'enneagram-journey-score-1', 'socionics-type-score-1',
  'trait-profile-journey-1', 'psychosophy-journey-score-1'
)
on conflict (question_id, dimension_id) do nothing;

insert into public.question_translations (question_id, locale, public_text, review_status)
select questions.id, 'id', questions.public_text, 'draft'
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
where module_versions.scoring_version in (
  'enneagram-journey-score-1', 'socionics-type-score-1',
  'trait-profile-journey-1', 'psychosophy-journey-score-1'
)
on conflict (question_id, locale) do nothing;
