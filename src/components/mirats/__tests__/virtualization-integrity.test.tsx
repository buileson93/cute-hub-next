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
    
    const { container } = render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-virtual-sort"
        virtualizerOptions={{ enabled: true }}
      />
    );

    // 1. Initial order: A, B, C. Index 0 should be A.
    // We check text content of the first row cell
    const cells = screen.getAllByRole("cell");
    // StandardTable renders cells in order. First cell of first row should be "Alpha"
    expect(cells[0].textContent).toBe("Alpha");

    // 2. Click sort on "Name" header (assuming it cycles to desc or we mock sort state)
    // Actually, let's pass initial sort state if supported, or simulate click.
    const nameHeader = screen.getByText("Name");
    fireEvent.click(nameHeader); // first click -> asc
    fireEvent.click(nameHeader); // second click -> desc
    
    // After desc sort, order should be C, B, A.
    // Virtualizer index 0 MUST point to C.
    // If the bug exists (using rows[index]), it will still point to A.
    const cellsAfterSort = screen.getAllByRole("cell");
    
    // THIS IS EXPECTED TO FAIL if bug is present
    expect(cellsAfterSort[0].textContent).toBe("Charlie");
  });

  it("should respect filters in virtual mode count and rendering", () => {
    // Test filtering "Alpha" out. 
    // If bug exists, count might be correct but items might be wrong.
  });
});
