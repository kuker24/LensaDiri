import "server-only";

import path from "node:path";

import { Font, renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { createElement, type ReactElement } from "react";

import type { PrivateResultView } from "@/server/repositories/assessment";
import { ResultPdfDocument } from "@/server/export/result-pdf-document";
import { buildResultPdfModel } from "@/server/export/result-pdf-model";

let fontsRegistered = false;

function registerPdfFonts(): void {
  if (fontsRegistered) return;
  const fontsDir = path.join(process.cwd(), "src/server/export/fonts");
  Font.register({
    family: "PlusJakartaSans",
    fonts: [
      {
        fontWeight: 400,
        src: path.join(fontsDir, "PlusJakartaSans-Regular.ttf"),
      },
      {
        fontWeight: 500,
        src: path.join(fontsDir, "PlusJakartaSans-Medium.ttf"),
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
