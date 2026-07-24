// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { ExpiringWidget } from "../ExpiringWidget";
import type { ExpiringRow } from "@/lib/mirats/db-expiring";

afterEach(() => cleanup());

const rows: ExpiringRow[] = [
  { loai: "bao_hanh", thiet_bi_id: "tb-1", ten: "Máy UHF A", ngay_het_han: "2026-07-20", so_ngay_con_lai: 10 },
  { loai: "giay_phep", thiet_bi_id: "tb-2", ten: "GP khai thác B", ngay_het_han: "2026-08-10", so_ngay_con_lai: 45 },
  { loai: "bao_hanh", thiet_bi_id: "tb-3", ten: "Switch C", ngay_het_han: "2026-09-20", so_ngay_con_lai: 80 },
  { loai: "giay_phep", thiet_bi_id: "tb-4", ten: "GP D", ngay_het_han: "2026-12-01", so_ngay_con_lai: 150 },
];

describe("ExpiringWidget — danh sách sắp hết hạn theo ngưỡng", () => {
  it("mặc định 30 ngày: chỉ liệt kê mục trong ngưỡng", () => {
    render(<ExpiringWidget rows={rows} />);
    const list = screen.getByRole("list", { name: /sắp hết hạn/i });
    expect(within(list).getByText("Máy UHF A")).toBeTruthy();
    expect(within(list).queryByText("GP khai thác B")).toBeNull();
  });

  it("đổi ngưỡng 90 ngày: hiện thêm mục trong 60/90", () => {
    render(<ExpiringWidget rows={rows} />);
    fireEvent.click(screen.getByRole("tab", { name: "90 ngày" }));
    const list = screen.getByRole("list", { name: /sắp hết hạn/i });
    expect(within(list).getByText("Máy UHF A")).toBeTruthy();
    expect(within(list).getByText("GP khai thác B")).toBeTruthy();
    expect(within(list).getByText("Switch C")).toBeTruthy();
    expect(within(list).queryByText("GP D")).toBeNull();
  });

  it("phân loại nhãn bảo hành / giấy phép", () => {
    render(<ExpiringWidget rows={rows} />);
    fireEvent.click(screen.getByRole("tab", { name: "90 ngày" }));
    expect(screen.getAllByText("Bảo hành").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Giấy phép").length).toBeGreaterThan(0);
  });

  it("rỗng: hiện thông báo không có mục nào", () => {
    render(<ExpiringWidget rows={[]} />);
    expect(screen.getByText(/không có mục nào/i)).toBeTruthy();
  });
});
