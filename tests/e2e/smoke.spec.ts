import { expect, test } from "@playwright/test";

test("landing page exposes the core trust proposition", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kenali pola dirimu");
  await expect(page.getByRole("link", { name: "Mulai eksplorasi" })).toBeVisible();
  await expect(page.getByText("Bukan diagnosis klinis")).toBeVisible();
});

test("public information pages are reachable", async ({ page }) => {
  for (const path of ["/method", "/privacy", "/disclaimer"]) {
    const response = await page.goto(path);
    expect(response?.ok()).toBe(true);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
});
