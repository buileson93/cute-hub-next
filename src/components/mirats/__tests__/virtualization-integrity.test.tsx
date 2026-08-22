import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StandardTable, ColumnDef } from "../StandardTable";
import React from "react";

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

type Data = { id: string; name: string };
const columns: ColumnDef<Data>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
];

const generateRows = (count: number) => 
  Array.from({ length: count }, (_, i) => ({ id: `${i}`, name: `Item ${i}` }));

describe("StandardTable Virtualization Integrity", () => {
  it("should render only a subset of rows for large datasets", () => {
    const rows = generateRows(1000);
    
    render(
      <div style={{ height: "400px", width: "800px" }}>
        <StandardTable 
          rows={rows} 
          columns={columns} 
          tableKey="test-virtual"
        />
      </div>
    );

    const tableRows = screen.queryAllByRole("row");
    // Trong môi trường test thực tế, số lượng hàng sẽ ít hơn 1000 nếu virtualization hoạt động.
    expect(tableRows.length).toBeLessThan(1000);
  });
});
