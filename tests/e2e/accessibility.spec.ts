import { expect, test } from "@playwright/test";

const publicRoutes = [
  "/",
  "/about",
  "/contact",
  "/terms",
  "/method",
  "/privacy",
  "/disclaimer",
  "/start",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
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

    const nestedControlsCount = await page
      .locator("a button, button a, a [role='button'], button [role='link']")
      .count();
    expect(nestedControlsCount).toBe(0);

    const undersizedPrimaryTargets = await page
      .locator("main a, main button, main input, main select, main textarea")
      .evaluateAll((elements) =>
        elements.flatMap((element) => {
          const input = element instanceof HTMLInputElement ? element : null;
          const target =
            input && (input.type === "checkbox" || input.type === "radio")
              ? (input.closest("label") ?? input)
              : element;
          const rect = target.getBoundingClientRect();
          const style = window.getComputedStyle(target);
          const isInlineLink = element.tagName === "A" && style.display === "inline";
          const isHidden = rect.width === 0 || rect.height === 0 || style.visibility === "hidden";
          if (isInlineLink || isHidden) return [];
          return rect.height < 44 || rect.width < 44
            ? [
                `${element.textContent?.trim() || element.getAttribute("aria-label")}: ${rect.width}x${rect.height}`,
              ]
            : [];
        }),
      );
    expect(undersizedPrimaryTargets).toEqual([]);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);

    const imagesWithoutAlt = await page.locator("img:not([alt])").count();
    expect(imagesWithoutAlt).toBe(0);
  });
}

test("keyboard focus treatment remains visible across primary surfaces", async ({ page }) => {
  await page.goto("/");

  const lightControl = page.getByRole("link", { name: /MULAI/u });
  await lightControl.focus();
  await expect(lightControl).toBeFocused();
  await expect(lightControl).toHaveCSS("outline-style", "solid");

  await page.goto("/start");
  const startControl = page.getByRole("radio").first();
  await startControl.focus();
  await expect(startControl).toBeFocused();
});

test("authentication controls have labels and mobile-safe font size", async ({ page }) => {
  await page.goto("/login");
  const email = page.getByLabel(/email/i);
  const password = page.getByRole("textbox", { name: "Kata sandi" });
  await expect(email).toBeVisible();
  await expect(password).toBeVisible();
  await expect(page.getByRole("button", { name: "Masuk", exact: true })).toBeEnabled();

  if (page.viewportSize()?.width === 393) {
    for (const control of [email, password]) {
      const fontSize = await control.evaluate((element) =>
        Number.parseFloat(window.getComputedStyle(element).fontSize),
      );
      expect(fontSize).toBeGreaterThanOrEqual(16);
    }
  }
});

test("removed product routes and unknown paths return real not-found responses", async ({
  page,
}) => {
  for (const route of ["/modules", "/combos", "/start/modules", "/tidak-ada-halaman-ini"]) {
    const response = await page.goto(route);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(1);
  }
});

test("product surfaces paint an opaque background instead of leaking content through", async ({
  page,
}) => {
  async function backgroundAlpha(selector: string) {
    return page.locator(selector).evaluate((element) => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context unavailable");
      context.fillStyle = window.getComputedStyle(element).backgroundColor;
      context.fillRect(0, 0, 1, 1);
      return [...context.getImageData(0, 0, 1, 1).data][3] ?? 0;
    });
  }

  // The paper canvas must be a real colour, not the UA default.
  await page.goto("/");
  expect(await backgroundAlpha("body")).toBe(255);

  // The start surface remains opaque on a mobile viewport.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/start");
  expect(await backgroundAlpha("body")).toBe(255);
});

test("result loading and failure states keep a single page heading", async ({ page }) => {
  for (const route of ["/result/not-a-real-token", "/shared/not-a-real-token"]) {
    await page.goto(route);
    const heading = page.getByRole("heading", { level: 1 });
    await expect(heading).toHaveText("Hasil tidak ditemukan");
    await expect(heading).toHaveCount(1);
    await expect(heading.locator("..")).toHaveAttribute("role", "alert");
  }
});

test.describe("Dialog primitive", () => {
  test("manages focus, Escape, close controls, and unique IDs", async ({ page }) => {
    await page.goto("/test-dialog");

    const trigger1 = page.locator("#trigger-dialog-1");
    const trigger2 = page.locator("#trigger-dialog-2");
    const dialog1 = page.locator("dialog").first();

    await trigger1.focus();
    await trigger1.click();
    await expect(dialog1).toBeVisible();

    const titleId1 = await dialog1.getAttribute("aria-labelledby");
    expect(titleId1).toBeTruthy();
    await expect(dialog1.locator(`h2#${titleId1}`)).toHaveText("Judul Dialog Kesatu");
    await expect(dialog1.locator(":focus")).toHaveAttribute("aria-label", "Tutup dialog");

    await page.keyboard.press("Tab");
    await expect(dialog1.locator("#dialog-button-1")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog1.getByRole("button", { name: "Tutup dialog" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog1.locator("#dialog-button-1")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog1).not.toBeVisible();
    await expect(trigger1).toBeFocused();

    await trigger1.click();
    await dialog1.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(dialog1).not.toBeVisible();
    await expect(trigger1).toBeFocused();

    await trigger2.click();
    const dialog2 = page.locator("dialog").nth(1);
    const titleId2 = await dialog2.getAttribute("aria-labelledby");
    expect(titleId2).toBeTruthy();
    expect(titleId1).not.toEqual(titleId2);

    const duplicateIds = await page.locator("[id]").evaluateAll((elements) => {
      const ids = elements.map((element) => element.id).filter(Boolean);
      return ids.filter((id, index) => ids.indexOf(id) !== index);
    });
    expect(duplicateIds).toEqual([]);
  });

  test("restores focus when initially open under Strict Mode", async ({ page }) => {
    await page.goto("/test-dialog?initial=1");
    const dialog = page.locator("dialog").first();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Tutup dialog" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(page.locator("#initial-dialog-trigger")).toBeFocused();
  });

  test("uses near-instant motion when reduced motion is requested", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/test-dialog");
    await page.locator("#trigger-dialog-1").click();

    const dialog = page.locator("dialog").first();
    await expect(dialog).toBeVisible();
    const durations = await dialog.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        animation: Number.parseFloat(style.animationDuration),
        transition: Number.parseFloat(style.transitionDuration),
      };
    });
    expect(durations.animation).toBeLessThan(0.02);
    expect(durations.transition).toBeLessThan(0.02);
  });
});
