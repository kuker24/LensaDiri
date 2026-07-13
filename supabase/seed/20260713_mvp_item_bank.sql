-- Original Indonesian MVP item bank. These statements are authored for LensaDiri
-- and do not copy a proprietary instrument.

insert into public.modules (
  key,
  public_name,
  internal_name,
  description,
  evidence_tier,
  status,
  category,
  is_selectable,
  minimum_age,
  default_order,
  description_key
)
values (
  'trait_profile',
  'Profil Trait',
  'Trait Profile',
  'Lima spektrum kecenderungan untuk refleksi diri, bukan diagnosis.',
  'A',
  'active',
  'trait',
  true,
  13,
  10,
  'module.trait_profile.description'
)
on conflict (key) do update set
  public_name = excluded.public_name,
  internal_name = excluded.internal_name,
  description = excluded.description,
  evidence_tier = excluded.evidence_tier,
  status = excluded.status,
  category = excluded.category,
  is_selectable = excluded.is_selectable,
  minimum_age = excluded.minimum_age,
  default_order = excluded.default_order,
  description_key = excluded.description_key;

insert into public.module_versions (
  module_id,
  version,
  scoring_strategy,
  scoring_version,
  item_bank_version,
  status,
  config_json,
  composer_config_json,
  report_template_version,
  published_at
)
select
  modules.id,
  'mvp-1',
  'weighted_likert_v1',
  'trait-profile-mvp-1',
  'trait-profile-mvp-1',
  'active',
  '{"quickItems":40,"standardItems":60,"scaleMin":1,"scaleMax":5}'::jsonb,
  '{"quickQuota":40,"standardQuota":60,"deepQuota":60}'::jsonb,
  'legacy-mvp-1',
  now()
from public.modules
where modules.key = 'trait_profile'
on conflict (module_id, version) do update set
  scoring_strategy = excluded.scoring_strategy,
  scoring_version = excluded.scoring_version,
  item_bank_version = excluded.item_bank_version,
  status = excluded.status,
  config_json = excluded.config_json,
  composer_config_json = excluded.composer_config_json,
  report_template_version = excluded.report_template_version,
  published_at = excluded.published_at;

with version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
)
insert into public.question_dimensions (module_version_id, construct_key, label, description)
select version.id, dimensions.construct_key, dimensions.label, dimensions.description
from version
cross join (
  values
    ('openness', 'Keterbukaan', 'Ketertarikan pada ide, pengalaman, dan sudut pandang baru.'),
    ('conscientiousness', 'Keteraturan', 'Kecenderungan merencanakan, menuntaskan, dan menjaga struktur.'),
    ('extraversion', 'Energi sosial', 'Cara memperoleh dan mengekspresikan energi dalam interaksi.'),
    ('agreeableness', 'Kooperasi', 'Kecenderungan memahami, mempercayai, dan bekerja bersama orang lain.'),
    ('emotional_sensitivity', 'Kepekaan emosi', 'Intensitas respons terhadap tekanan dan perubahan suasana.')
) as dimensions(construct_key, label, description)
on conflict (module_version_id, construct_key, facet_key) do update set
  label = excluded.label,
  description = excluded.description;

