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

describe("StandardTable Virtualization Integrity", () => {
  it("should render correct rows after sorting in virtual mode", async () => {
    const getRowId = (r: Row) => r.id;
    
    // In JSDOM, virtualization relies on measurements that are often 0.
    // StandardTable has special isTest logic for overscan and initialRect.
    
    render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-virtual-sort"
        virtualizerOptions={{ enabled: true }}
      />
    );

    // Initial order: A, B, C. 
    // Since overscan is 100 in test mode, it should render even if measurement is tricky.
    const cells = screen.getAllByRole("cell");
    expect(cells[0].textContent).toBe("Alpha");

    // Click sort Name -> desc
    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader); // asc
    fireEvent.click(nameHeader); // desc
    
    // Re-query cells
    const cellsAfterSort = screen.getAllByRole("cell");
    
    // If the fix works, index 0 is C (Charlie). 
    // If bug exists (using rows[index]), it would stay A (Alpha).
    expect(cellsAfterSort[0].textContent).toBe("Charlie");
  });
});


