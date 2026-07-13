import { expect, test } from "@playwright/test";

test("Quick assessment autosaves, resumes, completes, shares, exports, revokes, and deletes", async ({
  page,
}) => {
  await page.goto("/start");
  await page.getByRole("link", { name: "Pilih Quick" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Mulai Quick" }).click();
  await expect(page).toHaveURL(/\/test\//u);

  await page.getByRole("button", { name: /5 Sangat sesuai/u }).click();
  await expect(page.getByText("1 tersimpan")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Pertanyaan 2 dari 40")).toBeVisible();

  for (let index = 1; index < 40; index += 1) {
    await page.getByRole("button", { name: /3 Netral/u }).click();
  }
  await expect(page.getByText("40 tersimpan")).toBeVisible();
  await page.getByRole("button", { name: "Lihat hasil" }).click();
  await expect(page).toHaveURL(/\/result\//u);
  await expect(page.getByRole("heading", { name: "Lima spektrum" })).toBeVisible();
  await expect(page.getByText(/bukan diagnosis/u)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lensa reflektif" })).toBeVisible();
  await page.getByLabel("Rating 1 sampai 5").selectOption("5");
  await page.getByLabel("Catatan opsional").fill("Membantu memahami pola");
  await page.getByRole("button", { name: "Kirim feedback" }).click();
  await expect(page.getByRole("status")).toContainText("Feedback tersimpan");

  const resultUrl = page.url();
  const resultToken = resultUrl.split("/result/")[1];
  const exportResponse = await page.request.get(`/api/result/export/${resultToken}`);
  expect(exportResponse.ok()).toBe(true);
  const exportBody = JSON.stringify(await exportResponse.json());
  expect(exportBody).not.toContain("raw_value");
  expect(exportBody).not.toContain("session_id");

  await page.getByRole("button", { name: "Buat link berbagi" }).click();
  const sharedLink = page.getByRole("link", { name: /\/shared\//u });
  await expect(sharedLink).toBeVisible();
  const shareUrl = await sharedLink.getAttribute("href");
  expect(shareUrl).toBeTruthy();
  const sharedPage = await page.context().newPage();
  await sharedPage.goto(shareUrl!);
  await expect(sharedPage.getByRole("heading", { name: "Lima spektrum" })).toBeVisible();

  await page.getByRole("button", { name: "Cabut semua link" }).click();
  await expect(page.getByText("Semua link aktif dicabut.")).toBeVisible();
  await sharedPage.reload();
  await expect(sharedPage.getByText(/Hasil tidak ditemukan/u)).toBeVisible();
  await sharedPage.close();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hapus hasil" }).click();
  await expect(page).toHaveURL(/\/start$/u);
  await page.goto(resultUrl);
  await expect(page.getByText(/Hasil tidak ditemukan/u)).toBeVisible();
});
