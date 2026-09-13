import { expect, test } from "@playwright/test";

test("protected dashboard redirects guests and auth forms support keyboard focus", async ({
  page,
}) => {
  for (const path of [
    "/dashboard",
    "/dashboard/privacy",
    "/dashboard/results",
    "/dashboard/sessions",
    "/dashboard/settings",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL((url) => {
      return url.pathname === "/login" && url.searchParams.get("redirectTo") === path;
    });
    await expect(page.getByRole("heading", { name: "Buka ruang pribadimu." })).toBeVisible();
  }

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Lewati ke konten utama" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: /lensadiri/iu })).toBeFocused();

  const health = await page.request.get("/api/health");
  expect(health.status()).toBe(200);
  await expect(health.json()).resolves.toEqual({ status: "ok" });

  await page.goto("/");
  const mobileMenu = page.locator("summary", { hasText: "Menu" });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.getByRole("link", { name: "Ruang pribadi", exact: true }).first().click();
  await expect(page).toHaveURL(
    (url) => url.pathname === "/login" && url.searchParams.get("redirectTo") === "/dashboard",
    { timeout: 15_000 },
  );
});

test("registration offers Google and auth forms omit password-length copy", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByText(/Minimal 12 karakter/u)).toHaveCount(0);

  await page.getByRole("link", { name: "Daftar", exact: true }).first().click();
  await expect(page).toHaveURL(/\/register$/u);
  await expect(page.getByRole("link", { name: "Lanjutkan dengan Google" })).toHaveAttribute(
    "href",
    /\/api\/auth\/oidc\/google\/start\?operation=login/u,
  );
  await expect(page.getByText(/Minimal 12 karakter/u)).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Kata sandi" })).toHaveAttribute(
    "minlength",
    "12",
  );
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
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("heading", { name: "Permintaan pendaftaran diterima" })).toBeVisible({
    timeout: 15_000,
  });

  await page.getByRole("link", { name: "Kembali ke halaman masuk" }).click();
  await page.goto("/dashboard/results");
  await expect(page).toHaveURL((url) => {
    return url.pathname === "/login" && url.searchParams.get("redirectTo") === "/dashboard/results";
  });
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/results$/u, { timeout: 15_000 });
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Sesi, hasil, kontrol data" })).toBeVisible();

  const sessionCookie = (await page.context().cookies()).find(
    (cookie) => cookie.name === "lensadiri_session",
  );
  expect(sessionCookie?.httpOnly).toBe(true);
  expect(sessionCookie?.sameSite).toBe("Lax");
  const remainingCookieSeconds = (sessionCookie?.expires ?? 0) - Date.now() / 1_000;
  expect(remainingCookieSeconds).toBeGreaterThan(29 * 24 * 60 * 60);
  expect(remainingCookieSeconds).toBeLessThanOrEqual(31 * 24 * 60 * 60);

  await page.goto("/");
  await expect(page).toHaveURL(/\/$/u);
  const mobileMenu = page.locator("summary", { hasText: "Menu" });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  const publicAccountLink = page.getByRole("link", { name: "Ruang pribadi", exact: true });
  await expect(publicAccountLink.first()).toBeVisible();
  await publicAccountLink.first().click();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(page.getByRole("heading", { name: "Sesi, hasil, kontrol data" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/\/dashboard$/u);
  await expect(page.getByRole("heading", { name: "Sesi, hasil, kontrol data" })).toBeVisible();

  await page.getByRole("link", { name: "Pusat privasi" }).click();
  await expect(page.getByRole("heading", { name: "Pusat privasi" })).toBeVisible();
  const deleteButton = page.getByRole("button", { name: "Hapus akun permanen" });
  await expect(deleteButton).toBeDisabled();

  await page.getByLabel("Kata sandi saat ini").fill("wrong password value");
  await page.getByLabel(/Ketik HAPUS AKUN/u).fill("HAPUS AKUN");
  await expect(deleteButton).toBeEnabled();
  await deleteButton.click();
  await expect(page.getByText("Kata sandi tidak cocok. Akun belum dihapus.")).toBeVisible();

  await page.getByLabel("Kata sandi saat ini").fill(password);
  const deletionResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/account/delete") && response.request().method() === "POST",
  );
  await deleteButton.click();
  expect((await deletionResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/?account=deleted$/u);

  await page.goto("/dashboard");
  await expect(page).toHaveURL((url) => {
    return url.pathname === "/login" && url.searchParams.get("redirectTo") === "/dashboard";
  });
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page.getByText("Email atau kata sandi tidak cocok.")).toBeVisible();
});

test("account starts and pauses an identity journey", async ({ page }, testInfo) => {
  const suffix = `${testInfo.project.name}-${Date.now()}-${testInfo.workerIndex}`
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]/gu, "-");
  const email = `e2e-complex-${suffix}@example.test`;
  const password = "e2e secure password 123";

  await page.goto("/register");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Buat akun" }).click();
  await expect(page.getByRole("heading", { name: "Permintaan pendaftaran diterima" })).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("link", { name: "Kembali ke halaman masuk" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("textbox", { name: "Kata sandi" }).fill(password);
  await page.getByRole("button", { name: "Masuk", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard$/u, { timeout: 15_000 });

  await page.goto("/start");
  await page.getByRole("radio", { name: /Laki-laki/u }).click();
  await page.getByRole("checkbox").check();
  // The combined run covers an 18+ lens, so a qualifying age is required to start.
  await page.getByLabel("Usia").fill("24");
  await page.getByRole("button", { name: "Testlensa" }).click();
  await expect(page).toHaveURL(/\/test\//u);
  await page.getByRole("button", { name: "Jeda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sesi dijeda" })).toBeVisible();
});
