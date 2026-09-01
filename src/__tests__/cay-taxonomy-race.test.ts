import { describe, it, expect } from "vitest";
import { resolvePhanLoai, resolveNhom, type DbTaxonomy } from "@/lib/mirats/db-taxonomy";

/**
 * Hồi quy: trước đây danh sách thiết bị của Cây phân cấp được "nướng" kết quả
 * giải mã taxonomy vào dữ liệu cache, trong khi queryKey không phản ánh phiên
 * bản taxonomy. Hệ quả: lần tải đầu (taxonomy về sau) cây hiển thị
 * "Chưa phân loại" cho tới khi reload trang.
 *
 * Bài test dưới đây kiểm tra hợp đồng của tầng dẫn xuất: cùng một bản ghi thô,
 * khi taxonomy thay đổi thì kết quả giải mã phải thay đổi theo.
 */
function mkTaxonomy(partial: Partial<DbTaxonomy>): DbTaxonomy {
  return {
    plList: [],
    plNameMap: new Map(),
    lvNameMap: new Map(),
    htNameMap: new Map(),
    htMaMap: new Map(),
    nhomNameMap: new Map(),
    nhomMaMap: new Map(),
    donViList: [],
    lvList: [],
    nhomList: [],
    htList: [],
    viTriList: [],
    trangThaiList: [],
    devices: [],
    ...partial,
  } as DbTaxonomy;
}

/** Bản sao tối giản của mapper dẫn xuất trong route Cây phân cấp. */
function derive(row: { phan_loai_id: string; nhom_he_thong_id: string }, taxo?: DbTaxonomy) {
  return {
    _pl: resolvePhanLoai(row.phan_loai_id, taxo).id,
    _nhKey: resolveNhom(row.nhom_he_thong_id, taxo).ma,
  };
}

describe("Cây phân cấp — giải mã taxonomy ở tầng dẫn xuất", () => {
  const row = { phan_loai_id: "pl-1", nhom_he_thong_id: "nh-1" };

  it("chưa có taxonomy thì không khẳng định phân loại thật", () => {
    const out = derive(row, undefined);
    expect(out._pl).toBeTruthy();
  });

  it("khi taxonomy sẵn sàng, cùng dữ liệu thô cho ra phân loại đúng", () => {
    const taxo = mkTaxonomy({
      plList: [{ id: "pl-1", ten: "Nhóm 1", tone: "", thu_tu: 1 }],
      plNameMap: new Map([["pl-1", "Nhóm 1"]]),
      nhomList: [{ id: "nh-1", ma: "VHF", ten: "VHF", phanLoaiId: "pl-1", thu_tu: 1 }],
      nhomNameMap: new Map([["nh-1", "VHF"]]),
      nhomMaMap: new Map([["nh-1", "VHF"]]),
    });
    const out = derive(row, taxo);
    expect(out._pl).toBe("pl-1");
    expect(out._nhKey).toBe("VHF");
  });

  it("taxonomy đổi thì kết quả dẫn xuất đổi theo (không bị đóng băng trong cache)", () => {
    const before = derive(row, mkTaxonomy({}));
    const after = derive(
      row,
      mkTaxonomy({
        plList: [{ id: "pl-1", ten: "Nhóm 1", tone: "", thu_tu: 1 }],
        plNameMap: new Map([["pl-1", "Nhóm 1"]]),
        nhomList: [{ id: "nh-1", ma: "VHF", ten: "VHF", phanLoaiId: "pl-1", thu_tu: 1 }],
        nhomMaMap: new Map([["nh-1", "VHF"]]),
      }),
    );
    expect(after._nhKey).not.toBe(before._nhKey);
  });
});
