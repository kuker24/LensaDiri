-- Deferred modules item banks (experimental/functional).
-- These items are LensaDiri-authored reflective items for functional validation.
-- Status remains DEFERRED_WITH_REASON until passed language, construct, bias, and pilot reviews.

-- 1. Three Center (head, heart, gut)
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'three_center_likert_v1', 'three-center-score-1', 'three-center-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"dimensions":3}'::jsonb,
  '{"quickQuota":15,"standardQuota":21,"deepQuota":27}'::jsonb,
  'three-center-report-1',
  null
from public.modules where key = 'three_center'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('head', 'Pusat Pikiran', 'Dorongan untuk memahami, menganalisis, dan mencari pengetahuan.', 3),
    ('heart', 'Pusat Hati', 'Dorongan untuk merasa, berhubungan, dan menjaga kedekatan.', 3),
    ('gut', 'Pusat Perut', 'Dorongan untuk bertindak, melindungi, dan menjaga kelangsungan.', 3)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'three_center'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('head', 'TC_H01', 'Aku cenderung menganalisis situasi secara mendalam sebelum mengambil keputusan.', 1, 1, 1),
    ('head', 'TC_H02', 'Informasi dan data menjadi dasar utama dalam setiap pertimbanganku.', 1, 2, 1),
    ('head', 'TC_H03', 'Aku lebih suka memahami teori di balik suatu konsep daripada hanya praktik.', 1, 3, 1),
    ('head', 'TC_H04', 'Kesimpulan yang logis lebih meyakinkan bagiku daripada perasaan.', 1, 4, 1),
    ('head', 'TC_H05', 'Aku sering mengajukan pertanyaan untuk memahami sesuatu lebih dalam.', 1, 5, 1),
    ('head', 'TC_H06', 'Aku lebih nyaman dengan keputusan yang sudah didukung data.', 1, 6, 1),
    ('head', 'TC_H07', 'Membaca dan belajar hal baru memberi energiku.', 1, 7, 1),
    ('heart', 'TC_E01', 'Hubungan dengan orang lain menjadi sumber maknaku.', 1, 1, 2),
    ('heart', 'TC_E02', 'Aku merasa lebih baik ketika bisa berbagi dengan orang lain.', 1, 2, 2),
    ('heart', 'TC_E03', 'Emosi dan perasaan sering menjadi kompas dalam mengambil keputusan.', 1, 3, 2),
    ('heart', 'TC_E04', 'Kedekatan emosional dengan orang lain sangat penting bagiku.', 1, 4, 2),
    ('heart', 'TC_E05', 'Aku peka terhadap perasaan orang lain di sekitarku.', 1, 5, 2),
    ('heart', 'TC_E06', 'Aku ingin merasa dibutuhkan dan dicintai.', 1, 6, 2),
    ('heart', 'TC_E07', 'Aku mempertimbangkan dampak emosional sebelum bertindak.', 1, 7, 2),
    ('gut', 'TC_G01', 'Aku cenderung bertindak cepat ketika situasi membutuhkan.', 1, 1, 3),
    ('gut', 'TC_G02', 'Melindungi diri dan orang yang kusayangi adalah prioritas.', 1, 2, 3),
    ('gut', 'TC_G03', 'Aku lebih nyaman ketika punya kontrol atas situasi.', 1, 3, 3),
    ('gut', 'TC_G04', 'Aku tidak ragu mengambil keputusan tegas bila perlu.', 1, 4, 3),
    ('gut', 'TC_G05', 'Insting dan firasat sering mempengaruhi tindakanku.', 1, 5, 3),
    ('gut', 'TC_G06', 'Aku lebih suka bertindak daripada terlalu banyak berpikir.', 1, 6, 3),
    ('gut', 'TC_G07', 'Keberanian untuk menghadapi tantangan adalah nilai penting.', 1, 7, 3)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri three_center item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft',
  (item_bank.construct_index - 1) * 7 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'three_center'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'three_center'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- 2. Instinctual Variant (self_preservation, social, one_to_one)
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'instinct_likert_v1', 'instinct-score-1', 'instinct-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"patterns":3}'::jsonb,
  '{"quickQuota":12,"standardQuota":18,"deepQuota":24}'::jsonb,
  'instinct-report-1',
  null
