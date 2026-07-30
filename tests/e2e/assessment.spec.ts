import { expect, test } from "@playwright/test";

test("ten-module Complex selection reaches segmented review", async ({ page }) => {
  await page.goto("/start/modules");
  await expect(page.getByRole("heading", { name: "Apa yang ingin kamu pahami?" })).toBeVisible();

  await page.getByRole("button", { name: "Pilih semua 10" }).click();
  await page.getByRole("button", { name: /Complex/u }).click();
  await page.getByRole("checkbox", { name: /Aku memahami lensa eksperimental/u }).check();
  await expect(page.getByText(/Target awal · 10 lensa/u)).toBeVisible();

  await page.getByRole("button", { name: "Tinjau pilihan" }).click();

  await expect(page).toHaveURL(/\/start\/review$/u);
  const questionCount = page.getByText(/\d+ pertanyaan/u);
  await expect(questionCount).toBeVisible();
  expect(Number((await questionCount.textContent())?.match(/\d+/u)?.[0])).toBeGreaterThan(120);
  await expect(
    page.getByRole("heading", { name: "Lensa dipilih" }).locator("..").getByRole("listitem"),
  ).toHaveCount(10);
  const start = page.getByRole("button", { name: "Mulai asesmen" });
  await expect(start).toBeDisabled();
  await page.getByRole("checkbox", { name: /setuju jawabanku diproses/u }).check();
  await expect(start).toBeEnabled();
});

