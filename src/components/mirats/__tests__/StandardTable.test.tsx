// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StandardTable, type StdColumn } from "../StandardTable";

afterEach(() => cleanup());

interface Row { id: string; ten: string; nhom: string }
const rows: Row[] = [
  { id: "1", ten: "A", nhom: "x" },
  { id: "2", ten: "B", nhom: "y" },
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

describe("StandardTable — slot trạng thái", () => {
  it("render rows khi có dữ liệu", () => {
    render(<StandardTable<Row> {...baseProps()} />);
    expect(screen.getByText("A")).not.toBeNull();
    expect(screen.getByText("B")).not.toBeNull();
  });

  it("trangThai.loi → hiển errorContent", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        trangThai={{ loi: "Lỗi tải" }}
        errorContent={<div data-testid="err">CUSTOM_ERR</div>}
      />,
    );
    expect(screen.getByTestId("err")).not.toBeNull();
  });

  it("trangThai.loi (mặc định) → hiện chuỗi lỗi", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        trangThai={{ loi: "Lỗi X" }}
      />,
    );
    expect(screen.getByText("Lỗi X")).not.toBeNull();
  });

  it("trangThai.dangTai + rows rỗng → dùng loadingContent nếu có", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        trangThai={{ dangTai: true }}
        loadingContent={<div data-testid="ld">LOAD…</div>}
      />,
    );
    expect(screen.getByTestId("ld")).not.toBeNull();
  });

  it("rỗng + không loading/lỗi → dùng emptyContent nếu có", () => {
    render(
      <StandardTable<Row>
        {...baseProps()}
        rows={[]}
        emptyContent={<div data-testid="em">TRONG</div>}
      />,
    );
    expect(screen.getByTestId("em")).not.toBeNull();
  });

  it("rỗng + emptyText mặc định", () => {
    render(<StandardTable<Row> {...baseProps()} rows={[]} emptyText="Không có." />);
    expect(screen.getByText("Không có.")).not.toBeNull();
  });
});

describe("StandardTable — hồi quy cột", () => {
  it("hiển label các cột", () => {
    render(<StandardTable<Row> {...baseProps()} />);
    expect(screen.getByText("Tên")).not.toBeNull();
    expect(screen.getByText("Nhóm")).not.toBeNull();
  });
});
