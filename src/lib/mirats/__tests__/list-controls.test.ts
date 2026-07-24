import { describe, it, expect } from "vitest";
import {
  locVaSapXep,
  chuanHoaTimKiem,
  tongSoTrang,
  DEFAULT_LIST_STATE,
  type ListControlsState,
} from "@/lib/mirats/ui/list-controls";

type Row = { id: number; ten: string; loai: string; so: number };

const rows: Row[] = [
  { id: 1, ten: "Máy tính Dell", loai: "PC", so: 3 },
  { id: 2, ten: "Switch Cisco", loai: "SWITCH", so: 10 },
  { id: 3, ten: "Máy UHF Motorola", loai: "UHF", so: 1 },
  { id: 4, ten: "Máy in HP", loai: "PC", so: 7 },
  { id: 5, ten: "Đèn báo hiệu", loai: "OTHER", so: 5 },
];

const cfg = {
  timKiem: (r: Row) => `${r.ten} ${r.loai}`,
  loc: {
    loai: (r: Row, v: unknown) => {
      if (v == null || v === "" || v === "all") return true;
      if (Array.isArray(v)) return v.length === 0 || v.includes(r.loai);
      return r.loai === v;
    },
  },
  sort: {
    so: (a: Row, b: Row) => a.so - b.so,
    ten: (a: Row, b: Row) => a.ten.localeCompare(b.ten, "vi"),
  },
};

const s = (o: Partial<ListControlsState> = {}): ListControlsState => ({
  ...DEFAULT_LIST_STATE,
  ...o,
});

describe("chuanHoaTimKiem", () => {
  it("bỏ dấu và hạ về chữ thường", () => {
    expect(chuanHoaTimKiem("Máy UHF Motorola")).toBe("may uhf motorola");
    expect(chuanHoaTimKiem("Đèn báo hiệu")).toBe("den bao hieu");
  });
});

describe("locVaSapXep — search", () => {
  it("tìm không dấu, không phân biệt hoa/thường", () => {
    const { data, tong } = locVaSapXep(rows, s({ q: "may" }), cfg);
    expect(tong).toBe(3);
    expect(data.map((r) => r.id).sort()).toEqual([1, 3, 4]);
  });

  it("chuỗi rỗng → trả về tất cả", () => {
    const { tong } = locVaSapXep(rows, s({ q: "" }), cfg);
    expect(tong).toBe(5);
  });
});

describe("locVaSapXep — filter", () => {
  it("áp filter theo config", () => {
    const { data, tong } = locVaSapXep(rows, s({ filters: { loai: "PC" } }), cfg);
    expect(tong).toBe(2);
    expect(data.every((r) => r.loai === "PC")).toBe(true);
  });

  it("filter giá trị 'all' → không lọc", () => {
    const { tong } = locVaSapXep(rows, s({ filters: { loai: "all" } }), cfg);
    expect(tong).toBe(5);
  });

  it("filter mảng rỗng → không lọc", () => {
    const { tong } = locVaSapXep(rows, s({ filters: { loai: [] } }), cfg);
    expect(tong).toBe(5);
  });
});

describe("locVaSapXep — sort", () => {
  it("sort số tăng dần", () => {
    const { data } = locVaSapXep(
      rows,
      s({ sort: { field: "so", dir: "asc" }, kichThuoc: 100 }),
      cfg,
    );
    expect(data.map((r) => r.so)).toEqual([1, 3, 5, 7, 10]);
  });

  it("sort số giảm dần", () => {
    const { data } = locVaSapXep(
      rows,
      s({ sort: { field: "so", dir: "desc" }, kichThuoc: 100 }),
      cfg,
    );
    expect(data.map((r) => r.so)).toEqual([10, 7, 5, 3, 1]);
  });
});

describe("locVaSapXep — pagination", () => {
  it("lát cắt đúng theo trang & kichThuoc", () => {
    const { data, tong } = locVaSapXep(
      rows,
      s({ sort: { field: "so", dir: "asc" }, trang: 2, kichThuoc: 2 }),
      cfg,
    );
    expect(tong).toBe(5);
    expect(data.map((r) => r.so)).toEqual([5, 7]);
  });

  it("trang vượt tổng → mảng rỗng, tong vẫn đúng", () => {
    const { data, tong } = locVaSapXep(rows, s({ trang: 10, kichThuoc: 2 }), cfg);
    expect(data).toEqual([]);
    expect(tong).toBe(5);
  });
});

describe("tongSoTrang", () => {
  it("làm tròn lên", () => {
    expect(tongSoTrang(5, 2)).toBe(3);
    expect(tongSoTrang(0, 20)).toBe(1);
    expect(tongSoTrang(20, 20)).toBe(1);
    expect(tongSoTrang(21, 20)).toBe(2);
  });
});