with version as (
  select module_versions.id
  from public.module_versions
  inner join public.modules on modules.id = module_versions.module_id
  where modules.key = 'trait_profile' and module_versions.version = 'mvp-1'
), item_bank(item_code, construct_key, public_text, polarity, quick_enabled, display_order) as (
  values
    ('O01','openness','Aku menikmati mencari cara baru untuk memahami suatu masalah.',1,true,1),
    ('O02','openness','Ide yang tidak biasa membuatku penasaran.',1,true,2),
    ('O03','openness','Aku suka mencoba aktivitas yang belum pernah kulakukan.',1,true,3),
    ('O04','openness','Aku tertarik melihat satu situasi dari banyak sudut.',1,true,4),
    ('O05','openness','Aku menikmati karya yang mengajak berpikir atau berimajinasi.',1,true,5),
    ('O06','openness','Perubahan kecil dalam rutinitas terasa menyegarkan bagiku.',1,true,6),
    ('O07','openness','Aku senang mempelajari topik di luar kebutuhan sehari-hari.',1,true,7),
    ('O08','openness','Aku mudah membayangkan beberapa kemungkinan masa depan.',1,true,8),
    ('O09','openness','Aku lebih nyaman memakai cara lama tanpa mempertimbangkan alternatif.',-1,false,9),
    ('O10','openness','Pembicaraan abstrak biasanya membuang waktuku.',-1,false,10),
    ('O11','openness','Aku tertarik menghubungkan ide dari bidang yang berbeda.',1,false,11),
    ('O12','openness','Aku memilih pengalaman yang familier daripada mengeksplorasi hal baru.',-1,false,12),
    ('C01','conscientiousness','Aku membuat rencana sebelum mengerjakan tugas penting.',1,true,13),
    ('C02','conscientiousness','Aku berusaha menepati tenggat yang sudah disepakati.',1,true,14),
    ('C03','conscientiousness','Aku mengecek kembali pekerjaan sebelum menganggapnya selesai.',1,true,15),
    ('C04','conscientiousness','Barang dan catatan penting biasanya mudah kutemukan.',1,true,16),
    ('C05','conscientiousness','Aku membagi tugas besar menjadi langkah yang jelas.',1,true,17),
    ('C06','conscientiousness','Aku tetap mengerjakan tanggung jawab meski sedang tidak bersemangat.',1,true,18),
    ('C07','conscientiousness','Aku mempertimbangkan akibat sebelum mengambil keputusan.',1,true,19),
    ('C08','conscientiousness','Rutinitas membantuku menjaga hal penting tetap berjalan.',1,true,20),
    ('C09','conscientiousness','Aku sering memulai sesuatu lalu membiarkannya tidak selesai.',-1,false,21),
    ('C10','conscientiousness','Aku baru mengurus tugas ketika waktunya hampir habis.',-1,false,22),
    ('C11','conscientiousness','Aku dapat menjaga fokus pada tujuan jangka menengah.',1,false,23),
    ('C12','conscientiousness','Detail penting sering terlewat karena aku terburu-buru.',-1,false,24),
    ('E01','extraversion','Berinteraksi dengan banyak orang biasanya menambah energiku.',1,true,25),
    ('E02','extraversion','Aku nyaman memulai percakapan dengan orang baru.',1,true,26),
    ('E03','extraversion','Aku mudah menunjukkan antusiasme saat bersama orang lain.',1,true,27),
    ('E04','extraversion','Aku suka terlibat aktif dalam kegiatan kelompok.',1,true,28),
    ('E05','extraversion','Aku cenderung berbicara ketika punya gagasan dalam diskusi.',1,true,29),
    ('E06','extraversion','Suasana ramai sering terasa menyenangkan bagiku.',1,true,30),
    ('E07','extraversion','Aku cepat akrab dalam lingkungan sosial baru.',1,true,31),
    ('E08','extraversion','Aku menikmati menjadi penggerak suasana dalam kelompok.',1,true,32),
    ('E09','extraversion','Setelah banyak interaksi, aku biasanya butuh waktu panjang untuk pulih.',-1,false,33),
    ('E10','extraversion','Aku lebih suka mengamati daripada ikut masuk dalam percakapan kelompok.',-1,false,34),
    ('E11','extraversion','Aku nyaman menyampaikan sesuatu di depan beberapa orang.',1,false,35),
    ('E12','extraversion','Aku menghindari kegiatan yang mengharuskan banyak interaksi.',-1,false,36),
    ('A01','agreeableness','Aku berusaha memahami alasan orang sebelum menilai tindakannya.',1,true,37),
    ('A02','agreeableness','Aku bersedia menyesuaikan cara kerja demi tujuan bersama.',1,true,38),
    ('A03','agreeableness','Aku memperhatikan dampak ucapanku pada perasaan orang lain.',1,true,39),
    ('A04','agreeableness','Aku mudah menawarkan bantuan ketika melihat orang kesulitan.',1,true,40),
    ('A05','agreeableness','Saat berbeda pendapat, aku tetap mencari titik temu.',1,true,41),
    ('A06','agreeableness','Aku cenderung memberi orang kesempatan untuk menjelaskan.',1,true,42),
    ('A07','agreeableness','Menjaga kepercayaan dalam hubungan penting bagiku.',1,true,43),
    ('A08','agreeableness','Aku dapat mengakui bagian kesalahanku dalam konflik.',1,true,44),
    ('A09','agreeableness','Aku sering menganggap niat orang lain buruk tanpa bukti yang cukup.',-1,false,45),
    ('A10','agreeableness','Menang dalam perdebatan lebih penting daripada menjaga hubungan.',-1,false,46),
    ('A11','agreeableness','Aku mampu tegas tanpa merendahkan orang lain.',1,false,47),
    ('A12','agreeableness','Aku sulit peduli ketika masalah orang lain tidak berdampak padaku.',-1,false,48),
    ('N01','emotional_sensitivity','Perubahan rencana mendadak dapat membuatku tegang.',1,true,49),
    ('N02','emotional_sensitivity','Aku cukup lama memikirkan kesalahan kecil yang kubuat.',1,true,50),
    ('N03','emotional_sensitivity','Suasana hatiku mudah terpengaruh oleh ketegangan di sekitar.',1,true,51),
    ('N04','emotional_sensitivity','Saat banyak hal menumpuk, aku cepat merasa kewalahan.',1,true,52),
    ('N05','emotional_sensitivity','Aku sering membayangkan hal yang mungkin berjalan buruk.',1,true,53),
    ('N06','emotional_sensitivity','Kritik dapat tetap terasa dalam pikiranku cukup lama.',1,true,54),
    ('N07','emotional_sensitivity','Aku peka terhadap perubahan kecil dalam sikap orang lain.',1,true,55),
    ('N08','emotional_sensitivity','Tubuhku cepat memberi tanda ketika aku sedang tertekan.',1,true,56),
    ('N09','emotional_sensitivity','Aku tetap tenang ketika menghadapi situasi yang tidak pasti.',-1,false,57),
    ('N10','emotional_sensitivity','Aku cepat kembali stabil setelah pengalaman yang mengecewakan.',-1,false,58),
    ('N11','emotional_sensitivity','Tekanan kecil jarang mengganggu konsentrasiku.',-1,false,59),
    ('N12','emotional_sensitivity','Aku dapat melepaskan kekhawatiran setelah mengambil langkah yang masuk akal.',-1,false,60)
)
insert into public.questions (
  module_version_id,
  dimension_id,
  item_code,
  public_text,
  internal_construct_note,
  polarity,
  weight,
  quick_enabled,
  mode_eligibility,
  information_priority,
  review_status,
  display_order,
  status
)
select
  version.id,
  dimensions.id,
  item_bank.item_code,
  item_bank.public_text,
  'Original Indonesian MVP trait item ' || item_bank.item_code,
  item_bank.polarity,
  1,
  item_bank.quick_enabled,
  case
    when item_bank.quick_enabled then array['quick', 'standard', 'deep']::text[]
    else array['standard', 'deep']::text[]
  end,
  case when item_bank.quick_enabled then 0.8 else 0.6 end,
  'approved',
  item_bank.display_order,
  'active'
from version
inner join public.question_dimensions as dimensions on dimensions.module_version_id = version.id
inner join item_bank on item_bank.construct_key = dimensions.construct_key
on conflict (module_version_id, item_code) do update set
  dimension_id = excluded.dimension_id,
  public_text = excluded.public_text,
  internal_construct_note = excluded.internal_construct_note,
  polarity = excluded.polarity,
  weight = excluded.weight,
  quick_enabled = excluded.quick_enabled,
  mode_eligibility = excluded.mode_eligibility,
  information_priority = excluded.information_priority,
  review_status = excluded.review_status,
  display_order = excluded.display_order,
  status = excluded.status;

insert into public.question_translations (question_id, locale, public_text, review_status)
select id, 'id', public_text, 'approved'
from public.questions
on conflict (question_id, locale) do update set
  public_text = excluded.public_text,
  review_status = excluded.review_status;

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight
)
select id, dimension_id, 'primary', polarity, weight
from public.questions
on conflict (question_id, dimension_id) do update set
  scoring_role = excluded.scoring_role,
  polarity = excluded.polarity,
  weight = excluded.weight;
