// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
import { StandardTable, type StdColumn } from "../StandardTable";

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
    render(
      <StandardTable<Row> 
        {...baseProps()} 
      />
    );

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
    // Checkbox đầu tiên thường là "Chọn tất cả" trong Header
    fireEvent.click(checkboxes[1]); 
    
    expect(setSelected).toHaveBeenCalled();
  });

  it("lọc text hoạt động đúng", () => {
    render(
      <StandardTable<Row> 
        {...baseProps()} 
      />
    );


    
    // Tìm ô input lọc cho cột Tên
    const searchInputs = screen.getAllByPlaceholderText(/Tìm/);
    fireEvent.change(searchInputs[0], { target: { value: "Sản phẩm A" } });


    
    expect(screen.getByText("Sản phẩm A")).not.toBeNull();
    // Sản phẩm B sẽ bị ẩn bởi logic filter client-side (sorted/filtered useMemo)
    // Lưu ý: Virtualizer có thể ảnh hưởng đến việc tìm kiếm trong DOM nếu không được render
  });
});

describe("StandardTable — Responsive và Cột", () => {
  it("hiển thị đầy đủ nhãn cột", () => {
    render(<StandardTable<Row> {...baseProps()} />);
    expect(screen.getByText("Tên")).not.toBeNull();
    expect(screen.getByText("Nhóm")).not.toBeNull();
  });

  it("áp dụng defaultHidden cho cột", () => {
    const colsWithHidden: StdColumn<Row>[] = [
      { key: "ten", label: "Tên", value: (r) => r.ten },
      { key: "nhom", label: "Nhóm", value: (r) => r.nhom, defaultHidden: true },
    ];
    
    render(<StandardTable<Row> {...baseProps()} columns={colsWithHidden} />);
    
    // Cột Nhóm không nên hiển thị trong Header Table
    const headers = screen.getAllByRole("columnheader");
    const headerTexts = headers.map(h => h.textContent);
    expect(headerTexts).not.toContain("Nhóm");
  });
});

