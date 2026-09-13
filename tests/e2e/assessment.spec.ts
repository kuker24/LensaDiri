import { expect, test } from "@playwright/test";

test("removed composer and legacy launch routes return not found", async ({ page }) => {
  for (const route of [
    "/modules",
    "/modules/type_16",
    "/combos",
    "/start/modules",
    "/start/review",
    "/start/consent?mode=quick",
  ]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
  }
});

test("the only primary entry creates the required first journey lens", async ({ page }) => {
  await page.goto("/start");
  await expect(page.getByRole("heading", { name: "Pilih wujudmu" })).toBeVisible();
  await expect(page.getByText("Susun lensa sendiri")).toHaveCount(0);
  await expect(page.getByText("Gunakan format tes lama")).toHaveCount(0);

  await page.getByRole("radio", { name: /Laki-laki/u }).click();
  await page.getByRole("checkbox").check();

  // The combined run includes an 18+ lens, so the entry stays blocked until a
  // qualifying age is entered. A minor age must never open the run.
  const ageField = page.getByLabel("Usia");
  const startButton = page.getByRole("button", { name: "Testlensa" });
  await expect(startButton).toBeDisabled();
  await ageField.fill("17");
  await expect(startButton).toBeDisabled();
  await ageField.fill("24");
  await expect(startButton).toBeEnabled();
  await startButton.click();
  await expect(page).toHaveURL(/\/test\//u);
  // The lens identity stays hidden during the run so the questions read as neutral.
  await expect(page.getByText(/16-Type/u)).toHaveCount(0);
  await expect(page.getByText(/Bagian \d/u)).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});
