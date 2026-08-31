import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// ============================================================================
// Chốt chặn hồi quy: cây Hệ thống tài sản KHÔNG được xoá trực tiếp bảng
// `thiet_bi`. Mọi thao tác xoá tài sản phải đi qua dịch vụ an toàn
// (xoaThietBiAnToan → purge_thiet_bi + ngừng khai thác) để không mất lý lịch.
// ============================================================================

const FILES = [
  join(process.cwd(), "src", "routes", "_app.he-thong.cay.tsx"),
  join(process.cwd(), "src", "components", "mirats", "he-thong-cay", "mutations.ts"),
];

describe("cây hệ thống — không xoá trực tiếp thiet_bi", () => {
  const src = FILES.map((f) => readFileSync(f, "utf8")).join("\n");

  it('không gọi supabase.from("thiet_bi").delete()', () => {
    // Bắt mọi biến thể khoảng trắng: from("thiet_bi") ... .delete()
    const rx = /from\(\s*["']thiet_bi["']\s*\)\s*\.delete\s*\(/;
    expect(rx.test(src)).toBe(false);
  });

  it("dùng dịch vụ xoá an toàn", () => {
    expect(src.includes("xoaThietBiAnToan")).toBe(true);
  });
});
