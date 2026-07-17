import type { NextResponse } from "next/server";

import { handleAssessmentPauseMutation } from "@/server/assessment-mutation";

export const runtime = "nodejs";

export function POST(request: Request): Promise<NextResponse> {
  return handleAssessmentPauseMutation(request, false);
}
