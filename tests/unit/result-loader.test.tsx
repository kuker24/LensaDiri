import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { ResultLoader } from "@/components/result-loader";

const clientMocks = vi.hoisted(() => ({
  getPrivateResult: vi.fn(),
  getSharedResult: vi.fn(),
}));

vi.mock("@/lib/assessment/client", () => clientMocks);
vi.mock("@/components/result-report", () => ({
  ResultReport: ({ result }: { result: { marker: string } }) => <div>{result.marker}</div>,
}));
vi.mock("@/components/shared-result-report", () => ({
  SharedResultReport: ({ result }: { result: { marker: string } }) => <div>{result.marker}</div>,
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

describe("ResultLoader request identity", () => {
  beforeEach(() => {
    clientMocks.getPrivateResult.mockReset();
    clientMocks.getSharedResult.mockReset();
  });

  afterEach(cleanup);

  test.each([
    ["private", false, clientMocks.getPrivateResult],
    ["shared", true, clientMocks.getSharedResult],
  ])("mengabaikan resolve token lama untuk hasil %s", async (_name, shared, request) => {
    const oldRequest = deferred<{ marker: string }>();
    const newRequest = deferred<{ marker: string }>();
    request.mockReturnValueOnce(oldRequest.promise).mockReturnValueOnce(newRequest.promise);

    const { rerender } = render(<ResultLoader shared={shared} token="token-a" />);
    rerender(<ResultLoader shared={shared} token="token-b" />);

    await act(async () => newRequest.resolve({ marker: "hasil-b" }));
    expect(screen.getByText("hasil-b")).toBeInTheDocument();

    await act(async () => oldRequest.resolve({ marker: "hasil-a" }));
    expect(screen.getByText("hasil-b")).toBeInTheDocument();
    expect(screen.queryByText("hasil-a")).not.toBeInTheDocument();
  });

  test("mengabaikan reject token lama dan membersihkan failure saat token berubah", async () => {
    const firstFailure = deferred<{ marker: string }>();
    const oldRequest = deferred<{ marker: string }>();
    const newRequest = deferred<{ marker: string }>();
    clientMocks.getPrivateResult
      .mockReturnValueOnce(firstFailure.promise)
      .mockReturnValueOnce(oldRequest.promise)
      .mockReturnValueOnce(newRequest.promise);

    const { rerender } = render(<ResultLoader token="token-failure" />);
    await act(async () => firstFailure.reject(new Error("not found")));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    rerender(<ResultLoader token="token-a" />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    rerender(<ResultLoader token="token-b" />);
    await act(async () => newRequest.resolve({ marker: "hasil-b" }));
    await act(async () => oldRequest.reject(new Error("stale")));

    expect(screen.getByText("hasil-b")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
