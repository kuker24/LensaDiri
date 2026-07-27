import { NextResponse } from "next/server";
import { getServerEnvironment } from "@/lib/db/env";
import { hashOpaqueToken } from "@/lib/security/tokens";
import { opaqueTokenSchema } from "@/lib/validation/assessment";
import { apiFailure, getDatabaseFailureStatus, noStoreHeaders } from "@/server/http";
import { buildResultPdfBuffer, pdfFilenameForResult } from "@/server/export/build-result-pdf";
import { getResultByHash } from "@/server/repositories/assessment";
import { toExportResultView } from "@/server/repositories/result-views";
import { assessmentRateLimitPolicies, consumeRateLimit } from "@/server/services/rate-limiter";

export const runtime = "nodejs";

function resolveExportFormat(request: Request): "pdf" | "json" {
  const url = new URL(request.url);
  const format = url.searchParams.get("format")?.toLowerCase();
  if (format === "json") return "json";
  if (format === "pdf" || format === null || format === "") return "pdf";
  return "pdf";
}

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
): Promise<NextResponse> {
  const { token } = await context.params;
  if (!opaqueTokenSchema.safeParse(token).success)
    return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
  const environment = getServerEnvironment();
  const resultHash = hashOpaqueToken(token, environment.tokenHashPepper);
  const format = resolveExportFormat(request);
  try {
    const limited = await consumeRateLimit(
      resultHash,
      assessmentRateLimitPolicies.resultExport,
      environment.rateLimitSecret,
    );
    if (!limited.allowed)
      return NextResponse.json(apiFailure("rate_limited"), {
        headers: noStoreHeaders,
        status: 429,
      });
    const result = await getResultByHash(resultHash);
    if (!result) {
      return NextResponse.json(apiFailure("not_found"), { headers: noStoreHeaders, status: 404 });
    }

    if (format === "json") {
      return NextResponse.json(
        { exportedAt: new Date().toISOString(), result: toExportResultView(result) },
        {
          headers: {
            ...noStoreHeaders,
            "Content-Disposition": "attachment; filename=lensadiri-result.json",
          },
        },
      );
    }

    const pdf = await buildResultPdfBuffer(result);
    const filename = pdfFilenameForResult(result);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        ...noStoreHeaders,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/pdf",
      },
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(apiFailure("service_unavailable"), {
      headers: noStoreHeaders,
      status: getDatabaseFailureStatus(error),
    });
  }
}