test("modular selection estimates, starts, pauses, resumes, and completes", async ({ page }) => {
  await page.goto("/start/modules");
  await expect(page.getByRole("heading", { name: "Apa yang ingin kamu pahami?" })).toBeVisible();
  await expect(page.getByText("Pilihanmu")).toBeVisible();
  await expect(page.getByText(/pertanyaan · sekitar/u)).toBeVisible();

  await page.getByRole("checkbox", { name: /RIASEC/u }).check();
  await page.getByRole("checkbox", { name: /Profil Trait/u }).uncheck();
  await page.getByRole("button", { name: /Quick/u }).click();
  await expect(page.getByText(/24 pertanyaan · sekitar/u)).toBeVisible();
  await page.getByRole("button", { name: "Tinjau pilihan" }).click();
  await expect(page).toHaveURL(/\/start\/review$/u);
  await expect(page.getByRole("button", { name: "Mulai asesmen" })).toBeDisabled();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Mulai asesmen" }).click();
  await expect(page).toHaveURL(/\/test\//u);
  await expect(page.getByText(/Bagian 1\/1/u)).toBeVisible();

  await page.getByRole("button", { name: "Jeda", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Sesi dijeda" })).toBeFocused();
  await page.getByRole("button", { name: "Lanjutkan", exact: true }).click();
  await expect(page.getByRole("button", { name: "Jeda", exact: true })).toBeVisible();

  for (let index = 0; index < 24; index += 1) {
    const questionHeading = page.getByRole("heading", { level: 1 });
    const promptId = await questionHeading.getAttribute("id");
    expect(promptId).toBeTruthy();
    await expect(page.locator("fieldset")).toHaveAttribute("aria-labelledby", promptId!);
    await page.getByRole("button", { name: /4 Sesuai/u }).click();
    if (index < 23) await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  }
  await expect(page.getByRole("button", { name: "Lihat hasil" })).toBeVisible();
  await page.getByRole("button", { name: "Lihat hasil" }).click();
  await expect(page).toHaveURL(/\/result\//u);
  await expect(page.getByRole("heading", { name: "RIASEC" })).toBeVisible();
  await expect(page.getByText(/tingkat keyakinan \d+ dari 100/iu).first()).toBeVisible();
  // §17.2: session meta remains available through explicit progressive disclosure.
  await page.getByText("Detail dan tingkat keyakinan").click();
  await expect(page.getByRole("term").filter({ hasText: "Mode" })).toBeVisible();
  await expect(page.getByText("Quick", { exact: true })).toBeVisible();
  await expect(page.getByText(/Versi penilaian/u)).toBeVisible();
  await expect(page.getByText(/riasec-score-1/u)).toBeVisible();
});

test("guarded lenses enforce age and acknowledgment before Psychosophy completion", async ({
  page,
}) => {
  await page.goto("/start/modules");
  await page.getByRole("checkbox", { name: /Profil Trait/u }).uncheck();
  await page.getByRole("checkbox", { name: /Refleksi Attachment/u }).check();
  await page.getByRole("spinbutton", { name: /Usia/u }).fill("17");
  await expect(page.getByRole("alert").filter({ hasText: /batas usia/u })).toBeVisible();

  await page.getByRole("spinbutton", { name: /Usia/u }).fill("18");
  await expect(page.getByText(/24 pertanyaan · sekitar/u)).toBeVisible();

  await page.getByRole("checkbox", { name: /Refleksi Attachment/u }).uncheck();
  await page.getByRole("checkbox", { name: /Psychosophy Eksperimental/u }).check();
  await page.getByRole("button", { name: /Quick/u }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: /Konfirmasi lensa eksperimental/u }),
  ).toBeVisible();
  await page.getByRole("checkbox", { name: /Aku memahami lensa eksperimental/u }).check();
  await expect(page.getByText(/12 pertanyaan · sekitar/u)).toBeVisible();

  await page.getByRole("button", { name: "Tinjau pilihan" }).click();
  await page.getByRole("checkbox", { name: /setuju jawabanku diproses/u }).check();
  await page.getByRole("button", { name: "Mulai asesmen" }).click();
  await expect(page).toHaveURL(/\/test\//u);

  for (let index = 0; index < 12; index += 1) {
    await page.getByRole("button", { name: /4 Sesuai/u }).click();
  }
  await page.getByRole("button", { name: "Lihat hasil" }).click();
  await expect(page).toHaveURL(/\/result\//u);
  await expect(page.getByRole("heading", { name: "Psychosophy" })).toBeVisible();
  await expect(
    page.getByText("Tingkat keyakinan tidak dihitung untuk lensa eksperimental."),
  ).toBeVisible();
  await page.getByText("Lihat kecenderungan dan batasan lensa").click();
  await expect(page.getByText(/Catatan ambiguitas/u)).toBeVisible();
  await expect(page.getByText(/hanya untuk refleksi eksploratif/u)).toBeVisible();
});

test("Quick assessment autosaves, resumes, completes, shares, exports, revokes, and deletes", async ({
  page,
}) => {
  await page.goto("/start");
  await page.getByText("Butuh tes lama? Quick 40 / Standard 60").click();
  await page.getByRole("link", { name: "Pilih Quick" }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Mulai Quick" }).click();
  await expect(page).toHaveURL(/\/test\//u);

  await page.getByRole("button", { name: /5 Sangat sesuai/u }).click();
  await expect(page.getByText("1 tersimpan")).toBeVisible();
  await page.reload();
  await expect(page.getByText("2 / 40")).toBeVisible();

  for (let index = 1; index < 40; index += 1) {
    await page.getByRole("button", { name: /3 Netral/u }).click();
  }
  await expect(page.getByText("40 tersimpan")).toBeVisible();
  await page.getByRole("button", { name: "Lihat hasil" }).click();
  await expect(page).toHaveURL(/\/result\//u);
  await expect(page.getByRole("heading", { name: "Lima spektrum" })).toBeVisible();
  await expect(page.getByText(/bukan diagnosis/u)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lensa reflektif" })).toBeVisible();
  await page.getByLabel("Nilai 1 sampai 5").selectOption("5");
  await page.getByLabel("Catatan opsional").fill("Membantu memahami pola");
  await page.getByRole("button", { name: "Kirim masukan" }).click();
  await expect(page.getByRole("status").first()).toContainText("Masukanmu tersimpan");

  const resultUrl = page.url();
  const resultToken = resultUrl.split("/result/")[1];
  const exportPdfResponse = await page.request.get(`/api/result/export/${resultToken}`);
  expect(exportPdfResponse.ok()).toBe(true);
  expect(exportPdfResponse.headers()["content-type"] ?? "").toContain("application/pdf");
  const pdfBytes = Buffer.from(await exportPdfResponse.body());
  expect(pdfBytes.subarray(0, 4).toString("utf8")).toBe("%PDF");

  const exportJsonResponse = await page.request.get(
    `/api/result/export/${resultToken}?format=json`,
  );
  expect(exportJsonResponse.ok()).toBe(true);
  const exportBody = JSON.stringify(await exportJsonResponse.json());
  expect(exportBody).not.toContain("raw_value");
  expect(exportBody).not.toContain("session_id");

  // §17.2: retest control begins a fresh session without deleting this result.
  await expect(page.getByRole("link", { name: "Tes ulang" })).toHaveAttribute("href", "/start");

  await page.getByRole("button", { name: "Buat tautan berbagi" }).click();
  const sharedLink = page.getByRole("link", { name: /\/shared\//u });
  await expect(sharedLink).toBeVisible();
  const shareUrl = await sharedLink.getAttribute("href");
  expect(shareUrl).toBeTruthy();
  const sharedPage = await page.context().newPage();
  await sharedPage.goto(shareUrl!);
  await expect(sharedPage.getByRole("heading", { name: "Lima spektrum" })).toBeVisible();

  await page.getByRole("button", { name: "Cabut semua tautan" }).click();
  await expect(page.getByText("Semua tautan aktif dicabut.")).toBeVisible();
  await sharedPage.reload();
  await expect(sharedPage.getByText(/Hasil tidak ditemukan/u)).toBeVisible();
  await sharedPage.close();

  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Hapus hasil" }).click();
  await expect(page).toHaveURL(/\/start$/u);
  await page.goto(resultUrl);
  await expect(page.getByText(/Hasil tidak ditemukan/u)).toBeVisible();
});
