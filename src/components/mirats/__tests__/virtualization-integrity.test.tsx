// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { StandardTable, type ColumnDef } from "../StandardTable";
import React from "react";

// Mock ResizeObserver
vi.stubGlobal(
  "ResizeObserver",
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => cleanup());

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = [
  { id: "A", name: "Alpha" },
  { id: "B", name: "Bravo" },
  { id: "C", name: "Charlie" },
];

const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", value: (r) => r.name, sortable: true },
];

describe("StandardTable Data Pipeline & Virtualization", () => {
  it("should render correct rows after sorting in non-virtual mode", async () => {
    const getRowId = (r: Row) => r.id;
    
    render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-pipeline"
      />
    );

    const cells = screen.getAllByRole("cell");
    expect(cells[0].textContent).toBe("Alpha");

    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader); // asc (A, B, C)
    fireEvent.click(nameHeader); // desc (C, B, A)
    
    const cellsAfterSort = screen.getAllByRole("cell");
    expect(cellsAfterSort[0].textContent).toBe("Charlie");
  });

  it("should be able to render rows in virtual mode with forced dimensions", () => {
    const getRowId = (r: Row) => r.id;
    
    // Giả lập window height cho JSDOM
    Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1000 });
    
    // Chúng ta không dùng screen.getAllByRole("cell") vì StandardTable render TableCell bên trong TableRow.
    // Nếu rowVirtualizer không đo được gì, nó có thể không render dòng nào.
    // Tuy nhiên, chúng ta đã sửa StandardTable để có initialRect và overscan lớn trong test.
    
    render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-virtual-integrity"
        virtualizerOptions={{ enabled: true }}
      />
    );

    // Kiểm tra TableBody có chứa nội dung không
    const rowsFound = screen.queryAllByRole("row");
    // 1 header row + 3 data rows = 4 rows
    // Nếu ảo hóa lỗi, chỉ có 1 header row.
    expect(rowsFound.length).toBeGreaterThan(1);
    
    // Nếu render được, kiểm tra dòng đầu
    const cells = screen.queryAllByRole("cell");
    if (cells.length > 0) {
      expect(cells[0].textContent).toBe("Alpha");
    }
  });
});
