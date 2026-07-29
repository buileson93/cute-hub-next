// ============================================================================
// Xuất MẪU NHẬP LIỆU (.xlsx) cho tài sản — nhiều sheet liên kết nhau:
//
//  1) "① Hướng dẫn"      : ĐỊNH NGHĨA từng trường (ý nghĩa, kiểu dữ liệu, bắt
//                          buộc?, có kế thừa từ Model không) để tránh nhập sai.
//  2) "② Nhập liệu"      : dữ liệu đang lọc, cột theo cột đang hiển thị. Các ô
//                          danh mục có Data Validation (dropdown) để CHỌN.
//  3) "③ Model (kế thừa)": danh sách Model + P/N, Chủng loại, Nhà SX. Khi
//                          chọn Model ở sheet nhập liệu, các trường này được
//                          KẾ THỪA tự động — tra ở đây để đối chiếu.
//  4) "DanhMuc" (ẩn)     : nguồn dropdown cho các cột danh mục.
// ============================================================================

import ExcelJS from "exceljs";
import { supabase } from "@/integrations/backend/client";
import { entityById, fieldMap, type FieldDef } from "@/lib/mirats/import-config";

/** Header nhập liệu → bảng danh mục dùng để đổ dropdown. */
const DROPDOWN_SOURCES: Record<string, { table: string; col: "ma" | "ten" }> = {
  trang_thai: { table: "dm_trang_thai_thiet_bi", col: "ten" },
  nha_san_xuat: { table: "dm_nha_san_xuat", col: "ten" },
  nha_cung_cap: { table: "dm_nha_cung_cap", col: "ten" },
  vi_tri: { table: "dm_vi_tri", col: "ten" },
  he_thong: { table: "dm_he_thong", col: "ma" },
  model: { table: "dm_model", col: "ten" },
};

// ---------------------------------------------------------------------------
// NGUỒN SỰ THẬT: định nghĩa trường (label / kiểu / bắt buộc) lấy TRỰC TIẾP từ
// entity `thiet_bi` trong import-config → không thể lệch với giao diện nhập
// hàng loạt. Ở đây chỉ CHỒNG thêm phần "ghi chú" và cờ "kế thừa từ Model" để
// in ra sheet ① Hướng dẫn cho dễ hiểu.
// ---------------------------------------------------------------------------
const THIET_BI_ENTITY = entityById("thiet_bi");
const TB_FIELD_MAP = fieldMap(THIET_BI_ENTITY);

const KIND_LABEL: Record<FieldDef["kind"], string> = {
  text: "Chuỗi",
  int: "Số nguyên",
  num: "Số",
  date: "Ngày (YYYY-MM-DD)",
  ref: "Danh mục",
};

/** Ghi chú + cờ kế thừa cho từng trường (chồng lên định nghĩa gốc). */
export const FIELD_NOTES: Record<string, { note: string; inherited?: boolean }> = {
  ma_thiet_bi: { note: "Khoá định danh. Có sẵn mã = CẬP NHẬT tài sản đó; để trống = THÊM MỚI (hệ thống tự sinh mã)." },
  ten_thiet_bi: { note: "Tên hiển thị của tài sản / thành phần." },
  he_thong: { note: "CHỌN mã hệ thống từ dropdown. Quyết định tài sản thuộc hệ thống nào (để trống sẽ bị cảnh báo)." },
  model: { note: "CHỌN model. Khi chọn model → P/N, Chủng loại, Nhà sản xuất được KẾ THỪA tự động (xem sheet ③). Có thể để trống các trường kế thừa." },
  ma_serial: { note: "Riêng từng tài sản. Không bắt buộc nhưng KHÔNG được trùng." },
  p_n: { inherited: true, note: "KẾ THỪA từ Model. Chỉ điền khi cần ghi đè riêng cho tài sản này." },
  ma_tai_san_bravo: { note: "Mã tài sản kế toán (Bravo), nếu có." },
  thanh_phan: { note: "Tên thành phần con của tài sản (nếu là thành phần)." },
  nha_san_xuat: { inherited: true, note: "KẾ THỪA từ Model. Chọn từ dropdown chỉ khi ghi đè." },
  nha_cung_cap: { note: "CHỌN từ dropdown nhà cung cấp." },
  nam_san_xuat: { note: "VD: 2018. Chỉ nhập năm 4 chữ số." },
  nam_dua_vao_khai_thac: { note: "Năm đưa vào khai thác. VD: 2020." },
  ty_le_tuoi_tho: { note: "0–100. Phần trăm tuổi thọ đã dùng." },
  ngay_mua: { note: "Định dạng năm-tháng-ngày. VD: 2020-03-15." },
  han_bao_hanh: { note: "Định dạng năm-tháng-ngày." },
  trang_thai: { note: "CHỌN từ dropdown trạng thái chuẩn." },
  vi_tri: { note: "CHỌN vị trí địa lý từ dropdown." },
  phan_loai: { note: "Phân loại nội bộ của tài sản." },
  noi_quan_ly: { note: "Đơn vị/nơi quản lý tài sản." },
  ghi_chu: { note: "Ghi chú thêm (tự do)." },
};