from public.modules where key = 'instinct'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('self_preservation', 'Self-Preservation', 'Prioritas menjaga kelangsungan dan keamanan diri.', 4),
    ('social', 'Social', 'Prioritas mempertahankan posisi dan peran dalam kelompok.', 4),
    ('one_to_one', 'One-to-One', 'Prioritas kedekatan intim dengan individu tertentu.', 4)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'instinct'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('self_preservation', 'INST_SP01', 'Keamanan dan stabilitas menjadi prioritas utama dalam hidupku.', 1, 1, 1),
    ('self_preservation', 'INST_SP02', 'Aku memastikan kebutuhan dasarku terpenuhi sebelum memikirkan yang lain.', 1, 2, 1),
    ('self_preservation', 'INST_SP03', 'Aku cenderung berhati-hati dengan kesehatan dan kesejahteraan.', 1, 3, 1),
    ('self_preservation', 'INST_SP04', 'Persiapan dan perencanaan memberi rasa aman.', 1, 4, 1),
    ('self_preservation', 'INST_SP05', 'Aku lebih suka lingkungan yang stabil dan dapat diprediksi.', 1, 5, 1),
    ('self_preservation', 'INST_SP06', 'Menjaga keberlanjutan hidup lebih penting dari pada bersenang-senang.', 1, 6, 1),
    ('social', 'INST_SO01', 'Posisi dan reputasi dalam kelompok sangat berarti bagiku.', 1, 1, 2),
    ('social', 'INST_SO02', 'Aku merasa perlu berkontribusi agar diterima dalam kelompok.', 1, 2, 2),
    ('social', 'INST_SO03', 'Status sosial mempengaruhi kepercayaan diriku.', 1, 3, 2),
    ('social', 'INST_SO04', 'Aku berusaha menjaga hubungan baik dengan banyak orang.', 1, 4, 2),
    ('social', 'INST_SO05', 'Pendapat dan dukungan dari kelompok penting bagiku.', 1, 5, 2),
    ('social', 'INST_SO06', 'Aku ingin merasa menjadi bagian dari komunitas.', 1, 6, 2),
    ('one_to_one', 'INST_O201', 'Kedekatan dengan satu orang terdekat lebih berarti dari pada lingkaran sosial yang luas.', 1, 1, 3),
    ('one_to_one', 'INST_O202', 'Aku sangat memperhatikan satu orang yang sangat aku sayangi.', 1, 2, 3),
    ('one_to_one', 'INST_O203', 'Hubungan intim yang mendalam adalah prioritas utama.', 1, 3, 3),
    ('one_to_one', 'INST_O204', 'Aku lebih suka waktu berkualitas dengan satu orang terdekat daripada kelompok besar.', 1, 4, 3),
    ('one_to_one', 'INST_O205', 'Keintiman emosional dengan seseorang sangat penting.', 1, 5, 3),
    ('one_to_one', 'INST_O206', 'Aku mencurahkan perhatian utama pada satu orang terdekat secara mendalam.', 1, 6, 3)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri instinct item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft',
  (item_bank.construct_index - 1) * 6 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'instinct'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'instinct'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- 3. RIASEC Career Interest (realistic, investigative, artistic, social, enterprising, conventional)
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'riasec_likert_v1', 'riasec-score-1', 'riasec-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"dimensions":6}'::jsonb,
  '{"quickQuota":24,"standardQuota":36,"deepQuota":48}'::jsonb,
  'riasec-report-1',
  null
