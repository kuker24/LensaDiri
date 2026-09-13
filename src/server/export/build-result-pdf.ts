import "server-only";

import path from "node:path";

import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { PrivateResultView } from "@/server/repositories/assessment";
import { ResultPdfDocument } from "@/server/export/result-pdf-document";
import { buildResultPdfModel } from "@/server/export/result-pdf-model";

let fontsRegistered = false;

/**
 * Registers the single Poly face used across the whole document.
 *
 * Poly has no Medium or Bold cut, so only weight 400 is registered. Requesting
 * 500 here would make `@react-pdf` fall back to a built-in Helvetica for those
 * runs and break the document's typographic consistency; the stylesheet
 * therefore carries no `fontWeight` above 400 either. See `fonts/README.md`.
 */
function registerPdfFonts(): void {
  if (fontsRegistered) return;
  const fontsDir = path.join(process.cwd(), "src/server/export/fonts");
  Font.register({
    family: "Poly",
    fonts: [
      {
        fontWeight: 400,
        fontStyle: "normal",
        src: path.join(fontsDir, "Poly-Regular.ttf"),
      },
      {
        fontWeight: 400,
        fontStyle: "italic",
        src: path.join(fontsDir, "Poly-Italic.ttf"),
      },
    ],
  });
  // Avoid odd hyphenation splits in Indonesian copy.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export function pdfFilenameForResult(result: PrivateResultView, now = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  const kind = result.kind === "legacy" ? "legacy" : `modular-${result.modules.length}lensa`;
  return `lensadiri-laporan-${kind}-${stamp}.pdf`;
}

export async function buildResultPdfBuffer(
  result: PrivateResultView,
  exportedAt = new Date(),
): Promise<Buffer> {
  registerPdfFonts();
  const model = buildResultPdfModel(result, exportedAt);
  const document = createElement(ResultPdfDocument, {
    model,
  }) as ReactElement<DocumentProps>;
  const buffer = await renderToBuffer(document);
  return Buffer.from(buffer);
}
