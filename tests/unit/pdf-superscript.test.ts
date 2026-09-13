import { describe, expect, it } from "vitest";

import { splitSuperscriptRuns, superscriptCharacters } from "@/server/export/pdf-superscript";

/**
 * Regression cover for a real character swap, not a spacing nicety.
 *
 * The bundled Poly face maps `¹ ² ³` but has no glyph for `⁴` (U+2074), so the
 * stored `V¹L²F³E⁴` printed as `V¹L²F³Et` once the export began showing the code
 * at all. The browser hid this by falling back to another family; a server-side
 * PDF has one face and cannot.
 */
describe("pdf superscript runs", () => {
  it("splits a rank code into text and superscript runs", () => {
    expect(splitSuperscriptRuns("V¹L²F³E⁴")).toEqual([
      { superscript: false, text: "V" },
      { superscript: true, text: "1" },
      { superscript: false, text: "L" },
      { superscript: true, text: "2" },
      { superscript: false, text: "F" },
      { superscript: true, text: "3" },
      { superscript: false, text: "E" },
      { superscript: true, text: "4" },
    ]);
  });

  it("converts every superscript it knows to a plain digit", () => {
    // All four ranks must come from the same source. Taking three from the font
    // and one from a substitute is what produced the mismatch in the first place.
    for (const character of superscriptCharacters) {
      const runs = splitSuperscriptRuns(character);
      expect(runs).toHaveLength(1);
      expect(runs[0]?.superscript).toBe(true);
      expect(runs[0]?.text).toMatch(/^[1-9]$/u);
    }
  });

  it("leaves codes without ranks as a single plain run", () => {
    // The other five segments carry no superscripts and must pass through whole.
    for (const code of ["ENFJ", "sp125", "EII", "SLOAI", "NF"]) {
      expect(splitSuperscriptRuns(code)).toEqual([{ superscript: false, text: code }]);
    }
  });

  it("groups consecutive characters instead of emitting one run per letter", () => {
    expect(splitSuperscriptRuns("AB¹²CD")).toEqual([
      { superscript: false, text: "AB" },
      { superscript: true, text: "12" },
      { superscript: false, text: "CD" },
    ]);
    expect(splitSuperscriptRuns("")).toEqual([]);
  });
});
