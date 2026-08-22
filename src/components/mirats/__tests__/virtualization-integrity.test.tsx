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
  { key: "name", header: "Name", label: "Name", value: (r) => r.name, sortable: true },
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

    // Dùng data-index vì role cell có vẻ không được JSDOM nhận diện tốt qua shadcn components
    // Hoặc kiểm tra text trực tiếp trong tbody
    const alpha = screen.getByText("Alpha");
    expect(alpha).toBeDefined();

    const nameHeader = screen.getByLabelText("Sắp xếp theo Name");
    fireEvent.click(nameHeader); // asc (Alpha, Bravo, Charlie)
    fireEvent.click(nameHeader); // desc (Charlie, Bravo, Alpha)
    
    // Sau khi sort desc, Charlie phải ở đầu
    const body = document.querySelector('tbody');
    const firstRow = body?.querySelector('tr[data-index="0"]');
    expect(firstRow?.textContent).toContain("Charlie");
  });

  it("should be able to render rows in virtual mode with forced dimensions", () => {
    const getRowId = (r: Row) => r.id;
    
    render(
      <StandardTable<Row>
        rows={rows}
        columns={columns}
        getRowId={getRowId}
        tableKey="test-virtual-integrity"
        virtualizerOptions={{ enabled: true }}
      />
    );

    // Với isTest fix, virtual rows nên render ngay
    const alpha = screen.queryByText("Alpha");
    expect(alpha).not.toBeNull();
    
    const body = document.querySelector('tbody');
    const row0 = body?.querySelector('tr[data-index="0"]');
    expect(row0?.textContent).toContain("Alpha");
  });
});
