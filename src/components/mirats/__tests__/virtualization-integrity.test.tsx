// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, within } from "@testing-library/react";
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
  { key: "name", header: "Name", value: (r) => r.name },
];

describe("StandardTable Virtualization Integrity (RED Test)", () => {
  it("should render correct rows after sorting in virtual mode", async () => {
    const getRowId = (r: Row) => r.id;
    
    // Lưu ý: Trong StandardTable.tsx, virtualization được bật nếu virtualizerOptions?.enabled === true
    // VÀ nó sẽ dùng visibleRows[virtualRow.index] (đã sửa ở lượt trước) hoặc rows[virtualRow.index] (nếu chưa sửa).
    
    const { container } = render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-virtual-sort"
        virtualizerOptions={{ enabled: true }}
      />
    );

    // Kiểm tra render hàng
    // Vì virtualization trong test có initialRect lớn, nó sẽ render các dòng.
    // Nếu vẫn không thấy cell, có thể do gated hoặc requireFilterToShow.
    
    const cells = screen.getAllByRole("cell");
    expect(cells[0].textContent).toBe("Alpha");

    // Click sort Name -> desc (Alpha, Bravo, Charlie -> Charlie, Bravo, Alpha)
    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc
    
    const cellsAfterSort = screen.getAllByRole("cell");
    
    // Nếu bug chưa sửa, nó sẽ lấy rows[virtualRow.index] -> vẫn là "Alpha" ở index 0
    // Nếu bug đã sửa, nó lấy sortedRows[virtualRow.index] -> "Charlie"
    expect(cellsAfterSort[0].textContent).toBe("Charlie");
  });
});

