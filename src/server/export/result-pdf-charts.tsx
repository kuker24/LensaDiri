import {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Svg,
  Text,
  View,
} from "@react-pdf/renderer";

import type { PdfScoreRow } from "@/server/export/result-pdf-model";

/**
 * Vector charts for the exported report.
 *
 * These exist to fix an encoding problem, not to decorate. The old report drew
 * every score as a bar filled from the left, so 50 rendered as a half-full bar
 * and read as "half good". But 50 is the neutral midpoint of a bipolar scale -
 * the report's own glossary says an answer in the middle means "campuran, bukan
 * berarti hasilnya lemah". A left-filled bar contradicts that on sight.
 *
 * So the primary chart diverges from a centre axis: neutral sits in the middle
 * and a score reads as displacement toward one pole. "Menonjol" becomes distance
 * from centre rather than a fuller glass.
 *
 * Structure is deliberately hybrid: geometry is drawn with `Svg`, but every
 * label and number is a real `Text` node in a flex column beside it. SVG text in
 * `@react-pdf/renderer` cannot take a font size through its typed props
 * (`SVGPresentationAttributes` carries `fill`, `stroke` and `textAnchor` but no
 * `fontSize`), and text set that way would also miss the registered Poly face.
 * Keeping labels outside the SVG gets correct typography and stays type-safe.
 *
 * One constraint shaped all of it: real data can be perfectly flat. A live
 * report had all nine Enneagram patterns at exactly 75, and confidence at 49.
 * Charts that only look right on varied data would look broken on that, so each
 * one is checked against the flat case.
 */

const chart = {
  axis: "#B8B2A8",
  gridline: "#EBE9E4",
  ink: "#1B1C1A",
  muted: "#7C6C66",
  negative: "#5C7A8A",
  positive: "#9D4223",
  track: "#F1EFEB",
} as const;

/** Bipolar midpoint. Scores are 0-100 with 50 as neutral. */
const NEUTRAL = 50;

/** Row geometry, shared between the label column and the plot so they align. */
const ROW_HEIGHT = 22;
const BAR_HEIGHT = 9;

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Rounded-rectangle path.
 *
 * `Rect`'s `rx` is unreliable once the radius exceeds half the height, and a
 * diverging bar can be only a couple of points wide, so the path is built
 * explicitly with the radius capped.
 */
function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  const width = Math.max(0, w);
  const radius = Math.max(0, Math.min(r, Math.min(width, h) / 2));
  if (radius === 0) return `M ${x} ${y} h ${width} v ${h} h ${-width} Z`;
  return [
    `M ${x + radius} ${y}`,
    `h ${width - radius * 2}`,
    `a ${radius} ${radius} 0 0 1 ${radius} ${radius}`,
    `v ${h - radius * 2}`,
    `a ${radius} ${radius} 0 0 1 ${-radius} ${radius}`,
    `h ${-(width - radius * 2)}`,
    `a ${radius} ${radius} 0 0 1 ${-radius} ${-radius}`,
    `v ${-(h - radius * 2)}`,
    `a ${radius} ${radius} 0 0 1 ${radius} ${-radius}`,
    "Z",
  ].join(" ");
}

/** Shared gradient defs. Warm leans toward the construct, cool leans away. */
function BarGradients() {
  return (
    <Defs>
      <LinearGradient id="leanPositive" x1="0" x2="1" y1="0" y2="0">
        <Stop offset="0" stopColor={chart.positive} stopOpacity={0.5} />
        <Stop offset="1" stopColor={chart.positive} stopOpacity={1} />
      </LinearGradient>
      <LinearGradient id="leanNegative" x1="1" x2="0" y1="0" y2="0">
        <Stop offset="0" stopColor={chart.negative} stopOpacity={0.5} />
        <Stop offset="1" stopColor={chart.negative} stopOpacity={1} />
      </LinearGradient>
    </Defs>
  );
}

/**
 * Diverging bar set: one row per construct, all sharing a centre axis.
 *
 * Reading rule: the further from the middle line, the more one-sided the
 * answers. A score of exactly 50 draws a small pip on the axis rather than
 * nothing, so a balanced row still reads as measured rather than missing -
 * which also stops an all-neutral module from rendering as an empty frame.
 */
