import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/modules",
  "/combos",
  "/about",
  "/contact",
  "/terms",
  "/blog",
  "/method",
  "/privacy",
  "/start",
  "/login",
  "/register",
] as const;

for (const route of publicRoutes) {
  test(`${route} has stable document structure and no horizontal overflow`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator("main, section").first()).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);

    const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
      const ids = elements.map((element) => element.id).filter(Boolean);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });
}

test("keyboard navigation exposes a visible focus target", async ({ page }) => {
  await page.goto("/modules");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
  await expect(focused).not.toHaveCSS("outline-style", "none");
});

test("authentication controls have programmatic labels", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password|kata sandi/i)).toBeVisible();
  await expect(page.getByRole("button")).toBeEnabled();
});
