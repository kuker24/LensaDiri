import { notFound, redirect } from "next/navigation";

import { opaqueTokenSchema } from "@/lib/validation/assessment";

export default async function PausePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!opaqueTokenSchema.safeParse(token).success) notFound();

  redirect(`/test/${token}`);
}
