import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ConsentDecisionControl } from "@/components/consent-decision-control";

const mocks = vi.hoisted(() => ({
  mutation: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("@/lib/auth/client", () => ({ postAuthenticatedMutation: mocks.mutation }));

function deferred() {
  let resolve!: () => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, reject, resolve };
}

describe("ConsentDecisionControl", () => {
  beforeEach(() => {
    mocks.mutation.mockReset();
    mocks.refresh.mockReset();
  });

  afterEach(cleanup);

  test("melepas pending setelah keputusan berhasil", async () => {
    const request = deferred();
    mocks.mutation.mockReturnValue(request.promise);
    render(
      <ConsentDecisionControl consentType="research_optional" decision="not_set" version="1" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Izinkan" }));
    expect(screen.getByRole("button", { name: "Izinkan" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Tolak atau cabut" })).toBeDisabled();

    await act(async () => request.resolve());
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Izinkan" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tolak atau cabut" })).toBeEnabled();
  });

  test("melepas pending dan menampilkan alert setelah gagal", async () => {
    const request = deferred();
    mocks.mutation.mockReturnValue(request.promise);
    render(
      <ConsentDecisionControl consentType="research_optional" decision="not_set" version="1" />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tolak atau cabut" }));
    await act(async () => request.reject(new Error("failed")));

    expect(screen.getByRole("alert")).toHaveTextContent("Keputusan consent belum tersimpan.");
    expect(screen.getByRole("button", { name: "Izinkan" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Tolak atau cabut" })).toBeEnabled();
  });
});
