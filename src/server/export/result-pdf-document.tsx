import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { PdfScoreRow, ResultPdfModel } from "@/server/export/result-pdf-model";

/**
 * Print-first report on the same warm paper as the app. A matte-black page is
 * both inconsistent with the collectible theme and wasteful to print, so the
 * palette inverts: paper stays light and ink carries the contrast.
 */
const colors = {
  accent: "#9D4223",
  hairline: "#E4E2DE",
  ink: "#1B1C1A",
  muted: "#56423C",
  paper: "#FBF9F5",
  soft: "#FFFFFF",
  softRaised: "#F5F3EF",
  track: "#EFEEEA",
} as const;

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.soft,
    borderColor: colors.hairline,
    borderRadius: 5,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 8,
    letterSpacing: 0.6,
    marginBottom: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  barFill: {
    backgroundColor: colors.accent,
    borderRadius: 2,
    height: 7,
  },
  barTrack: {
    backgroundColor: colors.track,
    borderRadius: 2,
    height: 7,
    marginTop: 4,
    width: "100%",
  },
  body: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 10,
    fontWeight: 400,
    lineHeight: 1.55,
  },
  bullet: {
    color: colors.muted,
    flexDirection: "row",
    fontSize: 9.5,
    lineHeight: 1.5,
    marginBottom: 3,
  },
  bulletMark: {
    color: colors.accent,
    marginRight: 6,
    width: 8,
  },
  card: {
    backgroundColor: colors.soft,
    borderColor: colors.hairline,
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: 8,
    padding: 10,
  },
  coverRule: {
    backgroundColor: colors.accent,
    height: 1,
    marginBottom: 16,
    marginTop: 8,
    width: 64,
  },
  disclaimer: {
    backgroundColor: colors.soft,
    borderColor: colors.hairline,
    borderRadius: 6,
    borderWidth: 1,
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 14,
    marginTop: 10,
    padding: 10,
  },
  footer: {
    borderTopColor: colors.hairline,
    borderTopWidth: 1,
    bottom: 28,
    color: "#858585",
    flexDirection: "row",
    fontSize: 8,
    justifyContent: "space-between",
    left: 40,
    position: "absolute",
    right: 40,
  },
  h1: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 25,
    fontWeight: 400,
    letterSpacing: -0.4,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  h2: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: -0.2,
    marginBottom: 8,
    marginTop: 14,
  },
  h3: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 11,
    fontWeight: 400,
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontFamily: "Poly",
    fontSize: 8.5,
    letterSpacing: 0.4,
    marginBottom: 3,
    textTransform: "uppercase",
  },
  muted: {
    color: colors.muted,
    fontSize: 9.5,
    lineHeight: 1.5,
  },
  page: {
    backgroundColor: colors.paper,
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 10,
    paddingBottom: 56,
    paddingHorizontal: 42,
    paddingTop: 42,
  },
  rowBetween: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scoreBlock: {
    marginBottom: 8,
  },
  scoreLabel: {
    color: colors.ink,
    flexGrow: 1,
    fontSize: 9.5,
    paddingRight: 8,
  },
  scoreValue: {
    color: colors.ink,
    fontSize: 9,
    // Poly has no Medium cut, so emphasis is spacing, not weight.
    letterSpacing: 0.3,
  },
  identityChip: {
    backgroundColor: colors.softRaised,
    borderColor: colors.hairline,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 5,
    marginRight: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  identityName: {
    color: colors.muted,
    fontSize: 7.5,
    marginBottom: 2,
  },
  identityTitle: {
    color: colors.ink,
    fontSize: 9,
    letterSpacing: 0.3,
  },
  identityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    marginTop: 14,
  },
  sectionRule: {
    backgroundColor: colors.hairline,
    height: 1,
    marginBottom: 6,
    marginTop: 4,
    width: "100%",
  },
  wordmark: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 18,
    textTransform: "uppercase",
  },

  /* --- Cover page -------------------------------------------------------
     The cover is the only surface that takes the type's colour. Body pages
     stay warm paper so the report is still cheap and legible to print. */
  coverPage: {
    color: colors.ink,
    fontFamily: "Poly",
    fontSize: 10,
    paddingBottom: 42,
    paddingHorizontal: 42,
    paddingTop: 42,
  },
  coverTop: {
    flexGrow: 1,
  },
  coverWordmark: {
    fontFamily: "Poly",
    fontSize: 12,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  coverBadge: {
    alignSelf: "flex-start",
    borderRadius: 5,
    borderWidth: 1,
    fontSize: 8,
    letterSpacing: 0.6,
    marginTop: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontFamily: "Poly",
    fontSize: 34,
    letterSpacing: -0.6,
    lineHeight: 1.12,
    marginTop: 14,
  },
  coverSub: {
    fontSize: 11,
    lineHeight: 1.5,
    marginTop: 10,
    maxWidth: "78%",
  },
  coverTypeCode: {
    fontFamily: "Poly",
    fontSize: 64,
    letterSpacing: 2,
    lineHeight: 1,
    marginTop: 24,
    opacity: 0.28,
  },
  coverFigure: {
    alignSelf: "center",
    height: 300,
    objectFit: "contain",
  },
  coverFooter: {
    fontSize: 9,
    lineHeight: 1.5,
    marginTop: 12,
  },

  /* --- Reader aids ----------------------------------------------------- */
  readerBox: {
    backgroundColor: colors.soft,
    borderColor: colors.hairline,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
    marginTop: 4,
    padding: 12,
  },
  readerStep: {
    flexDirection: "row",
    marginBottom: 6,
  },
  readerNumber: {
    color: colors.accent,
    fontSize: 9.5,
    marginRight: 8,
    width: 12,
  },
  glossaryRow: {
    borderTopColor: colors.hairline,
    borderTopWidth: 1,
    paddingBottom: 5,
    paddingTop: 5,
  },
  glossaryTerm: {
    color: colors.ink,
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  glossaryMeaning: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 1.45,
    marginTop: 2,
  },
});

