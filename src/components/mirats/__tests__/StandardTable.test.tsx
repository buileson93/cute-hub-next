// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { StandardTable, type StdColumn } from "../StandardTable";
import { parseMinW } from "@/lib/mirats/ui/table-geometry";

// Mock ResizeObserver properly for Vitest/JSDOM
vi.stubGlobal('ResizeObserver', class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
});

afterEach(() => cleanup());

interface Row { id: string; ten: string; nhom: string }
const rows: Row[] = [
  { id: "1", ten: "Sản phẩm A", nhom: "Nhóm X" },
  { id: "2", ten: "Sản phẩm B", nhom: "Nhóm Y" },
];
const columns: StdColumn<Row>[] = [
  { key: "ten", label: "Tên", value: (r) => r.ten, filter: "text" },
  { key: "nhom", label: "Nhóm", value: (r) => r.nhom, filter: "cat" },
];

function baseProps() {
  return {
    tableKey: "test-tbl",
    columns,
    rows,
    getRowId: (r: Row) => r.id,
    requireFilterToShow: false as const,
  };
}

describe("StandardTable — Hiển thị và Trạng thái", () => {
  it("render dữ liệu chính xác", () => {
    render(<StandardTable<Row> {...baseProps()} />);
    expect(screen.getByText("Sản phẩm A")).not.toBeNull();
    expect(screen.getByText("Sản phẩm B")).not.toBeNull();
  });

  it("hiển thị errorContent khi có lỗi", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        trangThai={{ loi: "Lỗi kết nối" }}
        errorContent={<div data-testid="err">LỖI_HỆ_THỐNG</div>}
      />,
    );
    expect(screen.getByTestId("err")).not.toBeNull();
  });

  it("hiển thị loadingContent khi đang tải", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        trangThai={{ dangTai: true }}
        loadingContent={<div data-testid="ld">ĐANG_TẢI...</div>}
      />,
    );
    expect(screen.getByTestId("ld")).not.toBeNull();
  });
});

describe("StandardTable — Tương tác và Lọc", () => {
  it("hỗ trợ selectable và chọn dòng", () => {
    const setSelected = vi.fn();
    const selected = new Set<string>();
    
    render(
      <StandardTable<Row> 
        {...baseProps()} 
        selectable={true} 
        selected={selected}
        setSelected={setSelected}
      />
    );
    
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); 
    expect(setSelected).toHaveBeenCalled();
  });

  it("lọc text hoạt động đúng", async () => {
    render(<StandardTable<Row> {...baseProps()} />);
    
    // Mở bộ lọc
    const filterButtons = screen.getAllByRole("button").filter(b => 
      b.querySelector(".lucide-funnel") || 
      b.querySelector(".lucide-filter") ||
      b.innerHTML.includes('lucide-funnel') ||
      b.innerHTML.includes('lucide-filter')
    );
    fireEvent.click(filterButtons[0]);
    
    // Đợi dropdown hiển thị
    const searchInput = await screen.findByPlaceholderText("Tìm nội dung...");
    fireEvent.change(searchInput, { target: { value: "Sản phẩm A" } });
    
    expect(screen.getByText("Sản phẩm A")).not.toBeNull();
    expect(screen.queryByText("Sản phẩm B")).toBeNull();
  });


  it("áp dụng defaultHidden cho cột", () => {
    const colsWithHidden: StdColumn<Row>[] = [
      { key: "ten", label: "Tên", value: (r) => r.ten },
      { key: "nhom", label: "Nhóm", value: (r) => r.nhom, defaultHidden: true },
    ];
    
    render(<StandardTable<Row> {...baseProps()} columns={colsWithHidden} />);
    
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts).not.toContain("Nhóm");
  });
});

describe("StandardTable — Nâng cấp Độ rộng", () => {
  it("parse chính xác minW từ chuỗi Tailwind", () => {
    expect(parseMinW("min-w-[150px]")).toBe(150);
    expect(parseMinW("min-w-[80px]")).toBe(80);
    expect(parseMinW("120px")).toBe(120);
    expect(parseMinW(undefined)).toBe(100);
  });

  it("render colgroup với các độ rộng tương ứng", () => {
    const { container } = render(
      <StandardTable<Row>
        {...baseProps()}
        columns={[
          { key: "ten", label: "Tên", minW: "min-w-[60px]" },
          { key: "nhom", label: "Nhóm", width: 250, minWidth: 200 }
        ]} 
      />
    );
    const cols = container.querySelectorAll("colgroup col");
    // col[0] là checkbox nếu selectable, nhưng ở đây baseProps có selectable không? Mặc định không.
    expect(cols[0].getAttribute("style")).toContain("width: 60px");
    expect(cols[1].getAttribute("style")).toContain("width: 250px");
  });
});