from public.modules where key = 'riasec'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('realistic', 'Realistic', 'Preferensi aktivitas fisik, konkret, dan berbasis keterampilan.', 4),
    ('investigative', 'Investigative', 'Preferensi analisis, pemecahan masalah, dan eksplorasi ilmiah.', 4),
    ('artistic', 'Artistic', 'Preferensi ekspresi kreatif, estetika, dan kebebasan.', 4),
    ('social', 'Social', 'Preferensi membantu, mengajar, dan berinteraksi dengan orang.', 4),
    ('enterprising', 'Enterprising', 'Preferensi kepemimpinan, persuasif, dan pencapaian tujuan.', 4),
    ('conventional', 'Conventional', 'Preferensi tugas terstruktur, administratif, dan presisi.', 4)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'riasec'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('realistic', 'RIAS_R01', 'Aku menikmati aktivitas yang melibatkan keterampilan fisik.', 1, 1, 1),
    ('realistic', 'RIAS_R02', 'Pekerjaan dengan tangan atau alat menjadi pilihan menarik.', 1, 2, 1),
    ('realistic', 'RIAS_R03', 'Aku lebih suka pekerjaan yang menghasilkan sesuatu yang konkret dan terlihat.', 1, 3, 1),
    ('realistic', 'RIAS_R04', 'Aktivitas luar ruangan dan alam lebih menarik bagiku.', 1, 4, 1),
    ('realistic', 'RIAS_R05', 'Aku merasa nyaman dengan pekerjaan yang tidak terlalu teoritis.', 1, 5, 1),
    ('realistic', 'RIAS_R06', 'Keterampilan teknis lebih penting dalam karierku.', 1, 6, 1),
    ('investigative', 'RIAS_I01', 'Memecahkan masalah kompleks menjadi tantangan yang menarik.', 1, 1, 2),
    ('investigative', 'RIAS_I02', 'Aku suka melakukan riset dan menganalisis data.', 1, 2, 2),
    ('investigative', 'RIAS_I03', 'Pertanyaan tanpa jawaban jelas memberi motivasi.', 1, 3, 2),
    ('investigative', 'RIAS_I04', 'Aku senang mengeksplorasi ide-ide baru dan konsep.', 1, 4, 2),
    ('investigative', 'RIAS_I05', 'Bidang sains dan teknologi menarik bagiku.', 1, 5, 2),
    ('investigative', 'RIAS_I06', 'Aku lebih suka bekerja dengan ide daripada orang.', 1, 6, 2),
    ('artistic', 'RIAS_A01', 'Ekspresi kreatif sangat penting dalam hidupku.', 1, 1, 3),
    ('artistic', 'RIAS_A02', 'Aku menikmati kebebasan dalam cara menyelesaikan pekerjaan.', 1, 2, 3),
    ('artistic', 'RIAS_A03', 'Estetika dan keindahan mempengaruhi pilihanku.', 1, 3, 3),
    ('artistic', 'RIAS_A04', 'Aku lebih suka pekerjaan yang tidak terstruktur secara ketat.', 1, 4, 3),
    ('artistic', 'RIAS_A05', 'Seni dan desain memberi inspirasi bagiku.', 1, 5, 3),
    ('artistic', 'RIAS_A06', 'Aku suka menciptakan sesuatu yang baru dan berbeda.', 1, 6, 3),
    ('social', 'RIAS_S01', 'Membantu orang lain memberi kepuasan bagiku.', 1, 1, 4),
    ('social', 'RIAS_S02', 'Aku menikmati interaksi dengan banyak orang setiap hari.', 1, 2, 4),
    ('social', 'RIAS_S03', 'Mengajarkan dan membimbing orang lain memang bermakna.', 1, 3, 4),
    ('social', 'RIAS_S04', 'Aku peka terhadap kebutuhan orang lain.', 1, 4, 4),
    ('social', 'RIAS_S05', 'Pekerjaan yang melibatkan layanan sosial menarik.', 1, 5, 4),
    ('social', 'RIAS_S06', 'Aku lebih suka bekerja dalam tim daripada sendiri.', 1, 6, 4),
    ('enterprising', 'RIAS_E01', 'Memimpin dan mempengaruhi orang lain menjadi kekuatan alami bagiku.', 1, 1, 5),
    ('enterprising', 'RIAS_E02', 'Target yang menantang memberi semangat.', 1, 2, 5),
    ('enterprising', 'RIAS_E03', 'Aku mampu meyakinkan dan membujuk orang dengan mudah.', 1, 3, 5),
    ('enterprising', 'RIAS_E04', 'Bisnis dan kewirausahaan menarik bagiku.', 1, 4, 5),
    ('enterprising', 'RIAS_E05', 'Aku senang mengambil inisiatif dalam tim.', 1, 5, 5),
    ('enterprising', 'RIAS_E06', 'Kesuksesan finansial adalah tujuan yang penting.', 1, 6, 5),
    ('conventional', 'RIAS_C01', 'Tugas yang terstruktur dan sistematis lebih efisien.', 1, 1, 6),
    ('conventional', 'RIAS_C02', 'Aku nyaman dengan pekerjaan yang jelas dan terdefinisi.', 1, 2, 6),
    ('conventional', 'RIAS_C03', 'Detail dan akurasi sangat penting bagiku.', 1, 3, 6),
    ('conventional', 'RIAS_C04', 'Data dan angka adalah kekuatanku.', 1, 4, 6),
    ('conventional', 'RIAS_C05', 'Pekerjaan administratif dan organisasi menarik.', 1, 5, 6),
    ('conventional', 'RIAS_C06', 'Aku lebih suka prosedur yang jelas dan konsisten.', 1, 6, 6)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri riasec item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft',
  (item_bank.construct_index - 1) * 6 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'riasec'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'riasec'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- 4. Attachment Reflection (secure, anxious, avoidant, fearful)
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'attachment_likert_v1', 'attachment-score-1', 'attachment-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"patterns":4}'::jsonb,
  '{"quickQuota":16,"standardQuota":24,"deepQuota":32}'::jsonb,
  'attachment-report-1',
  null
