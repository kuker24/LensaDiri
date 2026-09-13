import { expect, test } from "@playwright/test";

test("landing page exposes the core trust proposition", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
    /Kenali pola dirimu lewat banyak lensa\./u,
  );
  // Hero + peak-end both link to /start; assert the primary hero CTA.
  await expect(
    page
      .locator("#konten-utama")
      .getByRole("link", { name: /Mulai eksplorasi/u })
      .first(),
  ).toBeVisible();

  // The quiet legal row was removed from the hero by product decision, so the
  // landing page no longer links to /privacy or /disclaimer. Those pages are
  // still served — asserted by the next test — and still linked from the site
  // footer, which does not render on the journey routes.
  await expect(page.getByRole("navigation", { name: "Informasi dan kebijakan" })).toHaveCount(0);
});

test("public information pages are reachable", async ({ page }) => {
  for (const path of ["/method", "/privacy", "/disclaimer"]) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
