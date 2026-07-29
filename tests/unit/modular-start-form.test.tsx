import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { AssessmentModuleDefinition, ComboPresetDefinition } from "@/lib/assessment/catalog";
import { ModularStartForm } from "@/components/modular-start-form";
import { AuthApiError } from "@/lib/auth/client";

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  estimate: vi.fn(),
  push: vi.fn(),
  saveSelection: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  estimateModularAssessment: mocks.estimate,
  getAssessmentCatalog: mocks.getCatalog,
}));
vi.mock("@/lib/assessment/selection-storage", () => ({
  saveAssessmentSelection: mocks.saveSelection,
}));

const modules: AssessmentModuleDefinition[] = [
  {
    category: "trait",
    defaultOrder: 10,
    description: "Profil trait",
    evidenceTier: "A",
    isExperimental: false,
    isSelectable: true,
    key: "trait_profile",
    minimumAge: 13,
    modeQuota: { deep: 60, quick: 30, standard: 45 },
    publicName: "Profil Trait",
    releaseDisposition: "RELEASE_READY",
    status: "active",
    version: "1",
  },
  {
    category: "typology",
    defaultOrder: 20,
    description: "Profil 16-Type",
    evidenceTier: "B",
    isExperimental: false,
    isSelectable: true,
    key: "type_16",
    minimumAge: 13,
    modeQuota: { deep: 70, quick: 32, standard: 50 },
    publicName: "16-Type Jungian-inspired",
    releaseDisposition: "RELEASE_READY",
    status: "published",
    version: "1",
  },
  {
    category: "career",
    defaultOrder: 50,
    description: "RIASEC",
    evidenceTier: "B",
    isExperimental: false,
    isSelectable: true,
    key: "riasec",
    minimumAge: 15,
    modeQuota: { deep: 50, quick: 20, standard: 35 },
    publicName: "RIASEC",
    releaseDisposition: "RELEASE_READY",
    status: "published",
    version: "1.0.0",
  },
];

const modeProfiles = [
  {
    description: "Mode normal",
    internalMode: "standard" as const,
    isSelectable: true,
    maxItemsPerSegment: 120,
    provisionalPrecision: null,
    publicName: "Normal" as const,
    secondsPerItem: 12,
    singleModuleItems: { max: 70, min: 40 },
    targetItems: { max: 90, min: 80 },
  },
];

const complexMode = {
  description: "Mode kompleks",
  internalMode: "deep" as const,
  isSelectable: true,
  maxItemsPerSegment: 60,
  provisionalPrecision: null,
  publicName: "Complex" as const,
  secondsPerItem: 12,
  singleModuleItems: { max: 80, min: 50 },
  targetItems: { max: 120, min: 100 },
};

const preset: ComboPresetDefinition = {
  description: "Kombinasi inti",
  isFullSpectrum: false,
  key: "core_personality",
  moduleKeys: ["trait_profile", "type_16"],
  publicName: "Core Personality",
  recommendedMode: "deep",
  status: "published",
};

const serverCatalog = {
  modes: modeProfiles,
  modules,
};

beforeEach(() => {
  mocks.getCatalog.mockReset().mockResolvedValue({
    combos: [],
    modes: modeProfiles,
    modules,
  });
  mocks.estimate.mockReset().mockResolvedValue({ itemCount: 90 });
  mocks.push.mockReset();
  mocks.saveSelection.mockReset();
});

afterEach(cleanup);