from public.modules where key = 'attachment'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('secure', 'Secure', 'Merasa nyaman dengan kedekatan dan percaya pada pasangan.', 4),
    ('anxious', 'Anxious', 'Merasa tidak pasti dan butuh validasi konstan dalam relasi.', 4),
    ('avoidant', 'Avoidant', 'Merasa perlu menjaga jarak dan mandiri dalam relasi.', 4),
    ('fearful', 'Fearful', 'Merasa takut dan menghindari keintiman karena pengalaman lalu.', 4)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'attachment'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('secure', 'ATT_S01', 'Aku nyaman dengan keintiman dan kedekatan dalam relasi.', 1, 1, 1),
    ('secure', 'ATT_S02', 'Aku percaya bahwa pasangan akan hadir saat dibutuhkan.', 1, 2, 1),
    ('secure', 'ATT_S03', 'Aku merasa aman berbagi perasaan dan pikiran dengan pasangan.', 1, 3, 1),
    ('secure', 'ATT_S04', 'Percaya dan terbuka adalah fondasi hubungan bagiku.', 1, 4, 1),
    ('secure', 'ATT_S05', 'Aku tidak merasa cemas ketika pasangan butuh ruang sendiri.', 1, 5, 1),
    ('secure', 'ATT_S06', 'Hubungan yang sehat dan saling menghormati penting.', 1, 6, 1),
    ('secure', 'ATT_S07', 'Aku bisa menjadi mandiri tanpa merasa cemas.', 1, 7, 1),
    ('secure', 'ATT_S08', 'Aku merasa nyaman baik mendekati maupun dijauhi.', 1, 8, 1),
    ('anxious', 'ATT_A01', 'Aku sering khawatir pasangan tidak benar-benar mencintaiku.', 1, 1, 2),
    ('anxious', 'ATT_A02', 'Aku butuh validasi konstan untuk merasa aman dalam relasi.', 1, 2, 2),
    ('anxious', 'ATT_A03', 'Aku sering merasa tidak pasti tentang status hubungan.', 1, 3, 2),
    ('anxious', 'ATT_A04', 'Ketakutan ditinggalkan sering mempengaruhi perilakuku.', 1, 4, 2),
    ('anxious', 'ATT_A05', 'Aku bisa menjadi sangat cemas jika pasangan tidak merespons.', 1, 5, 2),
    ('anxious', 'ATT_A06', 'Aku ingin pasangan selalu tersedia untukku.', 1, 6, 2),
    ('anxious', 'ATT_A07', 'Aku sering mengkhawatirkan hal-hal yang mungkin terjadi.', 1, 7, 2),
    ('anxious', 'ATT_A08', 'Perasaan tidak aman sering muncul dalam hubungan.', 1, 8, 2),
    ('avoidant', 'ATT_AV01', 'Aku lebih nyaman menjaga jarak emosional dalam relasi.', 1, 1, 3),
    ('avoidant', 'ATT_AV02', 'Kemandirian lebih penting daripada keintiman.', 1, 2, 3),
    ('avoidant', 'ATT_AV03', 'Aku merasa tidak perlu bergantung pada pasangan.', 1, 3, 3),
    ('avoidant', 'ATT_AV04', 'Aku lebih suka menyelesaikan masalah sendiri.', 1, 4, 3),
    ('avoidant', 'ATT_AV05', 'Ruang pribadi sangat penting dalam hubungan.', 1, 5, 3),
    ('avoidant', 'ATT_AV06', 'Aku tidak nyaman dengan ekspektasi pasangan.', 1, 6, 3),
    ('avoidant', 'ATT_AV07', 'Menunjukkan kelemahan terasa sulit bagiku.', 1, 7, 3),
    ('avoidant', 'ATT_AV08', 'Aku lebih memilih tidak terlalu dekat dengan orang lain.', 1, 8, 3),
    ('fearful', 'ATT_F01', 'Aku takut akan penolakan sehingga menghindari keintiman.', 1, 1, 4),
    ('fearful', 'ATT_F02', 'Pengalaman masa lalu mempengaruhi cara berelasi.', 1, 2, 4),
    ('fearful', 'ATT_F03', 'Aku ingin dekat tetapi juga takut terluka.', 1, 3, 4),
    ('fearful', 'ATT_F04', 'Sulit dipercaya orang setelah ada yang menyakiti.', 1, 4, 4),
    ('fearful', 'ATT_F05', 'Aku menghindari hubungan karena takut terluka.', 1, 5, 4),
    ('fearful', 'ATT_F06', 'Trauma masa lalu masih mempengaruhi hubungan saat ini.', 1, 6, 4),
    ('fearful', 'ATT_F07', 'Aku merasa tidak layak untuk dicintai.', 1, 7, 4),
    ('fearful', 'ATT_F08', 'Hubungan serius menakutkan karena ada kemungkinan terluka.', 1, 8, 4)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri attachment item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 1, 'draft',
  (item_bank.construct_index - 1) * 8 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'attachment'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'attachment'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- 5. Psychosophy (emotion, will, logic, physics) - EXCLUDED from default score report
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'psychosophy_likert_v1', 'psychosophy-score-1', 'psychosophy-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"quadrants":4}'::jsonb,
  '{"quickQuota":12,"standardQuota":16,"deepQuota":20}'::jsonb,
  'psychosophy-report-1',
  null
