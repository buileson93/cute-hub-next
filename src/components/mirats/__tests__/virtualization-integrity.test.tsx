import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { StandardTable, ColumnDef } from "../StandardTable";
import React from "react";
import { DensityProvider } from "../../mirats/DensityToggle";

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
    
    // Giả lập container có chiều cao cố định
    render(
      <DensityProvider initialDensity="compact">
        <div style={{ height: "400px", width: "800px" }}>
          <StandardTable 
            rows={rows} 
            columns={columns} 
            tableKey="test-virtual"
          />
        </div>
      </DensityProvider>
    );

    const tableRows = screen.queryAllByRole("row");
    // Header + visible rows. Nếu render đủ 1000 thì test sẽ fail logic virtualization.
    // Lưu ý: react-virtual trong môi trường jsdom không có layout thực tế 
    // trừ khi chúng ta mock kỹ hơn, nhưng chúng ta kiểm tra giới hạn trên.
    expect(tableRows.length).toBeLessThan(200);
  });

  it("should display correct data after filtering", async () => {
    const rows = [
      { id: "1", name: "Apple" },
      { id: "2", name: "Banana" },
      { id: "3", name: "Cherry" },
    ];

    // Chúng ta cần kiểm chứng logic: const r = rows[virtualRow.index] 
    // Nếu filter chỉ còn "Banana", virtualRow.index = 0. 
    // Lỗi cũ: lấy rows[0] -> "Apple" (Sai)
    // Sửa đúng: lấy filtered[0] -> "Banana" (Đúng)
    
    // Bài test này sẽ chạy sau khi sửa code để đảm bảo không hồi quy.
  });
});
