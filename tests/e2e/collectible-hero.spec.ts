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

    await expect(page.getByText(/INTJ/u)).toHaveCount(0);
    await expect(page.getByText(/Arsitek/u)).toHaveCount(0);

    // Primary CTA links to /start
    const cta = page.getByRole("link", { name: /MULAI/u });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/start");

    // The visible counter was removed, so the active card is identified by the
    // centred card's stacking order. Read the computed value rather than
    // matching the style attribute as a string: browsers are free to normalise
    // that serialisation, and Chromium does.
    const activeAlt = () =>
      page.evaluate(() => {
        const active = [...document.querySelectorAll("div")].find(
          (element) => window.getComputedStyle(element).zIndex === "20",
        );
        return active?.querySelector("img")?.getAttribute("alt") ?? "";
      });

    await expect.poll(activeAlt).toBe("Figurine koleksi 01");

    const nextBtn = page.getByRole("button", { name: "Figurine berikutnya" });
    await nextBtn.click();
    await expect.poll(activeAlt).toBe("Figurine koleksi 02");

    const prevBtn = page.getByRole("button", { name: "Figurine sebelumnya" });
    await expect(prevBtn).toBeEnabled();
    await prevBtn.focus();
    await page.keyboard.press("Enter");
    await expect.poll(activeAlt).toBe("Figurine koleksi 01");
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

  test("paints the canvas with the stage colour so no white strip can show", async ({ page }) => {
    // The bug: the stage is `100dvh` but `body` had a `100vh` floor. On Chrome
    // Android `100vh` is the large viewport, so while browser UI is showing the
    // body box outlived the stage and painted `--color-canvas` (#fbf9f5) as a
    // white strip under it. Headless has no browser UI, so the units resolve
    // equal and the gap itself cannot be reproduced here; what is asserted is the
    // invariant that closes it — whatever shows outside the stage box is the stage
    // colour, never paper.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const paint = () =>
      page.evaluate(() => {
        const section = document.querySelector("section[aria-label='LensaDiri Collectible Hero']");
        return {
          body: window.getComputedStyle(document.body).backgroundColor,
          html: window.getComputedStyle(document.documentElement).backgroundColor,
          section: section ? window.getComputedStyle(section).backgroundColor : null,
        };
      });

    await expect.poll(async () => (await paint()).body).toBe("rgb(110, 181, 255)");
    const initial = await paint();
    expect(initial.body).toBe(initial.section);
    expect(initial.html).toBe(initial.section);

    // `body` must no longer resolve its floor against the large viewport.
    const minHeight = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.cssText = "position:fixed;top:0;left:0;width:1px;height:100dvh;visibility:hidden";
      document.body.appendChild(probe);
      const dvh = probe.getBoundingClientRect().height;
      probe.remove();
      return { dvh, resolved: window.getComputedStyle(document.body).minHeight };
    });
    expect(minHeight.resolved).toBe(`${minHeight.dvh}px`);

    // Crossing into another cluster must carry the canvas with it. The roster
    // interleaves both bodies per type, so the first eight cards are all NT and
    // the ninth is the first NF.
    const next = page.getByRole("button", { name: "Figurine berikutnya" });
    for (let step = 0; step < 8; step += 1) await next.click();

    await expect.poll(async () => (await paint()).body).toBe("rgb(232, 130, 180)");
    const crossed = await paint();
    expect(crossed.body).toBe(crossed.section);
  });

  test("restores the paper canvas after leaving the stage", async ({ page }) => {
    // The stage hue is set on `documentElement`, so the effect cleanup has to run
    // on unmount. Without it every later page stays tinted with the last card.
    await page.goto("/");
    await expect
      .poll(() => page.evaluate(() => window.getComputedStyle(document.body).backgroundColor))
      .toBe("rgb(110, 181, 255)");

    await page.goto("/about");
    await expect
      .poll(() => page.evaluate(() => window.getComputedStyle(document.body).backgroundColor))
      .toBe("rgb(251, 249, 245)");
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.style.getPropertyValue("--stage-canvas")),
      )
      .toBe("");
  });
});
