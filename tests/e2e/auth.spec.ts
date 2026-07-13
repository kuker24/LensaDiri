import { expect, test } from "@playwright/test";

test("protected dashboard redirects guests and auth forms support keyboard focus", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/u);

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Lewati ke konten utama" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /LensaDiri/u })).toBeFocused();

  const health = await page.request.get("/api/health");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toEqual({ status: "ok" });
});

test("account lifecycle registers, logs in, rejects wrong deletion password, then hard deletes", async ({
  page,
}, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${testInfo.workerIndex}`
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/gu, "-");
  const email = `e2e-${suffix}@example.test`;
  const password = "e2e secure password 123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("heading", { name: "Pendaftaran diterima" })).toBeVisible();

  await page.getByRole("link", { name: "Masuk sekarang" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(page.getByRole("heading", { name: "Selamat datang kembali." })).toBeVisible();

  await page.getByRole("link", { name: "Buka pusat privasi" }).click();
  await expect(page.getByRole("heading", { name: "Pusat privasi" })).toBeVisible();
  const deleteButton = page.getByRole("button", { name: "Hapus akun permanen" });
  await expect(deleteButton).toBeDisabled();

  await page.getByLabel("Password saat ini").fill("wrong password value");
  await page.getByLabel(/Ketik HAPUS AKUN/u).fill("HAPUS AKUN");
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await expect(page.getByText("Password tidak cocok. Akun belum dihapus.")).toBeVisible();

  await page.getByLabel("Password saat ini").fill(password);
  await deleteButton.click();
  await expect(page).toHaveURL(/\/?account=deleted$/u);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/u);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Email atau password tidak cocok.")).toBeVisible();
});
