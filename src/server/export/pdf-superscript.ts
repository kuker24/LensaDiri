/**
 * Splits a code into runs so superscript ranks can be drawn without relying on
 * the font having superscript glyphs.
 *
 * The Psychosophy code arrives as `V¹L²F³E⁴`. The bundled Poly face carries the
 * Latin-1 superscripts `¹ ² ³` but has no glyph for `⁴` (U+2074): it maps to
 * `.notdef`, so `@react-pdf` printed `V¹L²F³Et` — a real character swap, not a
 * spacing quirk. The face also exposes no `sups` OpenType feature and holds no
 * unmapped `foursuperior` glyph, so there is nothing to reach for inside it.
 *
 * The browser never showed this because it silently falls back to another family
 * for the missing glyph. A server-side PDF has exactly one face and cannot.
 *
 * Rather than special-casing the fourth rank, every rank is emitted as a plain
 * ASCII digit that the caller raises and shrinks itself. That keeps all four
 * ranks identical in size and offset, and it leaves the stored `positionCode`
 * untouched — results are immutable, and the web surface renders the original
 * characters correctly.
 */
const superscriptDigits: Readonly<Record<string, string>> = {
  "\u00B9": "1",
  "\u00B2": "2",
  "\u00B3": "3",
  "\u2074": "4",
};

export type CodeRun = Readonly<{
  /** True when this run is a rank that must be raised and shrunk. */
  superscript: boolean;
  text: string;
}>;

/**
 * Groups consecutive characters into runs, separating superscript ranks from
 * ordinary text. Returns an empty array for an empty string.
 */
export function splitSuperscriptRuns(value: string): readonly CodeRun[] {
  const runs: CodeRun[] = [];
  for (const character of value) {
    const digit = superscriptDigits[character];
    const superscript = digit !== undefined;
    const text = digit ?? character;
    const previous = runs.at(-1);
    if (previous && previous.superscript === superscript) {
      runs[runs.length - 1] = { superscript, text: previous.text + text };
      continue;
    }
    runs.push({ superscript, text });
  }
  return runs;
}

/** Every superscript character this module knows how to redraw. */
export const superscriptCharacters = Object.freeze(Object.keys(superscriptDigits));
