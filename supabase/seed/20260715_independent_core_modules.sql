-- Original Indonesian item banks for independently scored core modules.
-- These are LensaDiri-authored reflective items, not copies of proprietary instruments.
-- Published version content becomes immutable through migration triggers.

-- Catalog metadata becomes stable after initial publication. Replay never writes
-- already-published rows or their timestamps.
update public.modules
set status = 'published', is_selectable = true
where key in ('type_16', 'enneagram', 'temperament')
  and (status <> 'published' or not is_selectable);

insert into public.module_versions (
  module_id, version, scoring_strategy, scoring_version, item_bank_version,
  status, config_json, composer_config_json, report_template_version, published_at
)
select
  modules.id,
  '1.0.0',
  versions.scoring_strategy,
  versions.scoring_version,
  versions.item_bank_version,
  'draft',
  versions.config_json,
  versions.composer_config_json,
  versions.report_template_version,
  null
from public.modules
inner join (
  values
    (
      'type_16', 'type16_likert_v1', 'type16-score-1', 'type16-id-1',
      '{"scaleMin":1,"scaleMax":5,"dimensions":4}'::jsonb,
      '{"quickQuota":32,"standardQuota":40,"deepQuota":48}'::jsonb,
      'type16-report-1'
    ),
    (
      'enneagram', 'enneagram_likert_v1', 'enneagram-score-1', 'enneagram-id-1',
      '{"scaleMin":1,"scaleMax":5,"patterns":9}'::jsonb,
      '{"quickQuota":36,"standardQuota":45,"deepQuota":54}'::jsonb,
      'enneagram-report-1'
    ),
    (
      'temperament', 'temperament_likert_v1', 'temperament-score-1', 'temperament-id-1',
      '{"scaleMin":1,"scaleMax":5,"patterns":4}'::jsonb,
      '{"quickQuota":20,"standardQuota":28,"deepQuota":36}'::jsonb,
      'temperament-report-1'
    )
) as versions(
  module_key, scoring_strategy, scoring_version, item_bank_version,
  config_json, composer_config_json, report_template_version
) on versions.module_key = modules.key
where not exists (
  select 1 from public.module_versions
  where module_versions.module_id = modules.id and module_versions.version = '1.0.0'
);

with dimension_data(module_key, construct_key, label, description, minimum_coverage) as (
  values
    ('type_16', 'extraversion', 'Energi eksternal', 'Preferensi mengarahkan energi melalui interaksi dan aktivitas eksternal.', 6),
    ('type_16', 'intuition', 'Pola dan kemungkinan', 'Preferensi melihat pola, makna, dan kemungkinan dibanding detail konkret.', 6),
    ('type_16', 'feeling', 'Pertimbangan manusia', 'Preferensi mempertimbangkan nilai dan dampak manusia saat menilai pilihan.', 6),
    ('type_16', 'judging', 'Struktur keputusan', 'Preferensi membuat struktur dan penutupan dibanding menjaga pilihan tetap terbuka.', 6),
    ('enneagram', 'pattern_1', 'Pola 1 · Perbaikan', 'Dorongan memperbaiki, menjaga standar, dan bertindak benar.', 4),
    ('enneagram', 'pattern_2', 'Pola 2 · Keterhubungan', 'Dorongan membantu, dibutuhkan, dan menjaga kedekatan.', 4),
    ('enneagram', 'pattern_3', 'Pola 3 · Pencapaian', 'Dorongan mencapai hasil, berkembang, dan terlihat efektif.', 4),
    ('enneagram', 'pattern_4', 'Pola 4 · Keaslian', 'Dorongan memahami identitas, makna, dan keunikan pengalaman.', 4),
    ('enneagram', 'pattern_5', 'Pola 5 · Pemahaman', 'Dorongan memahami, menjaga sumber daya, dan merasa kompeten.', 4),
    ('enneagram', 'pattern_6', 'Pola 6 · Kesiapsiagaan', 'Dorongan mencari kepastian, dukungan, dan kesiapan menghadapi risiko.', 4),
    ('enneagram', 'pattern_7', 'Pola 7 · Kemungkinan', 'Dorongan mencari pilihan, pengalaman, dan kebebasan bergerak.', 4),
    ('enneagram', 'pattern_8', 'Pola 8 · Kemandirian', 'Dorongan menjaga kendali, kekuatan, dan perlindungan.', 4),
    ('enneagram', 'pattern_9', 'Pola 9 · Ketenangan', 'Dorongan menjaga harmoni, stabilitas, dan ruang yang damai.', 4),
    ('temperament', 'sanguine', 'Ekspresif', 'Energi sosial, spontanitas, dan ekspresi yang terlihat.', 4),
    ('temperament', 'choleric', 'Penggerak', 'Ketegasan, kecepatan bertindak, dan orientasi hasil.', 4),
    ('temperament', 'melancholic', 'Mendalam', 'Ketelitian, refleksi, dan kepekaan pada kualitas.', 4),
    ('temperament', 'phlegmatic', 'Stabil', 'Ketenangan, kesabaran, dan kestabilan ritme.', 4)
)
insert into public.question_dimensions (
  module_version_id, construct_key, facet_key, label, description, minimum_item_coverage
)
select
  module_versions.id,
  dimension_data.construct_key,
  'general',
  dimension_data.label,
  dimension_data.description,
  dimension_data.minimum_coverage