function ScoreBars({ scores }: { scores: readonly PdfScoreRow[] }) {
  return (
    <View>
      {scores.map((row) => {
        const width = Math.max(0, Math.min(100, row.score));
        return (
          <View key={`${row.label}-${row.score}`} style={styles.scoreBlock} wrap={false}>
            <View style={styles.rowBetween}>
              <Text style={styles.scoreLabel}>{row.label}</Text>
              <Text style={styles.scoreValue}>
                {row.reading} · {row.score} dari 100
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${width}%` }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  if (items.length === 0) return null;
  return (
    <View>
      {items.map((item) => (
        <View key={item} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletMark}>·</Text>
          <Text style={{ color: colors.muted, flex: 1 }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PageFooter({ model }: { model: ResultPdfModel }) {
  return (
    <View fixed style={styles.footer}>
      <Text>LensaDiri · privat · bukan diagnosis</Text>
      <Text
        render={({ pageNumber, totalPages }) =>
          `${pageNumber} / ${totalPages} · diekspor ${model.exportedAtLabel}`
        }
      />
    </View>
  );
}

/**
 * Full-bleed cover in the colour of the reflected type.
 *
 * All text here uses the stage's dark `ink`. White on these light fills measures
 * 2.2-2.5:1, which is why it is never used — the same rule the web stages follow.
 */
function CoverPage({ model }: { model: ResultPdfModel }) {
  const { cover } = model;
  return (
    <Page size="A4" style={[styles.coverPage, { backgroundColor: cover.accent }]}>
      <View style={styles.coverTop}>
        <Text style={[styles.coverWordmark, { color: cover.ink }]}>LensaDiri</Text>
        <Text style={[styles.coverBadge, { borderColor: cover.ink, color: cover.ink }]}>
          Laporan pribadi · hanya untuk pemilik
        </Text>
        <Text style={[styles.coverTitle, { color: cover.ink }]}>{model.title}</Text>
        <Text style={[styles.coverSub, { color: cover.ink }]}>
          {model.selectionLabel} · selesai {model.createdAtLabel}
        </Text>
        {cover.typeCode ? (
          <Text style={[styles.coverTypeCode, { color: cover.ink }]}>{cover.typeCode}</Text>
        ) : null}
      </View>

      {/* Height-constrained so the render never crops; the source PNGs are all
          taller than they are wide.

          eslint-disable-next-line jsx-a11y/alt-text -- This is
          `@react-pdf/renderer`'s Image, not an HTML img. It accepts no `alt`
          prop; PDF alternate text is not expressible here. */}
      {/* eslint-disable-next-line jsx-a11y/alt-text */}
      {cover.figurinePath ? <Image src={cover.figurinePath} style={styles.coverFigure} /> : null}

      <Text style={[styles.coverFooter, { color: cover.ink }]}>
        {model.disclaimer ||
          "Hasil ini adalah lensa reflektif untuk eksplorasi diri. Bukan diagnosis klinis, bukan kepastian mutlak, dan bukan instrumen psikometri tervalidasi."}
      </Text>
    </Page>
  );
}

/** Masthead repeated at the top of the body pages. */
function BodyMasthead({ model }: { model: ResultPdfModel }) {
  return (
    <View>
      <Text style={styles.wordmark}>LensaDiri</Text>
      <Text style={styles.meta}>{model.subtitle}</Text>
      <Text style={styles.h1}>{model.title}</Text>
      <View style={[styles.coverRule, { backgroundColor: model.cover.accent }]} />
      {model.identities.length > 0 ? (
        <View style={styles.identityWrap}>
          {model.identities.map((identity) => (
            <View key={identity.name} style={styles.identityChip} wrap={false}>
              <Text style={styles.identityName}>{identity.name}</Text>
              <Text style={styles.identityTitle}>{identity.title}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Orientation block. The report leads with how to read it, because the sections
 * below use words like "kecenderungan" and "tingkat keyakinan" that mean
 * something specific here and are easy to over-read.
 */
function HowToRead() {
  const steps = [
    "Baca angka sebagai kecenderungan jawabanmu hari ini, bukan nilai bagus atau buruk. Angka 0-100 menunjukkan posisi di antara dua kutub, bukan persentase kebenaran.",
    "Mulai dari bagian keseharian. Bagian itu paling dekat dengan hal yang bisa kamu coba, sementara nama tipe dan kode hanya ringkasan singkat.",
    "Perhatikan tingkat keyakinan. Angka itu menilai kelengkapan dan konsistensi jawabanmu, bukan seberapa akurat hasil menggambarkan dirimu.",
    "Jika ada dua bagian yang terasa bertentangan, baca keduanya sebagai konteks yang berbeda, bukan sebagai satu yang benar dan satu yang salah.",
  ];
  return (
    <View wrap={false}>
      <Text style={styles.h2}>Cara membaca laporan ini</Text>
      <View style={styles.sectionRule} />
      <View style={styles.readerBox}>
        {steps.map((step, index) => (
          <View key={step} style={styles.readerStep}>
            <Text style={styles.readerNumber}>{index + 1}.</Text>
            <Text style={{ color: colors.muted, flex: 1, fontSize: 9.5, lineHeight: 1.5 }}>
              {step}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * Plain-language glossary for the terms the report cannot avoid. Evidence tier
 * and limitation wording has to stay visible, so it is explained rather than
 * dropped.
 */
function Glossary() {
  const entries: readonly { meaning: string; term: string }[] = [
    {
      meaning:
        "Satu sudut pandang untuk melihat diri, misalnya cara berkomunikasi atau sumber motivasi. Satu lensa tidak menggambarkan keseluruhan dirimu.",
      term: "Lensa",
    },
    {
      meaning:
        "Posisi jawabanmu di antara dua kutub, ditulis 0 sampai 100. Angka tengah berarti kamu menjawab campuran, bukan berarti hasilnya lemah.",
      term: "Kecenderungan",
    },
    {
      meaning:
        "Seberapa lengkap dan konsisten jawaban yang kamu berikan. Ini soal kualitas data, bukan soal seberapa benar hasil menggambarkan dirimu.",
      term: "Tingkat keyakinan",
    },
    {
      meaning:
        "Seberapa kuat dasar rujukan sebuah lensa. Lensa bertanda eksperimental belum diuji cukup jauh, jadi bacalah sebagai bahan renungan awal saja.",
      term: "Tingkat bukti",
    },
    {
      meaning:
        "Catatan tentang apa yang tidak bisa disimpulkan dari hasil ini. Bagian ini sengaja dipertahankan agar hasil tidak dibaca melebihi kemampuannya.",
      term: "Batasan",
    },
    {
      meaning:
        "Bagian yang membandingkan dua lensa untuk melihat apakah keduanya saling menguatkan atau memberi konteks berbeda.",
      term: "Hubungan antar-lensa",
    },
  ];
  return (
    <View break>
      <Text style={styles.h2}>Arti istilah</Text>
      <View style={styles.sectionRule} />
      {entries.map((entry) => (
        <View key={entry.term} style={styles.glossaryRow} wrap={false}>
          <Text style={styles.glossaryTerm}>{entry.term}</Text>
          <Text style={styles.glossaryMeaning}>{entry.meaning}</Text>
        </View>
      ))}
    </View>
  );
}

function LegacyBody({ model }: { model: ResultPdfModel }) {
  const legacy = model.legacy;
  if (!legacy) return null;
  return (
    <View>
      <Text style={styles.h2}>Lima sisi yang diukur</Text>
      <View style={styles.sectionRule} />
      <Text style={[styles.muted, { marginBottom: 8 }]}>{legacy.qualityNote}</Text>
      <ScoreBars scores={legacy.scores} />

      <Text style={styles.h2}>Yang terlihat menonjol</Text>
      <View style={styles.sectionRule} />
      <BulletList items={legacy.strengths} />

      <Text style={styles.h2}>Yang bisa dikembangkan</Text>
      <View style={styles.sectionRule} />
      <BulletList items={legacy.growthFocus} />

      <Text style={styles.h2}>Sudut pandang tambahan</Text>
      <View style={styles.sectionRule} />
      {legacy.overlays.map((overlay) => (
        <View key={overlay.title} style={styles.card} wrap={false}>
          <Text style={styles.meta}>{overlay.title}</Text>
          <Text style={styles.h3}>{overlay.label}</Text>
          <Text style={styles.muted}>{overlay.note}</Text>
        </View>
      ))}
    </View>
  );
}

function ModularBody({ model }: { model: ResultPdfModel }) {
  const modular = model.modular;
  if (!modular) return null;

  return (
    <View>
      {modular.overallConfidenceLabel ? (
        <Text style={[styles.muted, { marginBottom: 4 }]}>
          Tingkat keyakinan hasil: {modular.overallConfidenceLabel}. Angka ini menggambarkan
          kelengkapan dan konsistensi jawaban, bukan akurasi identitas.
        </Text>
      ) : (
        <Text style={[styles.muted, { marginBottom: 4 }]}>
          Tingkat keyakinan tidak dihitung untuk kombinasi lensa eksperimental.
        </Text>
      )}

      <Text style={styles.h2}>Mulai dari keseharian</Text>
      <View style={styles.sectionRule} />
      {(
        [
          ["Komunikasi", modular.integrated.communication],
          ["Belajar", modular.integrated.learning],
          ["Kerja", modular.integrated.work],
          ["Relasi", modular.integrated.relationships],
          ["Saat stres", modular.integrated.stress],
        ] as const
      ).map(([label, text]) => (
        <View key={label} style={styles.card} wrap={false}>
          <Text style={styles.h3}>{label}</Text>
          <Text style={styles.muted}>{text}</Text>
        </View>
      ))}

      <Text style={styles.h2}>Yang bisa dicoba minggu ini</Text>
      <View style={styles.sectionRule} />
      <BulletList items={modular.integrated.growth7Days} />

      <Text style={styles.h2}>Yang bisa dibangun sebulan ke depan</Text>
      <View style={styles.sectionRule} />
      <BulletList items={modular.integrated.growth30Days} />

      {modular.correlations.length > 0 ? (
        <View>
          <Text style={styles.h2}>Bagaimana lensa saling berhubungan</Text>
          <View style={styles.sectionRule} />
          {modular.correlations.map((item) => (
            <View key={`${item.sources}-${item.kindLabel}`} style={styles.card} wrap={false}>
              <Text style={styles.meta}>
                {item.kindLabel} · {item.sources}
              </Text>
              <Text style={styles.muted}>{item.narrative}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {modular.modules.map((module) => (
        <View key={module.name} break={modular.modules.length > 1}>
          <Text style={styles.h2}>{module.name}</Text>
          <View style={styles.sectionRule} />
          <Text style={styles.h3}>{module.title}</Text>
          <Text style={[styles.meta, { marginTop: 4 }]}>
            {module.evidenceTierLabel}
            {module.confidenceLabel ? ` · ${module.confidenceLabel}` : " · tanpa tingkat keyakinan"}
          </Text>
          <Text style={[styles.muted, { marginTop: 6, marginBottom: 8 }]}>
            {module.practicalReflection}
          </Text>

          <Text style={[styles.h3, { marginTop: 4 }]}>Posisi jawabanmu</Text>
          <ScoreBars scores={module.scores} />

          <Text style={[styles.h3, { marginTop: 8 }]}>Yang terlihat dari jawabanmu</Text>
          <BulletList items={module.strengths} />

          <Text style={[styles.h3, { marginTop: 8 }]}>Yang perlu diperhatikan</Text>
          <BulletList items={module.blindSpots} />

          <View style={[styles.disclaimer, { marginTop: 10 }]}>
            <Text>{module.disclaimer}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function ClosingNote() {
  return (
    <View style={{ marginTop: 16 }} wrap={false}>
      <Text style={styles.h2}>Privasi dan batasan hasil</Text>
      <View style={styles.sectionRule} />
      <Text style={styles.muted}>
        Laporan ini hanya untuk pemilik hasil. Jangan bagikan file PDF jika berisi informasi yang
        ingin kamu jaga privat. Skor dihitung di server LensaDiri; file ini tidak menyertakan
        jawaban mentah, token akses, atau data akun. Gunakan sebagai bahan refleksi, bukan label
        tetap tentang dirimu.
      </Text>
    </View>
  );
}

export function ResultPdfDocument({ model }: { model: ResultPdfModel }) {
  return (
    <Document
      author="LensaDiri"
      creator="LensaDiri"
      keywords="refleksi, kepribadian, privat, lensadiri"
      language="id-ID"
      subject="Laporan refleksi pribadi LensaDiri"
      title={`LensaDiri — ${model.title}`}
    >
      {/* The coloured cover is its own page so the body pages stay warm paper. */}
      <CoverPage model={model} />
      <Page size="A4" style={styles.page} wrap>
        <BodyMasthead model={model} />
        <HowToRead />
        {model.kind === "legacy" ? <LegacyBody model={model} /> : <ModularBody model={model} />}
        <Glossary />
        <ClosingNote />
        <PageFooter model={model} />
      </Page>
    </Document>
  );
}
