import { notFound } from "next/navigation";
import { DialogTestFixture } from "./dialog-test-fixture";

export default async function TestDialogPage({
  searchParams,
}: {
  searchParams: Promise<{ initial?: string }>;
}) {
  if (process.env.E2E_TEST_ROUTES !== "1") notFound();
  const { initial } = await searchParams;

  return <DialogTestFixture initiallyOpen={initial === "1"} />;
}
