// ============================================================================
// Round-trip All-in-one: DỰNG file .xlsx nhiều sheet bằng ExcelJS rồi ĐỌC lại
// bằng parseAllInOneXlsx. Kiểm chứng:
//   * đọc đúng nhiều sheet theo thứ tự ALLINONE_LAYERS,
//   * ánh xạ header (theo nhãn HOẶC key, bỏ dấu) về key trường CSDL,
//   * cột lạ rơi vào `unmapped`, ô trống bị loại khỏi dòng,
//   * dòng rỗng hoàn toàn bị bỏ qua.
// Không đụng CSDL (chỉ parse phía client).
// ============================================================================

import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { ALLINONE_LAYERS, parseAllInOneXlsx } from "@/lib/mirats/allinone-template";
import { findEntity } from "@/lib/mirats/import-config";

function fakeFile(buf: ArrayBuffer): File {
  // parseAllInOneXlsx chỉ cần .arrayBuffer(); tránh phụ thuộc polyfill File.
  return { arrayBuffer: async () => buf } as unknown as File;
}

async function buildWorkbook(): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();

  // Sheet 1: Phân loại (danh mục nền) — dùng NHÃN làm header + 1 cột lạ.
  const phanLoai = findEntity("danh_muc", "dm_phan_loai")!;
  const s1 = wb.addWorksheet("1. Phân loại");
  s1.addRow([...phanLoai.fields.map((f) => f.label), "Cột lạ không map"]);
  s1.addRow(["PL1", "Nhóm 1", "mô tả 1", "1", "rác"]);
  s1.addRow([]); // dòng rỗng → phải bị bỏ qua
  s1.addRow(["PL2", "Nhóm 2", "", "", ""]); // ô trống → loại khỏi object

  // Sheet cuối: Tài sản — dùng KEY làm header (kiểm ánh xạ theo key).
  const thietBi = findEntity("thiet_bi")!;
  const sLast = wb.addWorksheet("12. Tài sản");
  sLast.addRow(thietBi.fields.map((f) => f.key));
  const tbRow = thietBi.fields.map((f) => {
    if (f.key === "ma_thiet_bi") return "TB1";
    if (f.key === "ten_thiet_bi") return "Máy A";
    if (f.key === "he_thong") return "HT-01";
    return "";
  });
  sLast.addRow(tbRow);

  const buf = await wb.xlsx.writeBuffer();
  return buf as ArrayBuffer;
}

describe("parseAllInOneXlsx — round-trip nhiều sheet", () => {
  it("đọc đúng các sheet theo đúng thứ tự lớp đã định nghĩa", async () => {
    const parsed = await parseAllInOneXlsx(fakeFile(await buildWorkbook()));
    // Chỉ 2 sheet tồn tại trong file → parse trả về đúng 2 lớp, theo thứ tự lớp.
    const sheets = parsed.map((p) => p.layer.sheet);
    expect(sheets).toEqual(["1. Phân loại", "12. Tài sản"]);
  });

  it("ánh xạ header theo NHÃN → key; cột lạ vào unmapped", async () => {
    const parsed = await parseAllInOneXlsx(fakeFile(await buildWorkbook()));
    const pl = parsed.find((p) => p.layer.catTable === "dm_phan_loai")!;
    expect(pl.unmapped).toContain("Cột lạ không map");
    expect(pl.rows[0]).toMatchObject({ ma: "PL1", ten: "Nhóm 1", mo_ta: "mô tả 1", thu_tu: "1" });
  });

  it("ô trống bị loại khỏi dòng; dòng rỗng bị bỏ qua", async () => {
    const parsed = await parseAllInOneXlsx(fakeFile(await buildWorkbook()));
    const pl = parsed.find((p) => p.layer.catTable === "dm_phan_loai")!;
    expect(pl.rows).toHaveLength(2); // PL1, PL2 (dòng rỗng bị bỏ)
    // PL2 chỉ có ma+ten (mo_ta/thu_tu trống → không có key).
    expect(pl.rows[1]).toEqual({ ma: "PL2", ten: "Nhóm 2" });
  });

  it("ánh xạ header theo KEY (sheet Tài sản)", async () => {
    const parsed = await parseAllInOneXlsx(fakeFile(await buildWorkbook()));
    const tb = parsed.find((p) => p.layer.entity === "thiet_bi")!;
    expect(tb.rows).toHaveLength(1);
    expect(tb.rows[0]).toEqual({ ma_thiet_bi: "TB1", ten_thiet_bi: "Máy A", he_thong: "HT-01" });
  });

  it("ALLINONE_LAYERS ổn định (17 lớp; Tài sản trước các lớp vận hành)", () => {
    expect(ALLINONE_LAYERS).toHaveLength(17);
    const idxTB = ALLINONE_LAYERS.findIndex((l) => l.entity === "thiet_bi");
    expect(idxTB).toBeGreaterThan(-1);
    // Các lớp vận hành phải nằm sau Tài sản.
    expect(ALLINONE_LAYERS.findIndex((l) => l.entity === "bao_tri")).toBeGreaterThan(idxTB);
  });
});
