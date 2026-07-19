import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { AssessmentModuleDefinition } from "@/lib/assessment/catalog";
import type { AssessmentEstimate } from "@/lib/assessment/estimate";
import { ModularStartForm } from "@/components/modular-start-form";

const mocks = vi.hoisted(() => ({
  estimate: vi.fn(),
  getCatalog: vi.fn(),
  getCombos: vi.fn(),
  push: vi.fn(),
  saveSelection: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock("@/lib/assessment/client", () => ({
  estimateModularAssessment: mocks.estimate,
  getAssessmentCatalog: mocks.getCatalog,
  getComboCatalog: mocks.getCombos,
}));
vi.mock("@/lib/assessment/selection-storage", () => ({
  saveAssessmentSelection: mocks.saveSelection,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

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

function estimate(itemCount: number): AssessmentEstimate {
  return {
    disclaimer: "Estimasi untuk test.",
    estimatedMinutes: itemCount,
    itemCount,
    mode: "standard",
    moduleAllocation: [{ itemCount, moduleKey: "trait_profile" }],
    precision: null,
    publicMode: "Normal",
    segmentPlan: [{ endItem: itemCount, itemCount, segmentIndex: 1, startItem: 1 }],
    selectionType: "single",
  };
}

beforeEach(() => {
  mocks.estimate.mockReset();
  mocks.getCatalog.mockReset().mockResolvedValue({
    modes: [
      {
        description: "Mode normal",
        internalMode: "standard",
        isSelectable: true,
        maxItemsPerSegment: 120,
        provisionalPrecision: null,
        publicName: "Normal",
        secondsPerItem: 12,
        singleModuleItems: { max: 70, min: 40 },
        targetItems: { max: 90, min: 80 },
      },
    ],
    modules,
  });
  mocks.getCombos.mockReset().mockResolvedValue([]);
  mocks.push.mockReset();
  mocks.saveSelection.mockReset();
});

afterEach(cleanup);

describe("ModularStartForm", () => {
  test("memilih initial module yang valid", async () => {
    mocks.estimate.mockReturnValue(new Promise(() => undefined));
    render(<ModularStartForm initialModuleKey="type_16" />);

    expect(
      await screen.findByRole("checkbox", { name: /16-Type Jungian-inspired/u }),
    ).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Profil Trait/u })).not.toBeChecked();
  });

  test("fallback ke modul available pertama untuk initial key invalid", async () => {
    mocks.estimate.mockReturnValue(new Promise(() => undefined));
    render(<ModularStartForm initialModuleKey="not-in-catalog" />);

    expect(await screen.findByRole("checkbox", { name: /Profil Trait/u })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u })).not.toBeChecked();
  });

  test("mengabaikan resolve estimate selection lama", async () => {
    const oldRequest = deferred<AssessmentEstimate>();
    const newRequest = deferred<AssessmentEstimate>();
    mocks.estimate.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    render(<ModularStartForm />);

    await waitFor(() => expect(mocks.estimate).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u }));
    await waitFor(() => expect(mocks.estimate).toHaveBeenCalledTimes(2));

    await act(async () => oldRequest.resolve(estimate(30)));
    expect(screen.queryByText(/30 item/u)).not.toBeInTheDocument();

    await act(async () => newRequest.resolve(estimate(80)));
    expect(screen.getByText(/80 item/u)).toBeInTheDocument();
  });

  test("mengabaikan reject estimate selection lama", async () => {
    const oldRequest = deferred<AssessmentEstimate>();
    const newRequest = deferred<AssessmentEstimate>();
    mocks.estimate.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);
    render(<ModularStartForm />);

    await waitFor(() => expect(mocks.estimate).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("checkbox", { name: /16-Type Jungian-inspired/u }));
    await waitFor(() => expect(mocks.estimate).toHaveBeenCalledTimes(2));
    await act(async () => newRequest.resolve(estimate(80)));
    await act(async () => oldRequest.reject(new Error("request_failed")));

    expect(screen.getByText(/80 item/u)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("membersihkan estimate saat selection kosong", async () => {
    mocks.estimate.mockResolvedValue(estimate(45));
    render(<ModularStartForm />);

    expect(await screen.findByText(/45 item/u)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Profil Trait/u }));

    expect(screen.queryByText(/45 item/u)).not.toBeInTheDocument();
    expect(screen.getByText("Pilih lensa untuk melihat estimasi.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tinjau pilihan" })).toBeDisabled();
  });
});
