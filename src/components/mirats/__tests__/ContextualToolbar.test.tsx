// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ContextualToolbar, type ContextualAction } from "../ContextualToolbar";
import { computePosition } from "@/hooks/use-contextual-position";

afterEach(() => cleanup());

const actions: ContextualAction[] = [
  { id: "mount", label: "Lắp", onSelect: vi.fn(), supportsBulk: true },
  { id: "unmount", label: "Tháo", onSelect: vi.fn(), supportsBulk: true },
  { id: "qr", label: "Xem QR", onSelect: vi.fn(), supportsBulk: false },
];

describe("ContextualToolbar", () => {
  it("render đủ 3 nút khi chọn 1 row", () => {
    render(<ContextualToolbar selectionCount={1} actions={actions} onDismiss={() => {}} />);
    expect(screen.getByText("Lắp")).not.toBeNull();
    expect(screen.getByText("Tháo")).not.toBeNull();
    expect(screen.getByText("Xem QR")).not.toBeNull();
  });

  it("ẩn action không hỗ trợ bulk khi chọn >1 row", () => {
    render(<ContextualToolbar selectionCount={3} actions={actions} onDismiss={() => {}} />);
    expect(screen.getByText("Lắp")).not.toBeNull();
    expect(screen.queryByText("Xem QR")).toBeNull();
  });

  it("ESC gọi onDismiss", () => {
    const onDismiss = vi.fn();
    render(<ContextualToolbar selectionCount={1} actions={actions} onDismiss={onDismiss} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalled();
  });

  it("không render khi selectionCount = 0", () => {
    render(<ContextualToolbar selectionCount={0} actions={actions} onDismiss={() => {}} />);
    expect(document.querySelector('[role="toolbar"]')).toBeNull();
  });
});

describe("computePosition", () => {
  it("mặc định đặt bên dưới anchor", () => {
    const p = computePosition(
      { top: 100, left: 200, width: 400, height: 30 },
      { width: 300, height: 40 },
      { width: 1280, height: 800 },
    );
    expect(p.placement).toBe("below");
    expect(p.top).toBe(138);
  });

  it("flip lên trên khi anchor gần đáy viewport", () => {
    const p = computePosition(
      { top: 780, left: 200, width: 400, height: 30 },
      { width: 300, height: 40 },
      { width: 1280, height: 800 },
    );
    expect(p.placement).toBe("above");
    expect(p.top).toBe(780 - 40 - 8);
  });

  it("kẹp left trong biên viewport", () => {
    const p = computePosition(
      { top: 100, left: 1200, width: 400, height: 30 },
      { width: 300, height: 40 },
      { width: 1280, height: 800 },
    );
    expect(p.left).toBeLessThanOrEqual(1280 - 300 - 8);
    expect(p.left).toBeGreaterThanOrEqual(8);
  });
});
