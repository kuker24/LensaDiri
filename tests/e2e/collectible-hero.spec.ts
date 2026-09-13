import { expect, test } from "@playwright/test";

test.describe("Collectible Hero", () => {
  test("renders an anonymous 100dvh gallery and navigates without type spoilers", async ({
    page,
  }) => {
    await page.goto("/");

    // Semantic accessible heading
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      /Kenali pola dirimu/u,
    );

    // Brand and ghost text
    await expect(page.getByRole("link", { name: "LENSADIRI", exact: true })).toBeVisible();
    await expect(page.getByText("POLA", { exact: true })).toBeVisible();

    await expect(page.getByText("Koleksi 01 / 16")).toBeVisible();
    await expect(page.getByText(/INTJ/u)).toHaveCount(0);
    await expect(page.getByText(/Arsitek/u)).toHaveCount(0);

    // Primary CTA links to /start
    const cta = page.getByRole("link", { name: /MULAI/u });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/start");

    const nextBtn = page.getByRole("button", { name: "Figurine berikutnya" });
    await nextBtn.click();
    await expect(page.getByText("Koleksi 02 / 16")).toBeVisible();

    const prevBtn = page.getByRole("button", { name: "Figurine sebelumnya" });
    await expect(prevBtn).toBeEnabled();
    await prevBtn.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText("Koleksi 01 / 16")).toBeVisible();
  });

  test("verifies mobile layout at 390px has no horizontal overflow", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    // Verify POLA and brand are visible
    await expect(page.getByText("POLA", { exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "LENSADIRI", exact: true })).toBeVisible();

    // Verify no horizontal scrolling
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth);
  });
});
