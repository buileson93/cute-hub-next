// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MauChip, MauSwatchPicker } from "../MauChip";
import { mauTheoToken } from "@/lib/mirats/mau-sac";

afterEach(() => cleanup());

describe("MauChip", () => {
  it("render tên + lớp Tailwind theo token màu", () => {
    render(<MauChip ten="Máy tính" mau="lam" />);
    const chip = screen.getByTestId("mau-chip");
    expect(chip.textContent).toBe("Máy tính");
    expect(chip.getAttribute("data-mau-token")).toBe("lam");
    for (const c of mauTheoToken("lam").lop.split(" ")) {
      expect(chip.classList.contains(c)).toBe(true);
    }
  });

  it("mau null → dùng lớp màu xám fallback", () => {
    render(<MauChip ten="Không đặt" mau={null} />);
    const chip = screen.getByTestId("mau-chip");
    expect(chip.getAttribute("data-mau-token")).toBe("xam");
    for (const c of mauTheoToken("xam").lop.split(" ")) {
      expect(chip.classList.contains(c)).toBe(true);
    }
  });

  it("mau không hợp lệ → fallback về xám", () => {
    render(<MauChip ten="X" mau="khong_ton_tai" />);
    expect(screen.getByTestId("mau-chip").getAttribute("data-mau-token")).toBe("xam");
  });
});

describe("MauSwatchPicker", () => {
  it("bấm swatch gọi onChange với token tương ứng", () => {
    const calls: (string | null)[] = [];
    render(<MauSwatchPicker value={null} onChange={(v) => calls.push(v)} />);
    fireEvent.click(screen.getByTestId("mau-swatch-luc"));
    fireEvent.click(screen.getByTestId("mau-swatch-hong"));
    expect(calls).toEqual(["luc", "hong"]);
  });

  it("bấm 'Bỏ đặt' trả null", () => {
    const calls: (string | null)[] = [];
    render(<MauSwatchPicker value="luc" onChange={(v) => calls.push(v)} />);
    fireEvent.click(screen.getByText("Bỏ đặt"));
    expect(calls).toEqual([null]);
  });
});
