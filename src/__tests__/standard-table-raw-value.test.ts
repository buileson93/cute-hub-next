import { describe, expect, it } from "vitest";
import { columnRawValue, type ColumnDef } from "@/components/mirats/StandardTable";

interface Row {
  id: string;
  ten: string;
  heThong: string | null;
  nhomHeThong: string | null;
  phanLoai: string | null;
  soLuong: number;
}

const row: Row = {
  id: "1",
  ten: "Bơm cao áp",
  heThong: "Hệ thống AWOS IMS Chu Lai",
  nhomHeThong: "AWOS",
  phanLoai: "Nhóm 1",
  soLuong: 0,
};

describe("columnRawValue — tách raw data khỏi dữ liệu hiển thị", () => {
  it("đọc đúng trường gốc khi cột chỉ khai báo key", () => {
    expect(columnRawValue({ key: "nhomHeThong" } as ColumnDef<Row>, row)).toBe("AWOS");
    expect(columnRawValue({ key: "phanLoai" } as ColumnDef<Row>, row)).toBe("Nhóm 1");
  });

  it("cột hiển thị gộp không ghi đè raw fields", () => {
    const display: ColumnDef<Row> = {
      key: "heThong",
      value: (r) => [r.heThong, r.nhomHeThong, r.phanLoai].filter(Boolean).join(" · "),
    };
    expect(columnRawValue(display, row)).toBe("Hệ thống AWOS IMS Chu Lai · AWOS · Nhóm 1");
    expect(row.nhomHeThong).toBe("AWOS");
    expect(row.phanLoai).toBe("Nhóm 1");
  });

  it("giữ nguyên giá trị hợp lệ 0 và phân biệt với thiếu dữ liệu", () => {
    expect(columnRawValue({ key: "soLuong" } as ColumnDef<Row>, row)).toBe(0);
    expect(columnRawValue({ key: "khongTonTai" } as ColumnDef<Row>, row)).toBeUndefined();
    expect(columnRawValue({ key: "nhomHeThong" } as ColumnDef<Row>, { ...row, nhomHeThong: null })).toBeNull();
  });
});
