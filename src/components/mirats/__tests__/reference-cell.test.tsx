// @vitest-environment jsdom
// ============================================================================
// P5 — Reference cell ALWAYS renders a Combobox danh mục.
//
// Bảo đảm:
//   1. Với PhysCol.type === "reference": renderer PHẢI dùng Combobox
//      (role="combobox") — KHÔNG bao giờ render `<input type="text">`.
//      Người dùng không thể gõ tự do một chuỗi tuỳ ý vào FK.
//   2. Khi người dùng chọn một option, onChange nhận về UUID (option.value),
//      không phải label — đúng nguồn sự thật FK ở bảng gốc.
//   3. Danh sách option lấy từ `useReferenceIdOptions(refTable)` — mock để
//      giả lập ba bản ghi dm_don_vi.
// ============================================================================
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

afterEach(() => cleanup());

// Radix Popover / cmdk dùng vài API DOM chưa có trong jsdom.
beforeEach(() => {
  if (!("hasPointerCapture" in Element.prototype)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Element.prototype as any).hasPointerCapture = () => false;
  }
  if (!("releasePointerCapture" in Element.prototype)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Element.prototype as any).releasePointerCapture = () => {};
  }
  if (!("scrollIntoView" in Element.prototype)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Element.prototype as any).scrollIntoView = () => {};
  }
  if (typeof (globalThis as unknown as { ResizeObserver?: unknown }).ResizeObserver === "undefined") {
    class RO { observe() {} unobserve() {} disconnect() {} }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).ResizeObserver = RO;
  }
});

// Mock hook nguồn danh mục — trả 3 đơn vị mẫu dưới dạng {value:uuid, label:ten}.
const UUID_A = "11111111-1111-1111-1111-111111111111";
const UUID_B = "22222222-2222-2222-2222-222222222222";
const UUID_C = "33333333-3333-3333-3333-333333333333";

vi.mock("@/lib/mirats/reference-sources", () => ({
  useReferenceIdOptions: (table: string) => ({
    data: [
      { value: UUID_A, label: "Đơn vị Nội Bài", hint: "DV_NB" },
      { value: UUID_B, label: "Đơn vị Tân Sơn Nhất", hint: "DV_TSN" },
      { value: UUID_C, label: "Đơn vị Đà Nẵng", hint: "DV_DN" },
    ],
    isLoading: false,
    __table: table,
  }),
}));

import { ReferenceCell } from "@/components/mirats/ReferenceCell";

describe("ReferenceCell — P5 · reference field bắt buộc là Combobox danh mục", () => {
  it("Render role=\"combobox\" và KHÔNG render bất kỳ <input type=text> nào", () => {
    render(
      <ReferenceCell
        refTable="dm_don_vi"
        value=""
        onChange={() => {}}
      />,
    );
    // 1. Có Combobox (Popover trigger có role="combobox").
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeTruthy();
    // 2. KHÔNG có ô nhập text nào lộ ra khi popover chưa mở.
    const textboxes = screen.queryAllByRole("textbox");
    expect(textboxes.length).toBe(0);
    // 3. Không có phần tử <input type="text"> nào ở form.
    const rawInputs = document.querySelectorAll('input[type="text"]');
    expect(rawInputs.length).toBe(0);
  });

  it("Hiển thị nhãn theo UUID hiện tại (không phải chuỗi tự do)", () => {
    render(
      <ReferenceCell
        refTable="dm_don_vi"
        value={UUID_B}
        onChange={() => {}}
      />,
    );
    // Trigger phải hiển thị label khớp option có value=UUID_B.
    const trigger = screen.getByRole("combobox");
    expect(trigger.textContent).toContain("Đơn vị Tân Sơn Nhất");
    // Không hiển thị chính chuỗi UUID (nghĩa là selected map qua options).
    expect(trigger.textContent).not.toContain(UUID_B);
  });

  it("Chọn option ⇒ onChange nhận UUID (option.value), không phải label", async () => {
    const onChange = vi.fn();
    render(
      <ReferenceCell
        refTable="dm_don_vi"
        value=""
        onChange={onChange}
      />,
    );
    // Mở popover.
    fireEvent.click(screen.getByRole("combobox"));
    // Chờ option xuất hiện trong portal & click.
    const option = await screen.findByText("Đơn vị Đà Nẵng");
    fireEvent.click(option);

    expect(onChange).toHaveBeenCalledTimes(1);
    // Ghi UUID, KHÔNG ghi label.
    expect(onChange).toHaveBeenCalledWith(UUID_C);
    expect(onChange).not.toHaveBeenCalledWith("Đơn vị Đà Nẵng");
  });
});
