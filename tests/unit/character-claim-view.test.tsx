import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { CharacterClaimView } from "@/components/character-claim-view";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

describe("CharacterClaimView Component", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    mocks.push.mockReset();
  });

  afterEach(cleanup);

  test("renders title, sub, badge, and temporary identity", () => {
    render(
      <CharacterClaimView
        resultToken="claim-token-123"
        onAttachNext={vi.fn()}
        temperamentCode="NF"
        typeCode="INFP"
      />,
    );

    expect(screen.getByRole("heading", { name: "Ini tubuh karaktermu" })).toBeDefined();
    expect(screen.getByText("Baru diklaim · masih polos")).toBeDefined();
    expect(screen.getByText(/Atribut lensa lain belum terpasang/i)).toBeDefined();
    expect(screen.getByText("INFP · NF")).toBeDefined();
    expect(screen.getByRole("button", { name: /Pasang lensa berikutnya/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Simpan dulu/i })).toBeDefined();
  });

  test("clicking Pasang lensa berikutnya calls onAttachNext", () => {
    const onAttachNext = vi.fn();
    render(<CharacterClaimView resultToken="claim-token-123" onAttachNext={onAttachNext} />);

    fireEvent.click(screen.getByRole("button", { name: /Pasang lensa berikutnya/i }));
    expect(onAttachNext).toHaveBeenCalledTimes(1);
  });

  test("clicking Simpan dulu calls router.push to /result/[token]", () => {
    render(<CharacterClaimView resultToken="claim-token-123" onAttachNext={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /Simpan dulu/i }));
    expect(mocks.push).toHaveBeenCalledWith("/result/claim-token-123");
  });
});