from dimension_data
inner join public.modules on modules.key = dimension_data.module_key
inner join public.module_versions
  on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
where not exists (
  select 1 from public.question_dimensions
  where question_dimensions.module_version_id = module_versions.id
    and question_dimensions.construct_key = dimension_data.construct_key
    and question_dimensions.facet_key = 'general'
);

with item_bank(
  module_key, item_code, construct_key, public_text, polarity, item_order,
  quick_enabled, standard_enabled
) as (
  values
    ('type_16','T16_E01','extraversion','Aku memperoleh energi ketika terlibat aktif dalam percakapan bersama orang lain.',1,1,true,true),
    ('type_16','T16_E02','extraversion','Aku mudah berpikir sambil berbicara dan menanggapi situasi secara langsung.',1,2,true,true),
    ('type_16','T16_E03','extraversion','Dalam kelompok baru, aku cenderung mulai membangun interaksi lebih dulu.',1,3,true,true),
    ('type_16','T16_E04','extraversion','Hari yang berisi banyak aktivitas bersama biasanya terasa menghidupkan.',1,4,true,true),
    ('type_16','T16_E05','extraversion','Aku nyaman membagikan gagasan sebelum semuanya tersusun sempurna.',1,5,true,true),
    ('type_16','T16_E06','extraversion','Aku sering mencari teman untuk memproses pengalaman yang baru terjadi.',1,6,true,true),
    ('type_16','T16_E07','extraversion','Kesempatan bertemu banyak orang terasa lebih menarik daripada melelahkan.',1,7,true,true),
    ('type_16','T16_E08','extraversion','Aku menikmati peran yang membuatku terlihat dan terlibat di tengah kegiatan.',1,8,true,true),
    ('type_16','T16_E09','extraversion','Aku lebih jernih ketika memikirkan sesuatu sendirian sebelum membahasnya.',-1,9,false,true),
    ('type_16','T16_E10','extraversion','Setelah interaksi panjang, aku membutuhkan waktu tenang untuk mengisi energi.',-1,10,false,true),
    ('type_16','T16_E11','extraversion','Aku biasanya menunggu orang lain membuka percakapan dalam lingkungan baru.',-1,11,false,false),
    ('type_16','T16_E12','extraversion','Aku lebih memilih lingkaran kecil yang mendalam daripada banyak kontak sosial.',-1,12,false,false),

    ('type_16','T16_N01','intuition','Aku cepat melihat pola yang menghubungkan beberapa kejadian berbeda.',1,13,true,true),
    ('type_16','T16_N02','intuition','Kemungkinan masa depan sering menarik perhatianku lebih dari keadaan sekarang.',1,14,true,true),
    ('type_16','T16_N03','intuition','Aku menikmati pertanyaan yang tidak memiliki satu jawaban konkret.',1,15,true,true),
    ('type_16','T16_N04','intuition','Saat menerima informasi, aku mencari makna besar di balik detailnya.',1,16,true,true),
    ('type_16','T16_N05','intuition','Ide baru membuatku ingin membayangkan berbagai arah pengembangannya.',1,17,true,true),
    ('type_16','T16_N06','intuition','Aku sering menghubungkan topik yang bagi orang lain tampak tidak berkaitan.',1,18,true,true),
    ('type_16','T16_N07','intuition','Metafora dan gambaran konseptual membantuku memahami sesuatu.',1,19,true,true),
    ('type_16','T16_N08','intuition','Aku tertarik pada apa yang mungkin terjadi, bukan hanya apa yang sudah terbukti.',1,20,true,true),
    ('type_16','T16_N09','intuition','Aku lebih percaya contoh nyata daripada kemungkinan yang belum diuji.',-1,21,false,true),
    ('type_16','T16_N10','intuition','Instruksi yang konkret terasa lebih berguna daripada gambaran konseptual.',-1,22,false,true),
    ('type_16','T16_N11','intuition','Aku cenderung memperhatikan fakta satu per satu sebelum mencari polanya.',-1,23,false,false),
    ('type_16','T16_N12','intuition','Pembahasan abstrak terasa kurang berguna bila tidak segera dapat diterapkan.',-1,24,false,false),

    ('type_16','T16_F01','feeling','Dampak keputusan pada orang lain menjadi bagian penting dari pertimbanganku.',1,25,true,true),
    ('type_16','T16_F02','feeling','Aku berusaha memahami nilai pribadi yang ada di balik pilihan seseorang.',1,26,true,true),
    ('type_16','T16_F03','feeling','Cara menyampaikan kritik sama pentingnya dengan isi kritik tersebut.',1,27,true,true),
    ('type_16','T16_F04','feeling','Saat dua pilihan sama masuk akal, aku mempertimbangkan mana yang lebih manusiawi.',1,28,true,true),
    ('type_16','T16_F05','feeling','Aku peka ketika keputusan yang efisien berisiko melukai kepercayaan.',1,29,true,true),
    ('type_16','T16_F06','feeling','Keselarasan dengan nilai pribadi memengaruhi rasa yakin terhadap keputusan.',1,30,true,true),
    ('type_16','T16_F07','feeling','Aku mudah menangkap kebutuhan emosional yang tidak disampaikan langsung.',1,31,true,true),
    ('type_16','T16_F08','feeling','Aku ingin hasil yang adil sekaligus menjaga martabat orang yang terlibat.',1,32,true,true),
    ('type_16','T16_F09','feeling','Konsistensi logika lebih penting daripada perasaan pihak yang terdampak.',-1,33,false,true),
    ('type_16','T16_F10','feeling','Aku dapat mengesampingkan nilai pribadi untuk memakai kriteria yang seragam.',-1,34,false,true),
    ('type_16','T16_F11','feeling','Dalam konflik, aku fokus mencari argumen paling kuat sebelum menjaga suasana.',-1,35,false,false),
    ('type_16','T16_F12','feeling','Keputusan yang tepat tidak harus terasa nyaman bagi orang yang terlibat.',-1,36,false,false),

    ('type_16','T16_J01','judging','Aku merasa lega ketika keputusan penting sudah dibuat dan langkahnya jelas.',1,37,true,true),
    ('type_16','T16_J02','judging','Jadwal membantu pikiranku tetap tenang dan terarah.',1,38,true,true),
    ('type_16','T16_J03','judging','Aku lebih suka menuntaskan satu tahap sebelum membuka banyak pilihan baru.',1,39,true,true),
    ('type_16','T16_J04','judging','Aku biasanya menentukan prioritas sebelum mulai bekerja.',1,40,true,true),
    ('type_16','T16_J05','judging','Perubahan mendadak lebih mudah kuhadapi bila rencana dasarnya tetap jelas.',1,41,true,true),
    ('type_16','T16_J06','judging','Aku berusaha menyelesaikan kewajiban lebih awal daripada mendekati tenggat.',1,42,true,true),
    ('type_16','T16_J07','judging','Daftar langkah membuat tugas besar terasa lebih mudah dikendalikan.',1,43,true,true),
    ('type_16','T16_J08','judging','Aku nyaman ketika hari memiliki struktur yang dapat diperkirakan.',1,44,true,true),
    ('type_16','T16_J09','judging','Aku suka membiarkan pilihan terbuka sampai informasi terakhir tersedia.',-1,45,false,true),
    ('type_16','T16_J10','judging','Rencana yang terlalu rinci sering terasa membatasi kebebasanku bergerak.',-1,46,false,true),
    ('type_16','T16_J11','judging','Aku mudah berpindah arah bila muncul kesempatan yang lebih menarik.',-1,47,false,false),
    ('type_16','T16_J12','judging','Aku lebih menikmati proses spontan daripada mencapai penutupan yang cepat.',-1,48,false,false),

    ('enneagram','ENN_101','pattern_1','Aku cepat melihat bagian yang dapat diperbaiki agar hasil lebih tepat.',1,1,true,true),
    ('enneagram','ENN_102','pattern_1','Standar batin yang kuat memengaruhi cara aku menilai tindakanku.',1,2,true,true),
    ('enneagram','ENN_103','pattern_1','Aku merasa bertanggung jawab membenahi hal yang menurutku kurang benar.',1,3,true,true),
    ('enneagram','ENN_104','pattern_1','Kesalahan kecil dapat tetap menggangguku meski orang lain menganggapnya selesai.',1,4,true,true),
    ('enneagram','ENN_105','pattern_1','Aku bisa menerima hasil seadanya tanpa dorongan untuk menyempurnakannya.',-1,5,false,true),
    ('enneagram','ENN_106','pattern_1','Aku berusaha konsisten antara prinsip yang kupercaya dan tindakan sehari-hari.',1,6,false,false),

    ('enneagram','ENN_201','pattern_2','Aku merasa berarti ketika dapat membantu kebutuhan orang lain.',1,7,true,true),
    ('enneagram','ENN_202','pattern_2','Aku mudah memperhatikan apa yang dapat kulakukan agar orang merasa didukung.',1,8,true,true),
    ('enneagram','ENN_203','pattern_2','Kedekatan tumbuh bagiku ketika aku dapat memberi sesuatu yang berguna.',1,9,true,true),
    ('enneagram','ENN_204','pattern_2','Aku kadang lebih cepat mengenali kebutuhan orang lain daripada kebutuhanku sendiri.',1,10,true,true),
    ('enneagram','ENN_205','pattern_2','Aku tetap nyaman meski kontribusiku tidak dibutuhkan atau diperhatikan.',-1,11,false,true),
    ('enneagram','ENN_206','pattern_2','Penolakan terhadap bantuanku dapat terasa lebih pribadi daripada yang kuharapkan.',1,12,false,false),

    ('enneagram','ENN_301','pattern_3','Target yang jelas membuatku ingin menunjukkan hasil terbaik.',1,13,true,true),
    ('enneagram','ENN_302','pattern_3','Aku cepat menyesuaikan cara kerja agar tetap efektif dalam situasi berbeda.',1,14,true,true),
    ('enneagram','ENN_303','pattern_3','Kemajuan yang terlihat membuatku merasa berada di jalur yang tepat.',1,15,true,true),
    ('enneagram','ENN_304','pattern_3','Aku memperhatikan bagaimana kemampuan dan pencapaianku terlihat oleh orang lain.',1,16,true,true),
    ('enneagram','ENN_305','pattern_3','Aku tidak keberatan terlihat kurang berhasil selama prosesnya terasa nyaman.',-1,17,false,true),
    ('enneagram','ENN_306','pattern_3','Saat sibuk mengejar hasil, aku dapat menunda memeriksa apa yang sebenarnya kurasakan.',1,18,false,false),

    ('enneagram','ENN_401','pattern_4','Aku ingin pengalaman hidup terasa autentik dan memiliki makna pribadi.',1,19,true,true),
    ('enneagram','ENN_402','pattern_4','Perbedaan kecil dalam suasana hati dapat memberi warna besar pada hariku.',1,20,true,true),
    ('enneagram','ENN_403','pattern_4','Aku sering mencari kata yang tepat untuk menjelaskan pengalaman batinku.',1,21,true,true),
    ('enneagram','ENN_404','pattern_4','Hal yang terasa khas atau mendalam lebih menarik daripada yang sekadar populer.',1,22,true,true),
    ('enneagram','ENN_405','pattern_4','Aku jarang memikirkan apakah hidupku mencerminkan siapa diriku sebenarnya.',-1,23,false,true),
    ('enneagram','ENN_406','pattern_4','Aku dapat merasa ada sesuatu yang kurang meski keadaan secara umum baik.',1,24,false,false),

    ('enneagram','ENN_501','pattern_5','Aku merasa lebih siap setelah memahami cara kerja suatu hal secara mendalam.',1,25,true,true),
    ('enneagram','ENN_502','pattern_5','Aku membutuhkan ruang pribadi untuk mengolah informasi tanpa banyak tuntutan.',1,26,true,true),
    ('enneagram','ENN_503','pattern_5','Mengamati terlebih dahulu terasa lebih aman daripada langsung terlibat.',1,27,true,true),
    ('enneagram','ENN_504','pattern_5','Aku menjaga waktu dan energiku agar tidak cepat terkuras.',1,28,true,true),
    ('enneagram','ENN_505','pattern_5','Aku nyaman bertindak meski belum memahami situasinya dengan cukup.',-1,29,false,true),
    ('enneagram','ENN_506','pattern_5','Merasa kompeten membuatku lebih mudah membuka diri dan berpartisipasi.',1,30,false,false),

    ('enneagram','ENN_601','pattern_6','Aku terbiasa memikirkan risiko sebelum mempercayai sebuah rencana.',1,31,true,true),
    ('enneagram','ENN_602','pattern_6','Dukungan dari orang atau sistem yang dapat dipercaya membuatku lebih mantap.',1,32,true,true),
    ('enneagram','ENN_603','pattern_6','Aku memeriksa kemungkinan masalah agar tidak terkejut di kemudian hari.',1,33,true,true),
    ('enneagram','ENN_604','pattern_6','Ketidakjelasan dapat membuat pikiranku mencari banyak skenario sekaligus.',1,34,true,true),
    ('enneagram','ENN_605','pattern_6','Aku mudah mengambil keputusan penting tanpa memeriksa potensi risikonya.',-1,35,false,true),
    ('enneagram','ENN_606','pattern_6','Aku dapat bergantian antara mencari kepastian dan menantang sumber otoritas.',1,36,false,false),

    ('enneagram','ENN_701','pattern_7','Pilihan baru membuatku cepat membayangkan pengalaman yang menyenangkan.',1,37,true,true),
    ('enneagram','ENN_702','pattern_7','Aku menjaga beberapa rencana agar tidak merasa terjebak pada satu jalan.',1,38,true,true),
    ('enneagram','ENN_703','pattern_7','Saat suasana berat, pikiranku mencari sisi menarik atau kemungkinan berikutnya.',1,39,true,true),
    ('enneagram','ENN_704','pattern_7','Kebebasan bergerak terasa penting untuk menjaga energiku.',1,40,true,true),
    ('enneagram','ENN_705','pattern_7','Aku nyaman bertahan lama pada pengalaman tidak menyenangkan tanpa mencari pengalihan.',-1,41,false,true),
    ('enneagram','ENN_706','pattern_7','Antusiasme pada ide baru kadang muncul sebelum rencana lama selesai.',1,42,false,false),

    ('enneagram','ENN_801','pattern_8','Aku cenderung mengambil kendali ketika keadaan terasa tidak tegas.',1,43,true,true),
    ('enneagram','ENN_802','pattern_8','Aku menghargai komunikasi langsung meski terdengar keras.',1,44,true,true),
    ('enneagram','ENN_803','pattern_8','Melindungi orang yang rentan dapat membangkitkan keberanianku.',1,45,true,true),
    ('enneagram','ENN_804','pattern_8','Aku lebih nyaman menghadapi konflik daripada membiarkan masalah menggantung.',1,46,true,true),
    ('enneagram','ENN_805','pattern_8','Aku mudah menyerahkan keputusan penting kepada orang yang lebih dominan.',-1,47,false,true),
    ('enneagram','ENN_806','pattern_8','Menunjukkan kelemahan terasa sulit ketika aku belum yakin lingkungan aman.',1,48,false,false),

    ('enneagram','ENN_901','pattern_9','Aku berusaha menjaga suasana tetap tenang ketika muncul perbedaan.',1,49,true,true),
    ('enneagram','ENN_902','pattern_9','Aku mudah melihat beberapa sisi sehingga keputusan dapat terasa lambat.',1,50,true,true),
    ('enneagram','ENN_903','pattern_9','Rutinitas yang stabil membantuku merasa nyaman dan terhubung.',1,51,true,true),
    ('enneagram','ENN_904','pattern_9','Aku kadang menunda menyampaikan keinginanku agar tidak memicu ketegangan.',1,52,true,true),
    ('enneagram','ENN_905','pattern_9','Aku cepat menegaskan agenda pribadiku meski suasana menjadi tidak nyaman.',-1,53,false,true),
    ('enneagram','ENN_906','pattern_9','Aku dapat larut dalam kebutuhan sekitar sampai lupa prioritas sendiri.',1,54,false,false),

    ('temperament','TMP_S01','sanguine','Aku mudah menunjukkan kegembiraan ketika suasana terasa menyenangkan.',1,1,true,true),
    ('temperament','TMP_S02','sanguine','Pertemuan spontan sering membuat energiku meningkat.',1,2,true,true),
    ('temperament','TMP_S03','sanguine','Aku cepat menemukan hal menarik untuk dibicarakan bersama orang lain.',1,3,true,true),
    ('temperament','TMP_S04','sanguine','Ekspresi wajah dan nada suaraku biasanya mudah terbaca.',1,4,true,true),
    ('temperament','TMP_S05','sanguine','Aku menikmati variasi aktivitas dalam satu hari.',1,5,true,true),
    ('temperament','TMP_S06','sanguine','Aku cenderung membawa suasana ringan ketika kelompok terasa kaku.',1,6,false,true),
    ('temperament','TMP_S07','sanguine','Aku lebih suka menahan reaksi agar tidak terlihat oleh orang lain.',-1,7,false,true),
    ('temperament','TMP_S08','sanguine','Kegiatan sosial yang ramai biasanya cepat menguras energiku.',-1,8,false,false),
    ('temperament','TMP_S09','sanguine','Aku mudah beralih ke pengalaman baru setelah sesuatu selesai.',1,9,false,false),

    ('temperament','TMP_C01','choleric','Aku cepat menentukan langkah ketika kelompok membutuhkan arah.',1,10,true,true),
    ('temperament','TMP_C02','choleric','Hambatan membuatku ingin mencari cara agar tujuan tetap tercapai.',1,11,true,true),
    ('temperament','TMP_C03','choleric','Aku nyaman menyampaikan keputusan dengan tegas.',1,12,true,true),
    ('temperament','TMP_C04','choleric','Kecepatan dan hasil sering menjadi ukuran penting dalam pekerjaanku.',1,13,true,true),
    ('temperament','TMP_C05','choleric','Aku terdorong mengambil tanggung jawab ketika proses berjalan lambat.',1,14,true,true),
    ('temperament','TMP_C06','choleric','Kompetisi yang sehat dapat memunculkan fokus terbaikku.',1,15,false,true),
    ('temperament','TMP_C07','choleric','Aku cenderung menunggu arahan daripada memulai tindakan sendiri.',-1,16,false,true),
    ('temperament','TMP_C08','choleric','Aku menghindari keputusan cepat meski situasi menuntut arah.',-1,17,false,false),
    ('temperament','TMP_C09','choleric','Aku mudah menyederhanakan masalah menjadi langkah yang dapat dilakukan.',1,18,false,false),

    ('temperament','TMP_M01','melancholic','Aku memperhatikan detail yang dapat memengaruhi kualitas hasil.',1,19,true,true),
    ('temperament','TMP_M02','melancholic','Aku membutuhkan waktu untuk merenungkan arti dari pengalaman penting.',1,20,true,true),
    ('temperament','TMP_M03','melancholic','Standar yang jelas membantuku menghasilkan sesuatu yang dapat kubanggakan.',1,21,true,true),
    ('temperament','TMP_M04','melancholic','Aku peka terhadap nuansa yang sering terlewat oleh orang lain.',1,22,true,true),
    ('temperament','TMP_M05','melancholic','Sebelum bertindak, aku mempertimbangkan kemungkinan kesalahan.',1,23,true,true),
    ('temperament','TMP_M06','melancholic','Aku menikmati proses memperbaiki hasil sampai terasa tepat.',1,24,false,true),
    ('temperament','TMP_M07','melancholic','Aku jarang memeriksa detail bila gambaran umumnya sudah cukup.',-1,25,false,true),
    ('temperament','TMP_M08','melancholic','Pengalaman emosional biasanya berlalu tanpa banyak kupikirkan.',-1,26,false,false),
    ('temperament','TMP_M09','melancholic','Aku lebih nyaman menyiapkan diri daripada mengandalkan improvisasi.',1,27,false,false),

    ('temperament','TMP_P01','phlegmatic','Aku dapat menjaga ritme tenang ketika orang di sekitarku terburu-buru.',1,28,true,true),
    ('temperament','TMP_P02','phlegmatic','Aku sabar mendengarkan sebelum memberi tanggapan.',1,29,true,true),
    ('temperament','TMP_P03','phlegmatic','Stabilitas sehari-hari membantuku bekerja dengan konsisten.',1,30,true,true),
    ('temperament','TMP_P04','phlegmatic','Aku tidak mudah terpancing oleh perubahan suasana sesaat.',1,31,true,true),
    ('temperament','TMP_P05','phlegmatic','Dalam konflik, aku cenderung menurunkan ketegangan terlebih dahulu.',1,32,true,true),
    ('temperament','TMP_P06','phlegmatic','Aku nyaman menjalankan proses yang mantap tanpa perlu banyak sorotan.',1,33,false,true),
    ('temperament','TMP_P07','phlegmatic','Aku mudah kehilangan kesabaran ketika hasil tidak segera terlihat.',-1,34,false,true),
    ('temperament','TMP_P08','phlegmatic','Perubahan kecil sering membuat reaksiku lebih kuat dari yang kuinginkan.',-1,35,false,false),
    ('temperament','TMP_P09','phlegmatic','Aku memberi waktu bagi keputusan untuk matang sebelum bertindak.',1,36,false,false)
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
  'Original LensaDiri ' || item_bank.module_key || ' item ' || item_bank.item_code,
  item_bank.polarity,
  1,
  item_bank.quick_enabled,
  case
    when item_bank.quick_enabled then array['quick','standard','deep']::text[]
    when item_bank.standard_enabled then array['standard','deep']::text[]
    else array['deep']::text[]
  end,
  case when item_bank.quick_enabled then 0.9 when item_bank.standard_enabled then 0.75 else 0.6 end,
  not item_bank.quick_enabled,
  null,
  case when item_bank.module_key = 'enneagram' then 1 else 0 end,
  'approved',
  item_bank.item_order,
  'active'
from item_bank
inner join public.modules on modules.key = item_bank.module_key
inner join public.module_versions
  on module_versions.module_id = modules.id and module_versions.version = '1.0.0'
inner join public.question_dimensions
  on question_dimensions.module_version_id = module_versions.id
  and question_dimensions.construct_key = item_bank.construct_key
  and question_dimensions.facet_key = 'general'
where not exists (
  select 1 from public.questions
  where questions.module_version_id = module_versions.id
    and questions.item_code = item_bank.item_code
);

insert into public.question_translations (
  question_id, locale, public_text, review_status
)
select questions.id, 'id', questions.public_text, 'approved'
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0'
  and modules.key in ('type_16', 'enneagram', 'temperament')
  and not exists (
    select 1 from public.question_translations
    where question_translations.question_id = questions.id
      and question_translations.locale = 'id'
  );

insert into public.question_dimension_mappings (
  question_id, dimension_id, scoring_role, polarity, weight, consistency_pair_key
)
select questions.id, questions.dimension_id, 'primary', questions.polarity, questions.weight, null
from public.questions
inner join public.module_versions on module_versions.id = questions.module_version_id
inner join public.modules on modules.id = module_versions.module_id
where module_versions.version = '1.0.0'
  and modules.key in ('type_16', 'enneagram', 'temperament')
  and not exists (
    select 1 from public.question_dimension_mappings
    where question_dimension_mappings.question_id = questions.id
      and question_dimension_mappings.dimension_id = questions.dimension_id
  );

update public.module_versions
set status = 'published', published_at = now()
where version = '1.0.0'
  and status = 'draft'
  and module_id in (
    select id from public.modules where key in ('type_16', 'enneagram', 'temperament')
  );