from public.modules where key = 'psychosophy'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('emotion', 'Emosi', 'Mengutamakan perasaan dan pengalaman internal.', 3),
    ('will', 'Volisi', 'Mengutamakan kehendak, tekad, dan aksi.', 3),
    ('logic', 'Logika', 'Mengutamakan analisis, rasionalitas, dan objektif.', 3),
    ('physics', 'Fisika', 'Mengutamakan dunia material, realitas konkret.', 3)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'psychosophy'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('emotion', 'PSY_E01', 'Pengalaman emosional adalah sumber makna terbesarku.', 1, 1, 1),
    ('emotion', 'PSY_E02', 'Perasaan sering memimpin keputusan hidupku.', 1, 2, 1),
    ('emotion', 'PSY_E03', 'Aku menyadari emosi diri sendiri dengan baik.', 1, 3, 1),
    ('emotion', 'PSY_E04', 'Seni dan musik sangat mempengaruhi diriku.', 1, 4, 1),
    ('emotion', 'PSY_E05', 'Intuisi dan perasaan lebih akurat daripada logika.', 1, 5, 1),
    ('emotion', 'PSY_E06', 'Emosi adalah aspek paling penting dari keberadaan.', 1, 6, 1),
    ('will', 'PSY_W01', 'Kehendak dan tekad adalah kekuatan utamaku.', 1, 1, 2),
    ('will', 'PSY_W02', 'Aku tidak menyerah mudah pada rintangan.', 1, 2, 2),
    ('will', 'PSY_W03', 'Aku membentuk nasibku sendiri melalui aksi.', 1, 3, 2),
    ('will', 'PSY_W04', 'Keberanian untuk bertindak lebih penting dari berpikir.', 1, 4, 2),
    ('will', 'PSY_W05', 'Aku adalah motor penggerak hidupku.', 1, 5, 2),
    ('will', 'PSY_W06', 'Keputusan dan aksi adalah prioritas.', 1, 6, 2),
    ('logic', 'PSY_L01', 'Analisis rasional adalah cara terbaik memahami sesuatu.', 1, 1, 3),
    ('logic', 'PSY_L02', 'Argumen logis lebih meyakinkan daripada emosi.', 1, 2, 3),
    ('logic', 'PSY_L03', 'Aku senang memecahkan masalah dengan metode.', 1, 3, 3),
    ('logic', 'PSY_L04', 'Data dan bukti adalah fondasi keputusan.', 1, 4, 3),
    ('logic', 'PSY_L05', 'Objektivitas adalah nilai yang kupegang.', 1, 5, 3),
    ('logic', 'PSY_L06', 'Pemikiran sistematis sangat penting.', 1, 6, 3),
    ('physics', 'PSY_P01', 'Realitas konkret dan dunia material adalah fokus.', 1, 1, 4),
    ('physics', 'PSY_P02', 'Praktis dan berguna adalah prioritas.', 1, 2, 4),
    ('physics', 'PSY_P03', 'Aku lebih suka hal yang bisa terlihat dan diukur.', 1, 3, 4),
    ('physics', 'PSY_P04', 'Pengalaman fisik dan aktivitas jasmani penting.', 1, 4, 4),
    ('physics', 'PSY_P05', 'Aku berfokus pada fakta, bukan abstraksi.', 1, 5, 4),
    ('physics', 'PSY_P06', 'Kehidupan nyata lebih bermakna daripada teori.', 1, 6, 4)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri psychosophy item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft',
  (item_bank.construct_index - 1) * 6 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'psychosophy'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'psychosophy'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- 6. Socionics Communication (information_processing, interaction_style) - EXCLUDED
insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select id, '1.0.0', 'socionics_likert_v1', 'socionics-score-1', 'socionics-id-1',
  'draft',
  '{"scaleMin":1,"scaleMax":5,"dimensions":2}'::jsonb,
  '{"quickQuota":8,"standardQuota":12,"deepQuota":16}'::jsonb,
  'socionics-report-1',
  null
from public.modules where key = 'socionics_communication'
on conflict do nothing;

with dimension_data(construct_key, label, description, minimum_coverage) as (
  values
    ('information_processing', 'Pemrosesan Informasi', 'Cara menerima dan mengolah informasi (konkret vs abstrak, berurutan vs asosiatif).', 4),
    ('interaction_style', 'Gaya Interaksi', 'Cara berinteraksi dengan dunia (responsif vs inisiator).', 4)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select module_versions.id, dimension_data.construct_key, 'general',
  dimension_data.label, dimension_data.description, dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = 'socionics_communication'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(construct_key, item_code, public_text, polarity, item_order, construct_index) as (
  values
    ('information_processing', 'SOC_IP01', 'Aku memproses informasi langkah demi langkah secara berurutan.', 1, 1, 1),
    ('information_processing', 'SOC_IP02', 'Detail konkret lebih penting dari konsep abstrak.', 1, 2, 1),
    ('information_processing', 'SOC_IP03', 'Aku lebih suka data nyata daripada teori.', 1, 3, 1),
    ('information_processing', 'SOC_IP04', 'Pengurutan yang jelas memudahkan pemahamanku.', 1, 4, 1),
    ('information_processing', 'SOC_IP05', 'Fakta dan observasi adalah dasar pemikiranku.', 1, 5, 1),
    ('information_processing', 'SOC_IP06', 'Aku suka hal-hal konkret yang bisa dipraktikkan.', 1, 6, 1),
    ('information_processing', 'SOC_IP07', 'Aku memproses informasi dengan melihat hubungan pola.', -1, 7, 1),
    ('information_processing', 'SOC_IP08', 'Gambaran besar lebih penting dari detail.', -1, 8, 1),
    ('interaction_style', 'SOC_IS01', 'Aku lebih suka merespons dibandingkan memulai.', 1, 1, 2),
    ('interaction_style', 'SOC_IS02', 'Aku menunggu seseorang memulai percakapan.', 1, 2, 2),
    ('interaction_style', 'SOC_IS03', 'Aku lebih nyaman mengikuti daripada memimpin.', 1, 3, 2),
    ('interaction_style', 'SOC_IS04', 'Aku menunda keputusan sampai ada instruksi.', 1, 4, 2),
    ('interaction_style', 'SOC_IS05', 'Aku lebih suka menunggu arahan daripada berinisiatif.', 1, 5, 2),
    ('interaction_style', 'SOC_IS06', 'Aku memilih untuk merespons dulu sebelum bertindak.', 1, 6, 2),
    ('interaction_style', 'SOC_IS07', 'Aku lebih sering memulai daripada menunggu.', -1, 7, 2),
    ('interaction_style', 'SOC_IS08', 'Aku terbiasa memimpin percakapan dan keputusan.', -1, 8, 2)
)
insert into public.questions (
  module_version_id, dimension_id, item_code, public_text, internal_construct_note,
  polarity, weight, quick_enabled, mode_eligibility, information_priority,
  clarifier_enabled, exposure_group, sensitivity_level, review_status,
  display_order, status
)
select 
  module_versions.id, 
  question_dimensions.id, 
  item_bank.item_code, 
  item_bank.public_text,
  'Original LensaDiri socionics item ' || item_bank.item_code,
  item_bank.polarity, 1, true,
  array['quick','standard','deep']::text[],
  0.9, false, null, 0, 'draft',
  (item_bank.construct_index - 1) * 8 + item_bank.item_order, 'active'
from item_bank
inner join public.modules on modules.key = 'socionics_communication'
inner join public.module_versions on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0' and modules.key = 'socionics_communication'
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

-- Note: All these modules remain DEFERRED_WITH_REASON in the catalog.
-- They become release-ready after:
-- 1. Language review (for Indonesian wording, cultural nuance)
-- 2. Construct review (psychometric validity, construct coverage)
-- 3. Bias review (cultural, age, gender fairness)
-- 4. Pilot testing (sample >= 50, analysis)
-- 5. Admin publishes via update query