type FieldMeta = { label: string; kind: string; required?: boolean; inherited?: boolean; note: string };

/** Định nghĩa 1 trường để in sheet hướng dẫn — dựng từ import-config + ghi chú. */
function fieldMeta(h: string): FieldMeta {
  const f = TB_FIELD_MAP[h];
  const ov = FIELD_NOTES[h];
  return {
    label: f?.label ?? h,
    kind: f ? KIND_LABEL[f.kind] : DROPDOWN_SOURCES[h] ? "Danh mục" : "Chuỗi",
    required: f?.required,
    inherited: ov?.inherited,
    note: ov?.note ?? "",
  };
}

export { DROPDOWN_SOURCES };


/** A, B, …, Z, AA… cho công thức Data Validation. */
function colLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

async function loadDistinct(table: string, col: "ma" | "ten"): Promise<string[]> {
  const { data, error } = await supabase.from(table as never).select(col).limit(5000);
  if (error) return [];
  const set = new Set<string>();
  for (const r of (data ?? []) as Array<Record<string, unknown>>) {
    const v = r[col];
    if (typeof v === "string" && v.trim()) set.add(v.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}

/** Bảng tham chiếu Model → các trường kế thừa (P/N, Loại TB, Nhà SX). */
type ModelRef = { ten: string; ma: string; pn: string; loai: string; nsx: string };
async function loadModelRefs(): Promise<ModelRef[]> {
  const [{ data: models }, { data: loai }, { data: nsx }] = await Promise.all([
    supabase.from("dm_model").select("ma, ten, p_n, loai_thiet_bi_id, nha_san_xuat_id").limit(5000),
    supabase.from("dm_loai_thiet_bi").select("id, ten").limit(5000),
    supabase.from("dm_nha_san_xuat").select("id, ten").limit(5000),
  ]);
  const loaiMap = new Map((loai ?? []).map((r: Record<string, unknown>) => [r.id as string, r.ten as string]));
  const nsxMap = new Map((nsx ?? []).map((r: Record<string, unknown>) => [r.id as string, r.ten as string]));
  return ((models ?? []) as Array<Record<string, unknown>>)
    .map((m) => ({
      ten: (m.ten as string) ?? "",
      ma: (m.ma as string) ?? "",
      pn: (m.p_n as string) ?? "",
      loai: loaiMap.get(m.loai_thiet_bi_id as string) ?? "",
      nsx: nsxMap.get(m.nha_san_xuat_id as string) ?? "",
    }))
    .filter((m) => m.ten)
    .sort((a, b) => a.ten.localeCompare(b.ten, "vi"));
}

export type ExportTemplateArgs = {
  headers: string[];
  rows: string[][];
  fileName: string;
};

/** Tạo & tải file .xlsx mẫu nhập liệu: định nghĩa trường + dropdown + tra Model. */
export async function exportDeviceTemplateXlsx({ headers, rows, fileName }: ExportTemplateArgs) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "MIRATS";
  wb.created = new Date();

  // Nạp song song: danh mục dropdown + bảng tham chiếu Model.
  const dmHeaders = headers.filter((h) => DROPDOWN_SOURCES[h]);
  const dmLists: Record<string, string[]> = {};
  const [, modelRefs] = await Promise.all([
    Promise.all(
      dmHeaders.map(async (h) => {
        const src = DROPDOWN_SOURCES[h];
        dmLists[h] = await loadDistinct(src.table, src.col);
      }),
    ),
    loadModelRefs(),
  ]);

  const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  // ---- ① Sheet HƯỚNG DẪN / ĐỊNH NGHĨA TRƯỜNG ----
  const guide = wb.addWorksheet("① Hướng dẫn");
  guide.getCell("A1").value = "HƯỚNG DẪN NHẬP LIỆU THIẾT BỊ — định nghĩa các trường ở sheet ② Nhập liệu";
  guide.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF1E3A8A" } };
  guide.mergeCells("A1:F1");
  guide.getCell("A2").value =
    "• Ô nền vàng = trường bắt buộc.  • “Danh mục” = bấm mũi tên CHỌN, đừng gõ tay.  • Trường KẾ THỪA để trống sẽ tự lấy theo Model (xem sheet ③).";
  guide.getCell("A2").font = { italic: true, color: { argb: "FF64748B" } };
  guide.mergeCells("A2:F2");

  const gHead = ["Tên cột (trong file)", "Ý nghĩa", "Kiểu dữ liệu", "Bắt buộc", "Kế thừa từ Model", "Ghi chú"];
  const gHeaderRow = guide.addRow([]); // row 3 spacer
  guide.addRow(gHead);
  const gHeaderIdx = 4;
  const gr = guide.getRow(gHeaderIdx);
  gr.font = { bold: true };
  gr.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    c.alignment = { vertical: "middle" };
    c.border = border;
  });
  void gHeaderRow;
  for (const h of headers) {
    const m = fieldMeta(h);
    const row = guide.addRow([
      h,
      m?.label ?? h,
      m?.kind ?? (DROPDOWN_SOURCES[h] ? "Danh mục" : "Chuỗi"),
      m?.required ? "✔ Bắt buộc" : "",
      m?.inherited ? "✔ Kế thừa" : "",
      m?.note ?? "",
    ]);
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((c) => (c.border = border));
    if (m?.required) row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
    if (m?.inherited) row.getCell(5).font = { color: { argb: "FF7C3AED" }, bold: true };
  }
  guide.getColumn(1).width = 22;
  guide.getColumn(2).width = 22;
  guide.getColumn(3).width = 20;
  guide.getColumn(4).width = 12;
  guide.getColumn(5).width = 16;
  guide.getColumn(6).width = 60;
  guide.views = [{ state: "frozen", ySplit: gHeaderIdx }];

  // ---- Sheet danh mục ẩn (nguồn dropdown) ----
  const dmSheet = wb.addWorksheet("DanhMuc");
  const dmColOf: Record<string, number> = {};
  dmHeaders.forEach((h, i) => {
    const colIdx = i + 1;
    dmColOf[h] = colIdx;
    dmSheet.getCell(1, colIdx).value = h;
    dmSheet.getColumn(colIdx).width = 26;
    dmLists[h].forEach((v, r) => {
      dmSheet.getCell(r + 2, colIdx).value = v;
    });
  });
  dmSheet.state = "hidden";

  // ---- ② Sheet NHẬP LIỆU ----
  const ws = wb.addWorksheet("② Nhập liệu");
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((c, col) => {
    const h = headers[col - 1];
    const required = fieldMeta(h).required;
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: required ? "FFFEF08A" : "FFE8EEF7" } };
    c.alignment = { vertical: "middle" };
    c.border = border;
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) ws.addRow(r);

  headers.forEach((h, i) => {
    const w = Math.max(h.length + 6, (fieldMeta(h).label.length ?? 0) + 6);
    ws.getColumn(i + 1).width = Math.min(Math.max(w, 12), 40);
  });

  // ---- Data validation (dropdown) cho các cột có danh mục ----
  const lastDataRow = Math.min(Math.max(rows.length + 1, 300), rows.length + 300);
  headers.forEach((h, i) => {
    const list = dmLists[h];
    if (!list || list.length === 0) return;
    const dmCol = colLetter(dmColOf[h]);
    const formulae = [`DanhMuc!$${dmCol}$2:$${dmCol}$${list.length + 1}`];
    const excelCol = colLetter(i + 1);
    (ws as unknown as { dataValidations: { add: (r: string, v: unknown) => void } }).dataValidations.add(`${excelCol}2:${excelCol}${lastDataRow}`, {
      type: "list",
      allowBlank: true,
      formulae,
      showErrorMessage: true,
      errorStyle: "warning",
      errorTitle: "Giá trị ngoài danh mục",
      error: "Nên chọn giá trị có sẵn trong danh mục để tránh sai lệch. Bỏ trống = giữ nguyên.",
    });
  });

  // ---- ③ Sheet MODEL (tham chiếu kế thừa) ----
  const ms = wb.addWorksheet("③ Model (kế thừa)");
  ms.getCell("A1").value = "TRA CỨU MODEL — chọn Model ở sheet ② thì các trường dưới được kế thừa tự động";
  ms.getCell("A1").font = { bold: true, size: 12, color: { argb: "FF7C3AED" } };
  ms.mergeCells("A1:E1");
  ms.addRow([]);
  const mHead = ["Model (tên)", "Mã model", "P/N (kế thừa)", "Chủng loại (kế thừa)", "Nhà sản xuất (kế thừa)"];
  ms.addRow(mHead);
  const mHeaderIdx = 3;
  const mr = ms.getRow(mHeaderIdx);
  mr.font = { bold: true };
  mr.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDE9FE" } };
    c.border = border;
  });
  for (const m of modelRefs) {
    const row = ms.addRow([m.ten, m.ma, m.pn, m.loai, m.nsx]);
    row.eachCell((c) => (c.border = border));
  }
  ms.getColumn(1).width = 30;
  ms.getColumn(2).width = 18;
  ms.getColumn(3).width = 20;
  ms.getColumn(4).width = 24;
  ms.getColumn(5).width = 24;
  ms.views = [{ state: "frozen", ySplit: mHeaderIdx }];

  // Mở file ở sheet Nhập liệu cho tiện.
  ws.state = "visible";
  wb.views = [{ activeTab: 2, x: 0, y: 0, width: 10000, height: 20000, firstSheet: 0, visibility: "visible" }];

  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