export function DivergingBars({
  plotWidth = 250,
  scores,
}: {
  readonly plotWidth?: number;
  readonly scores: readonly PdfScoreRow[];
}) {
  if (scores.length === 0) return null;

  const height = scores.length * ROW_HEIGHT;
  const centre = plotWidth / 2;
  const half = plotWidth / 2;

  return (
    <View style={{ marginBottom: 4, marginTop: 6 }}>
      <View style={{ flexDirection: "row" }}>
        {/* Labels: real Text so they use Poly and wrap predictably. */}
        <View style={{ width: 132 }}>
          {scores.map((row) => (
            <View
              key={`label-${row.label}`}
              style={{ height: ROW_HEIGHT, justifyContent: "center", paddingRight: 8 }}
            >
              <Text style={{ color: chart.ink, fontSize: 8.5, lineHeight: 1.2 }}>{row.label}</Text>
            </View>
          ))}
        </View>

        <Svg height={height} viewBox={`0 0 ${plotWidth} ${height}`} width={plotWidth}>
          <BarGradients />

          {/* Quarter guides at 25 and 75 so displacement can be judged. */}
          {[0.5, 1.5].map((step) => (
            <Line
              key={`guide-${step}`}
              stroke={chart.gridline}
              strokeWidth={1}
              x1={half * step}
              x2={half * step}
              y1={2}
              y2={height - 2}
            />
          ))}

          {scores.map((row, index) => {
            const value = clamp(row.score);
            const offset = (value - NEUTRAL) / NEUTRAL;
            const magnitude = Math.abs(offset) * half;
            const barY = index * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
            const leaning = offset >= 0;

            return (
              <G key={`bar-${row.label}-${row.score}`}>
                <Path d={roundedRect(0, barY, plotWidth, BAR_HEIGHT, 4)} fill={chart.track} />
                {magnitude < 1.2 ? (
                  <Circle cx={centre} cy={barY + BAR_HEIGHT / 2} fill={chart.muted} r={2.2} />
                ) : (
                  <Path
                    d={roundedRect(
                      leaning ? centre : centre - magnitude,
                      barY,
                      magnitude,
                      BAR_HEIGHT,
                      4,
                    )}
                    fill={leaning ? "url(#leanPositive)" : "url(#leanNegative)"}
                  />
                )}
              </G>
            );
          })}

          {/* Axis last, so it stays legible across every bar. */}
          <Line stroke={chart.axis} strokeWidth={1} x1={centre} x2={centre} y1={0} y2={height} />
        </Svg>

        <View style={{ flexGrow: 1, paddingLeft: 8 }}>
          {scores.map((row) => (
            <View
              key={`value-${row.label}`}
              style={{ height: ROW_HEIGHT, justifyContent: "center" }}
            >
              <Text style={{ color: chart.muted, fontSize: 7.5 }}>
                {row.reading} · {clamp(row.score)}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Axis legend, so the centre line is not left to be inferred. */}
      <View style={{ flexDirection: "row", marginTop: 3 }}>
        <View style={{ width: 132 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", width: plotWidth }}>
          <Text style={{ color: chart.muted, fontSize: 6.5 }}>kurang menonjol</Text>
          <Text style={{ color: chart.muted, fontSize: 6.5 }}>seimbang</Text>
          <Text style={{ color: chart.muted, fontSize: 6.5 }}>menonjol</Text>
        </View>
      </View>
    </View>
  );
}

/** One lens's confidence, as shown in the overview column chart. */
export type PdfLensConfidence = {
  readonly label: string;
  /** 0-100, or null for an experimental lens that gets no confidence score. */
  readonly confidence: number | null;
  readonly reading: string;
};

/**
 * Confidence across every lens, as columns on a shared baseline.
 *
 * This answers a question the old report made the reader assemble by hand:
 * which lenses are actually well supported by the answers. Confidence was
 * printed as prose, once per lens, pages apart.
 *
 * Two bands are drawn behind the columns, at 40 and 60, matching the thresholds
 * in `confidenceReading` ("Perlu konteks" below 60, "Dukungan kuat" at 80). A
 * column can then be read against the label it will be given, rather than as a
 * bare number.
 *
 * Experimental lenses genuinely have no confidence score. They are drawn as an
 * open, dashed placeholder rather than a zero column, because zero would claim
 * "no confidence" when the truth is "not measured".
 */
export function ConfidenceColumns({
  lenses,
  width = 470,
}: {
  readonly lenses: readonly PdfLensConfidence[];
  readonly width?: number;
}) {
  if (lenses.length === 0) return null;

  const plotHeight = 96;
  const gap = 10;
  const columnWidth = Math.max(
    18,
    Math.min(56, (width - gap * (lenses.length - 1)) / lenses.length),
  );
  const spanWidth = columnWidth * lenses.length + gap * (lenses.length - 1);

  return (
    <View style={{ marginBottom: 6, marginTop: 6 }}>
      <Svg height={plotHeight} viewBox={`0 0 ${spanWidth} ${plotHeight}`} width={spanWidth}>
        <BarGradients />

        {/* Threshold guides at 40 and 60 - the reading-label boundaries. */}
        {[40, 60].map((mark) => {
          const y = plotHeight - (mark / 100) * plotHeight;
          return (
            <Line
              key={`mark-${mark}`}
              stroke={chart.gridline}
              strokeWidth={1}
              x1={0}
              x2={spanWidth}
              y1={y}
              y2={y}
            />
          );
        })}

        {lenses.map((lens, index) => {
          const x = index * (columnWidth + gap);
          if (lens.confidence === null) {
            // Not measured. Dashed outline, deliberately not a zero column.
            return (
              <Path
                key={`col-${lens.label}`}
                d={roundedRect(x, plotHeight - 14, columnWidth, 14, 3)}
                fill="none"
                stroke={chart.axis}
                strokeDasharray="2 2"
                strokeWidth={1}
              />
            );
          }
          const value = clamp(lens.confidence);
          // Floor the drawn height so a very low score is still a visible mark
          // rather than a hairline that looks like a rendering fault.
          const barHeight = Math.max(4, (value / 100) * plotHeight);
          return (
            <Path
              key={`col-${lens.label}`}
              d={roundedRect(x, plotHeight - barHeight, columnWidth, barHeight, 3)}
              fill="url(#leanPositive)"
            />
          );
        })}

        <Line
          stroke={chart.axis}
          strokeWidth={1}
          x1={0}
          x2={spanWidth}
          y1={plotHeight}
          y2={plotHeight}
        />
      </Svg>

      {/* Labels below the baseline, as Text for correct font and wrapping. */}
      <View style={{ flexDirection: "row", marginTop: 4 }}>
        {lenses.map((lens, index) => (
          <View
            key={`caption-${lens.label}`}
            style={{
              marginRight: index === lenses.length - 1 ? 0 : gap,
              width: columnWidth,
            }}
          >
            <Text style={{ color: chart.ink, fontSize: 6.5, lineHeight: 1.25 }}>{lens.label}</Text>
            <Text style={{ color: chart.muted, fontSize: 6.5, marginTop: 1 }}>
              {lens.confidence === null ? "tidak diukur" : lens.confidence}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
