import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { AssessmentModuleDefinition } from "@/lib/assessment/catalog";
import { ModularStartForm } from "@/components/modular-start-form";

const mocks = vi.hoisted(() => ({
  getCatalog: vi.fn(),
  getCombos: vi.fn(),
  push: vi.fn(),
  saveSelection: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  getAssessmentCatalog: mocks.getCatalog,
  getComboCatalog: mocks.getCombos,
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

const serverCatalog = {
  modes: modeProfiles,
  modules,
};

beforeEach(() => {
  mocks.getCatalog.mockReset().mockResolvedValue({
    modes: modeProfiles,
    modules,
  });
  mocks.getCombos.mockReset().mockResolvedValue([]);
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
    expect(mocks.getCombos).not.toHaveBeenCalled();
    // pure local estimate: type_16 standard quota 50 → 50 pertanyaan, 10 menit
    expect(screen.getByText(/50 pertanyaan/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeEnabled();
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
      "Pilihan ini memiliki batas usia yang belum terpenuhi.",
    );
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeDisabled();
  });
});
