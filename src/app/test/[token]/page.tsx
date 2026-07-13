import type { Metadata } from "next";
import { TestRunner } from "@/components/test-runner";
export const metadata: Metadata = { title: "Assessment", robots: { follow: false, index: false } };
export default async function TestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <TestRunner token={token} />;
}
