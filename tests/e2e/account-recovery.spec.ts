import { expect, test, type Page } from "@playwright/test";

async function fetchRecoveryToken(
  page: Page,
  email: string,
  purpose: "email_verification" | "password_reset",
): Promise<string> {
  const response = await page.request.get(
    `/api/test/recovery-token?email=${encodeURIComponent(email)}&purpose=${purpose}`,
  );
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as { data: { token: string } };
  return body.data.token;
}

async function openRecoveryLink(page: Page, path: string, token: string) {
  await page.goto("about:blank");
  await page.goto(`${path}#token=${encodeURIComponent(token)}`);
}

test("email verification and password reset stay single-use and revoke sessions", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${testInfo.workerIndex}`
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/gu, "-");
  const email = `recovery-${suffix}@example.test`;
  const oldPassword = "recovery old password 123";
  const newPassword = "recovery new password 456";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(oldPassword);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("heading", { name: "Pendaftaran diterima" })).toBeVisible();

  await page.goto("/verify-email");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kirim instruksi verifikasi" }).click();
  await expect(page.getByRole("status").first()).toContainText("instruksi sudah disiapkan");
  const verificationToken = await fetchRecoveryToken(page, email, "email_verification");
  await openRecoveryLink(page, "/verify-email", verificationToken);
  await page.getByRole("button", { name: "Verifikasi email" }).click();
  await expect(page.getByRole("status").first()).toContainText("Email berhasil diverifikasi");
  await openRecoveryLink(page, "/verify-email", verificationToken);
  await page.getByRole("button", { name: "Verifikasi email" }).click();
  await expect(page.getByText(/Link tidak valid, kedaluwarsa/u)).toContainText("sudah digunakan");

  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(oldPassword);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Kirim instruksi reset" }).click();
  await expect(page.getByRole("status").first()).toContainText("instruksi reset sudah disiapkan");
  const resetToken = await fetchRecoveryToken(page, email, "password_reset");
  await openRecoveryLink(page, "/reset-password", resetToken);
  await page.getByLabel("Password baru").fill(newPassword);
  await page.getByRole("button", { name: "Simpan password baru" }).click();
  await expect(page.getByRole("status").first()).toContainText("Semua session lama sudah dicabut");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/u);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(oldPassword);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Email atau password tidak cocok.")).toBeVisible();
  await page.getByLabel("Password").fill(newPassword);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);

  const unknownEmail = `unknown-${suffix}@example.test`;
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(unknownEmail);
  await page.getByRole("button", { name: "Kirim instruksi reset" }).click();
  await expect(page.getByRole("status").first()).toContainText("instruksi reset sudah disiapkan");
  const unknownDelivery = await page.request.get(
    `/api/test/recovery-token?email=${encodeURIComponent(unknownEmail)}&purpose=password_reset`,
  );
  expect(unknownDelivery.status()).toBe(404);
});
