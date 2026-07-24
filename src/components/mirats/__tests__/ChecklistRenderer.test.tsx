// @vitest-environment jsdom
// Test component ChecklistRenderer: render section Cảm biến/Tủ phụ trợ, hiển thị
// hướng dẫn/tiêu chuẩn/đơn vị, cho nhập, và báo lỗi "Không đạt thiếu hành động".
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { ChecklistRenderer } from "../ChecklistRenderer";
import type { ChecklistSection } from "@/lib/mirats/checklist";

const SECTIONS: ChecklistSection[] = [
  {
    ma_section: "CB",
    ten: "Cảm biến",
    mo_ta: "Khối cảm biến",
    position: 0,
    items: [
      {
        item_code: "CB-DIEN-AP",
        ten: "Điện áp cảm biến",
        huong_dan: "Đo bằng đồng hồ vạn năng",
        result_kind: "so",
        don_vi: "V",
        tieu_chuan: "4.5–5.5",
        tuy_chon: null,
        bat_buoc: true,
        position: 0,
      },
    ],
  },
  {
    ma_section: "TPT",
    ten: "Tủ phụ trợ",
    mo_ta: null,
    position: 1,
    items: [
      {
        item_code: "TPT-TT",
        ten: "Tình trạng tủ",
        huong_dan: null,
        result_kind: "dat_khong_dat",
        don_vi: null,
        tieu_chuan: null,
        tuy_chon: null,
        bat_buoc: false,
        position: 0,
      },
    ],
  },
];

afterEach(() => cleanup());

describe("ChecklistRenderer", () => {
  it("hiển thị tên section, hướng dẫn, đơn vị và tiêu chuẩn", () => {
    render(<ChecklistRenderer sections={SECTIONS} values={{}} onChange={() => {}} />);
    expect(screen.getByText("Cảm biến")).toBeTruthy();
    expect(screen.getByText("Tủ phụ trợ")).toBeTruthy();
    expect(screen.getByText("Đo bằng đồng hồ vạn năng")).toBeTruthy();
    expect(screen.getByText("V")).toBeTruthy();
    expect(screen.getByText(/TC: 4.5–5.5/)).toBeTruthy();
  });

  it("nhập giá trị đo gọi onChange với chuỗi thô", () => {
    const onChange = vi.fn();
    render(<ChecklistRenderer sections={SECTIONS} values={{}} onChange={onChange} />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "5.1" } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ "CB-DIEN-AP": expect.objectContaining({ gia_tri_so: "5.1" }) }),
    );
  });

  it("báo lỗi khi Không đạt mà thiếu hành động (showErrors)", () => {
    render(
      <ChecklistRenderer
        sections={SECTIONS}
        values={{ "TPT-TT": { ket_qua: "khong_dat" } }}
        onChange={() => {}}
        showErrors
      />,
    );
    const alerts = screen.getAllByRole("alert").map((a) => a.textContent ?? "");
    expect(alerts.some((t) => t.includes("hành động"))).toBe(true);
  });

  it("readOnly ⇒ input bị disable", () => {
    render(<ChecklistRenderer sections={SECTIONS} values={{}} readOnly />);
    const input = screen.getByRole("spinbutton") as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });
});