describe("ModularStartForm", () => {
  test("menawarkan retry saat katalog gagal dimuat", async () => {
    mocks.getCatalog.mockRejectedValueOnce(new Error("service_unavailable"));
    render(<ModularStartForm />);

    expect(
      await screen.findByRole("heading", { name: "Pilihan lensa belum dapat dimuat" }),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Coba lagi" }));

    expect(await screen.findByRole("checkbox", { name: /Profil Trait/u })).toBeChecked();
    expect(mocks.getCatalog).toHaveBeenCalledTimes(2);
  });

  test("merender katalog server tanpa skeleton atau fetch client", () => {
    render(
      <ModularStartForm
        initialCatalog={serverCatalog}
        initialCombos={[]}
        initialModuleKey="type_16"
      />,
    );

    expect(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u })).toBeChecked();
    expect(screen.queryByText("Memuat pilihan lensa…")).not.toBeInTheDocument();
    expect(mocks.getCatalog).not.toHaveBeenCalled();
    // pure local estimate: type_16 standard quota 50 → 50 pertanyaan, 10 menit
    expect(screen.getByText(/50 pertanyaan/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeEnabled();
  });

  test("memuat modul dan combo melalui satu request katalog", async () => {
    mocks.getCatalog.mockResolvedValueOnce({ combos: [preset], modes: modeProfiles, modules });

    render(<ModularStartForm />);

    expect(await screen.findByText("Core Personality")).toBeInTheDocument();
    expect(mocks.getCatalog).toHaveBeenCalledTimes(1);
  });

  test("memilih initial module yang valid", async () => {
    render(<ModularStartForm initialModuleKey="type_16" />);

    expect(
      await screen.findByRole("checkbox", { name: /16-Type Jungian-inspired/u }),
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Profil Trait/u })).not.toBeChecked();
  });

  test("fallback ke modul available pertama untuk initial key invalid", async () => {
    render(<ModularStartForm initialModuleKey="not-in-catalog" />);

    expect(await screen.findByRole("checkbox", { name: /Profil Trait/u })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u })).not.toBeChecked();
  });

  test("menghitung estimasi lokal saat selection berubah", async () => {
    render(<ModularStartForm initialCatalog={serverCatalog} initialCombos={[]} />);

    // trait_profile standard quota 45
    expect(screen.getByText(/45 pertanyaan/u)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u }));
    // combo of trait + type_16 → targetItems clamped to 90
    expect(screen.getByText(/90 pertanyaan/u)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("memilih semua lensa sebagai custom combo", async () => {
    render(<ModularStartForm initialCatalog={serverCatalog} initialCombos={[]} />);

    fireEvent.click(screen.getByRole("button", { name: "Pilih semua 3" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(
      screen.getAllByRole<HTMLInputElement>("checkbox").every((checkbox) => checkbox.checked),
    ).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Tinjau pilihan" }));
    await vi.waitFor(() =>
      expect(mocks.saveSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleKeys: ["trait_profile", "type_16", "riasec"],
          presetKey: null,
          selectionType: "custom_combo",
        }),
      ),
    );
  });

  test("membersihkan estimate saat selection kosong", async () => {
    render(<ModularStartForm initialCatalog={serverCatalog} initialCombos={[]} />);

    expect(screen.getByText(/45 pertanyaan/u)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Profil Trait/u }));

    expect(screen.queryByText(/pertanyaan/u)).not.toBeInTheDocument();
    expect(screen.getByText("Pilih lensa untuk melihat estimasi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeDisabled();
  });

  test("menampilkan error usia tanpa memanggil API estimate", () => {
    render(<ModularStartForm initialCatalog={serverCatalog} initialCombos={[]} />);

    fireEvent.change(screen.getByRole("spinbutton", { name: /Usia/u }), {
      target: { value: "12" },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Masukkan usia 13–99. Beberapa lensa memiliki batas usia lebih tinggi.",
    );
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeDisabled();
  });

  test("memvalidasi kapasitas di server sebelum membuka review", async () => {
    mocks.estimate.mockRejectedValueOnce(new AuthApiError("coverage_unavailable"));
    render(
      <ModularStartForm
        initialCatalog={{ modes: [...modeProfiles, complexMode], modules }}
        initialCombos={[preset]}
      />,
    );

    fireEvent.click(screen.getByText("Core Personality"));
    fireEvent.click(screen.getByRole("button", { name: "Tinjau pilihan" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kombinasi ini melebihi kapasitas kedalaman yang dipilih.",
    );
    expect(mocks.saveSelection).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeDisabled();
  });

  test("menyimpan preset tervalidasi lalu mengubahnya menjadi custom combo", async () => {
    render(
      <ModularStartForm
        initialCatalog={{ modes: [...modeProfiles, complexMode], modules }}
        initialCombos={[preset]}
      />,
    );

    fireEvent.click(screen.getByText("Core Personality"));
    fireEvent.click(screen.getByRole("button", { name: "Tinjau pilihan" }));

    await vi.waitFor(() =>
      expect(mocks.saveSelection).toHaveBeenCalledWith(
        expect.objectContaining({
          moduleKeys: ["trait_profile", "type_16"],
          presetKey: "core_personality",
          selectionType: "preset_combo",
        }),
      ),
    );

    cleanup();
    mocks.saveSelection.mockClear();
    render(
      <ModularStartForm
        initialCatalog={{ modes: [...modeProfiles, complexMode], modules }}
        initialCombos={[preset]}
      />,
    );
    fireEvent.click(screen.getByText("Core Personality"));
    fireEvent.click(screen.getByRole("checkbox", { name: /RIASEC/u }));
    fireEvent.click(screen.getByRole("button", { name: "Tinjau pilihan" }));

    await vi.waitFor(() =>
      expect(mocks.saveSelection).toHaveBeenCalledWith(
        expect.objectContaining({ presetKey: null, selectionType: "custom_combo" }),
      ),
    );
  });
});
