// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup, fireEvent, act } from "@testing-library/react";
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
  it("should render rows even in virtual mode for tests", async () => {
    const getRowId = (r: Row) => r.id;
    
    // We use a container with explicit height to help JSDOM
    const { container } = render(
      <div style={{ height: '1000px', width: '1000px' }}>
        <StandardTable<Row>
          rows={rows}
          columns={columns}
          getRowId={getRowId}
          tableKey="test-virtual-integrity"
          virtualizerOptions={{ enabled: true }}
        />
      </div>
    );

    // Give it a tick to measure
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Check if Alpha is rendered. If virtualization is working in test, it should be there due to overscan/initialRect
    const body = container.querySelector('tbody');
    expect(body).not.toBeNull();
    
    // If virtualization is still failing to render in JSDOM, let's see what IS there
    console.log("TBODY HTML:", body?.innerHTML);
    
    const row0 = container.querySelector('tr[data-index="0"]');
    expect(row0).not.toBeNull();
    expect(row0?.textContent).toContain("Alpha");
  });

  it("should maintain data integrity after sorting", async () => {
    const getRowId = (r: Row) => r.id;
    
    const { container } = render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-sort-integrity"
        virtualizerOptions={{ enabled: true }}
      />
    );

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const nameHeader = screen.getByLabelText("Sắp xếp theo Name");
    
    // Sort Asc (Alpha, Bravo, Charlie)
    await act(async () => {
      fireEvent.click(nameHeader);
    });
    
    // Sort Desc (Charlie, Bravo, Alpha)
    await act(async () => {
      fireEvent.click(nameHeader);
    });

    const row0 = container.querySelector('tr[data-index="0"]');
    // If the fix display[virtualRow.index] works, index 0 must be Charlie
    expect(row0?.textContent).toContain("Charlie");
  });
});
