import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { PdfScoreRow, ResultPdfModel } from "@/server/export/result-pdf-model";

/** Digital-first monochrome report: matte black, bone type, frost hairlines. */
const colors = {
  accent: "#F5F5F2",
  hairline: "#303030",
  ink: "#F5F5F2",
  muted: "#B8BAB9",
  paper: "#000000",
  soft: "#111111",
  softRaised: "#181818",
  track: "#292929",
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
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSans",
    fontSize: 25,
    fontWeight: 400,
    letterSpacing: -0.4,
    lineHeight: 1.2,
    marginBottom: 6,
  },
  h2: {
    color: colors.ink,
    fontFamily: "PlusJakartaSans",
    fontSize: 14,
    fontWeight: 400,
    letterSpacing: -0.2,
    marginBottom: 8,
    marginTop: 14,
  },
  h3: {
    color: colors.ink,
    fontFamily: "PlusJakartaSans",
    fontSize: 11,
    fontWeight: 400,
    marginBottom: 4,
  },
  meta: {
    color: colors.muted,
    fontFamily: "PlusJakartaSans",
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
    fontFamily: "PlusJakartaSans",
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
    fontWeight: 500,
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
    fontWeight: 500,
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
    fontFamily: "PlusJakartaSans",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 1.2,
    marginBottom: 18,
    textTransform: "uppercase",
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

function Cover({ model }: { model: ResultPdfModel }) {
  return (
    <View>
      <Text style={styles.wordmark}>LensaDiri</Text>
      <Text style={styles.badge}>Laporan pribadi · hanya untuk pemilik</Text>
      <Text style={styles.meta}>{model.subtitle}</Text>
      <Text style={styles.h1}>{model.title}</Text>
      <View style={styles.coverRule} />
      <Text style={styles.muted}>{model.selectionLabel}</Text>
      <Text style={[styles.muted, { marginTop: 4 }]}>Selesai {model.createdAtLabel}</Text>
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
      <View style={styles.disclaimer}>
        <Text>
          {model.disclaimer ||
            "Hasil ini adalah lensa reflektif untuk eksplorasi diri. Bukan diagnosis klinis, bukan kepastian mutlak, dan bukan instrumen psikometri tervalidasi."}
        </Text>
      </View>
    </View>
  );
}

function LegacyBody({ model }: { model: ResultPdfModel }) {
  const legacy = model.legacy;
  if (!legacy) return null;
  return (
    <View>
      <Text style={styles.h2}>Lima spektrum</Text>
      <View style={styles.sectionRule} />
      <Text style={[styles.muted, { marginBottom: 8 }]}>{legacy.qualityNote}</Text>
      <ScoreBars scores={legacy.scores} />

      <Text style={styles.h2}>Kekuatan yang menonjol</Text>
      <View style={styles.sectionRule} />
      <BulletList items={legacy.strengths} />

      <Text style={styles.h2}>Fokus tumbuh</Text>
      <View style={styles.sectionRule} />
      <BulletList items={legacy.growthFocus} />

      <Text style={styles.h2}>Lensa reflektif tambahan</Text>
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

      <Text style={styles.h2}>Langkah 7 hari</Text>
      <View style={styles.sectionRule} />
      <BulletList items={modular.integrated.growth7Days} />

      <Text style={styles.h2}>Langkah 30 hari</Text>
      <View style={styles.sectionRule} />
      <BulletList items={modular.integrated.growth30Days} />

      {modular.correlations.length > 0 ? (
        <View>
          <Text style={styles.h2}>Korelasi antar-lensa</Text>
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

          <Text style={[styles.h3, { marginTop: 4 }]}>Kecenderungan jawaban</Text>
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
      <Text style={styles.h2}>Privasi & batasan</Text>
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
      <Page size="A4" style={styles.page} wrap>
        <Cover model={model} />
        {model.kind === "legacy" ? <LegacyBody model={model} /> : <ModularBody model={model} />}
        <ClosingNote />
        <PageFooter model={model} />
      </Page>
    </Document>
  );
}
