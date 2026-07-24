// ============================================================================
// MẪU NHẬP LIỆU (.xlsx) cho các danh mục dùng chung (CatalogTools):
//   - 1 sheet "Nhập liệu" theo đúng cột CSV hiện có (ma, ten, <textCols>,
//     <refs.csvKey>, active) → nhập lại đọc y hệt luồng CSV.
//   - Cột khoá ngoại có Data Validation (dropdown) đổ từ CSDL sống của bảng
//     tham chiếu (`ten`). Cột `active` dropdown 1/0.
//   - Sheet ẩn "DanhMuc" chứa nguồn dropdown.
//   - Sheet "① Hướng dẫn" giải thích ý nghĩa từng cột và quy ước ghi đè.
//   - Ô meta `A99` ở sheet Hướng dẫn ghi `MIRATS_TEMPLATE_VERSION` để nhập lại
//     có thể phát hiện template lỗi thời và cảnh báo.
// ============================================================================

import ExcelJS from "exceljs";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

/** Phiên bản định dạng mẫu. Tăng khi thay đổi cột kỹ thuật/thứ tự sheet. */
export const CATALOG_TEMPLATE_VERSION = "1";
const VERSION_TAG = "MIRATS_TEMPLATE_VERSION";

function colLetter(n: number): string {
  let s = "", x = n;
  while (x > 0) {
    const r = (x - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

export type CatalogTemplateArgs = {
  fileName: string;
  labelSingular: string;
  /** Các cột theo thứ tự xuất (khớp cột CSV hiện tại). */
  headers: string[];
  /** Dữ liệu hiện có để user cập nhật tại chỗ (mảng theo `headers`). */
  rows: string[][];
  /** Cột khoá ngoại: csvKey → bảng tham chiếu (đổ dropdown từ cột `ten`). */
  refDropdowns?: { csvKey: string; refTable: string }[];
  /** Chú thích ngắn từng cột (hiện ở sheet Hướng dẫn). */
  notes?: Record<string, string>;
  /** Cột bắt buộc để tô nền vàng ở header. */
  required?: string[];
};

async function loadRefNames(table: string): Promise<string[]> {
  const { data, error } = await sb.from(table).select("ten").order("ten");
  if (error) return [];
  const set = new Set<string>();
  for (const r of (data ?? []) as Array<{ ten?: string }>) {
    if (r.ten && r.ten.trim()) set.add(r.ten.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, "vi"));
}


export async function exportCatalogTemplateXlsx(args: CatalogTemplateArgs) {
  const { fileName, labelSingular, headers, rows, refDropdowns = [], notes = {}, required = [] } = args;

  const wb = new ExcelJS.Workbook();
  wb.creator = "MIRATS";
  wb.created = new Date();

  const thin = { style: "thin" as const, color: { argb: "FFCBD5E1" } };
  const border = { top: thin, left: thin, bottom: thin, right: thin };

  // ---- Nạp dropdown song song ----
  const dmLists: Record<string, string[]> = {};
  await Promise.all(
    refDropdowns.map(async (r) => { dmLists[r.csvKey] = await loadRefNames(r.refTable); }),
  );

  // ---- ① Hướng dẫn ----
  const guide = wb.addWorksheet("① Hướng dẫn");
  guide.getCell("A1").value = `MẪU NHẬP LIỆU ${labelSingular.toUpperCase()} — điền vào sheet "② Nhập liệu"`;
  guide.getCell("A1").font = { bold: true, size: 13, color: { argb: "FF1E3A8A" } };
  guide.mergeCells("A1:D1");
  guide.getCell("A2").value =
    "• Ô nền vàng = trường bắt buộc.  • Cột danh mục: bấm mũi tên để CHỌN từ danh sách sống của hệ thống.  • Có mã sẵn = cập nhật, không mã = tạo mới (tự sinh).";
  guide.getCell("A2").font = { italic: true, color: { argb: "FF64748B" } };
  guide.mergeCells("A2:D2");
  guide.addRow([]);
  guide.addRow(["Cột", "Bắt buộc", "Có dropdown", "Ghi chú"]).eachCell((c) => {
    c.font = { bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
    c.border = border;
  });
  const dropdownKeys = new Set(refDropdowns.map((r) => r.csvKey));
  for (const h of headers) {
    const row = guide.addRow([
      h,
      required.includes(h) ? "✔" : "",
      dropdownKeys.has(h) || h === "active" ? "✔" : "",
      notes[h] ?? (h === "ma" ? "Khoá tự nhiên. Trống = tạo mới." : h === "ten" ? "Tên hiển thị." : h === "active" ? "1 = hoạt động, 0 = ngừng." : ""),
    ]);
    row.alignment = { vertical: "top", wrapText: true };
    row.eachCell((c) => (c.border = border));
    if (required.includes(h)) row.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF9C3" } };
  }
  guide.getColumn(1).width = 22;
  guide.getColumn(2).width = 12;
  guide.getColumn(3).width = 14;
  guide.getColumn(4).width = 70;
  guide.views = [{ state: "frozen", ySplit: 4 }];
  // Meta phiên bản mẫu — đặt ở ô cố định để nhập lại có thể phát hiện.
  guide.getCell("A99").value = VERSION_TAG;
  guide.getCell("B99").value = CATALOG_TEMPLATE_VERSION;
  guide.getRow(99).hidden = true;

  // ---- Sheet DanhMuc (ẩn) ----
  const dm = wb.addWorksheet("DanhMuc");
  const dmCol: Record<string, number> = {};
  refDropdowns.forEach((r, i) => {
    const colIdx = i + 1;
    dmCol[r.csvKey] = colIdx;
    dm.getCell(1, colIdx).value = r.csvKey;
    dm.getColumn(colIdx).width = 26;
    (dmLists[r.csvKey] ?? []).forEach((v, k) => { dm.getCell(k + 2, colIdx).value = v; });
  });
  // Cột dành cho active dropdown
  const activeCol = refDropdowns.length + 1;
  dm.getCell(1, activeCol).value = "active";
  dm.getCell(2, activeCol).value = 1;
  dm.getCell(3, activeCol).value = 0;
  dm.state = "hidden";

  // ---- ② Nhập liệu ----
  const ws = wb.addWorksheet("② Nhập liệu");
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell((c, col) => {
    const h = headers[col - 1];
    const isReq = required.includes(h);
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: isReq ? "FFFEF08A" : "FFE8EEF7" } };
    c.alignment = { vertical: "middle" };
    c.border = border;
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const r of rows) ws.addRow(r);

  headers.forEach((h, i) => {
    const w = Math.max(h.length + 6, 14);
    ws.getColumn(i + 1).width = Math.min(w, 40);
  });

  // ---- Data validation ----
  const lastRow = Math.max(rows.length + 1, 500);
  const dv = (ws as unknown as { dataValidations: { add: (r: string, v: unknown) => void } }).dataValidations;
  headers.forEach((h, i) => {
    const excelCol = colLetter(i + 1);
    if (dmCol[h] != null) {
      const list = dmLists[h] ?? [];
      if (list.length === 0) return;
      const c = colLetter(dmCol[h]);
      dv.add(`${excelCol}2:${excelCol}${lastRow}`, {
        type: "list",
        allowBlank: true,
        formulae: [`DanhMuc!$${c}$2:$${c}$${list.length + 1}`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Giá trị ngoài danh mục",
        error: "Nên chọn giá trị có sẵn để tránh sai lệch. Bỏ trống = giữ nguyên.",
      });
    } else if (h === "active") {
      const c = colLetter(activeCol);
      dv.add(`${excelCol}2:${excelCol}${lastRow}`, {
        type: "list",
        allowBlank: true,
        formulae: [`DanhMuc!$${c}$2:$${c}$3`],
        showErrorMessage: true,
        errorStyle: "warning",
        errorTitle: "Chỉ nhận 1 hoặc 0",
        error: "1 = hoạt động, 0 = ngừng.",
      });
    }
  });

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

export type XlsxReadResult = {
  headers: string[];
  rows: Record<string, string>[];
  /** Phiên bản mẫu đọc được từ sheet Hướng dẫn (nếu có). */
  version: string | null;
  /** Cảnh báo mềm về định dạng (không chặn nhập). */
  warnings: string[];
  /** Tên sheet đã sử dụng để đọc dữ liệu. */
  sheetName: string;
};

/**
 * Đọc file .xlsx (ưu tiên sheet "② Nhập liệu"), kèm phiên bản mẫu và cảnh báo
 * khi định dạng không khớp bản đang triển khai. Không ném lỗi cho việc thiếu
 * meta — caller chọn cách xử lý.
 */
export async function readXlsxFirstSheet(file: File): Promise<XlsxReadResult> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(await file.arrayBuffer());

  // 1) Bắt phiên bản mẫu ở sheet Hướng dẫn (nếu có).
  let version: string | null = null;
  const guide = wb.worksheets.find((w) => w.name.includes("Hướng dẫn"));
  if (guide) {
    const tag = String(guide.getCell("A99").value ?? "").trim();
    if (tag === VERSION_TAG) version = String(guide.getCell("B99").value ?? "").trim() || null;
  }

  // 2) Chọn sheet dữ liệu — ưu tiên "② Nhập liệu".
  const preferred = wb.worksheets.find((w) => w.name.includes("Nhập liệu"));
  const ws = preferred ?? wb.worksheets.find((w) => w.state !== "hidden") ?? wb.worksheets[0];
  const warnings: string[] = [];
  if (!ws) return { headers: [], rows: [], version, warnings: ["File không có sheet dữ liệu."], sheetName: "" };
  if (!preferred) warnings.push(`Không thấy sheet "② Nhập liệu", đang đọc "${ws.name}".`);
  if (version && version !== CATALOG_TEMPLATE_VERSION) {
    warnings.push(
      `Mẫu phiên bản ${version} không khớp phiên bản hiện tại (${CATALOG_TEMPLATE_VERSION}). ` +
        "Nên xuất lại mẫu XLSX mới để tránh sai cột kỹ thuật.",
    );
  }

  // 3) Đọc header + rows.
  const headerRow = ws.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (c) => { headers.push(String(c.value ?? "").trim()); });
  if (headers.length === 0) warnings.push("Dòng đầu (header) trống — không đọc được cột nào.");
  const rows: Record<string, string>[] = [];
  for (let i = 2; i <= ws.rowCount; i++) {
    const r = ws.getRow(i);
    const rec: Record<string, string> = {};
    let hasAny = false;
    headers.forEach((h, idx) => {
      const v = r.getCell(idx + 1).value;
      const s = v == null ? "" : typeof v === "object" && "text" in (v as object) ? String((v as { text: unknown }).text ?? "") : String(v);
      rec[h] = s;
      if (s.trim()) hasAny = true;
    });
    if (hasAny) rows.push(rec);
  }
  return { headers, rows, version, warnings, sheetName: ws.name };
}

/**
 * Validate danh sách rows theo tập cột bắt buộc & giá trị hợp lệ cơ bản.
 * Trả về mảng issue song song với `rows` (index-align). Dùng cho báo cáo lỗi
 * theo dòng trước khi commit.
 */
export type RowIssueDetail = {
  /** Cột liên quan (nếu là lỗi ràng buộc cột cụ thể). Rỗng = lỗi mức dòng. */
  field?: string;
  /** Giá trị đọc được ở cột đó (đã trim). */
  value?: string;
  /** Nội dung hiển thị cho người dùng. */
  message: string;
  level: "error" | "warning";
};

export type RowIssue = {
  errors: string[];
  warnings: string[];
  /** Danh sách chi tiết có ánh xạ tới cột — dùng để tô ô lỗi trong bảng xem trước. */
  issues: RowIssueDetail[];
};

export function validateCatalogRows(
  headers: string[],
  rows: Record<string, string>[],
  opts: {
    required?: string[];
    activeCol?: string;
    refCols?: { csvKey: string; allowed: Set<string> }[];
  } = {},
): RowIssue[] {
  const required = opts.required ?? ["ten"];
  const activeCol = opts.activeCol ?? "active";
  const refCols = opts.refCols ?? [];
  const missingHeaders = required.filter((h) => !headers.includes(h));
  return rows.map((r) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const issues: RowIssueDetail[] = [];
    for (const h of missingHeaders) {
      const m = `Thiếu cột bắt buộc "${h}" trong file.`;
      errors.push(m);
      issues.push({ field: h, message: m, level: "error" });
    }
    for (const h of required) {
      if (!missingHeaders.includes(h) && !(r[h] ?? "").trim()) {
        const m = `Cột "${h}" bỏ trống.`;
        errors.push(m);
        issues.push({ field: h, value: "", message: m, level: "error" });
      }
    }
    const av = (r[activeCol] ?? "").trim();
    if (av && !["1", "0", "true", "false", "yes", "no", "co", "khong", "ẩn", "an"].includes(av.toLowerCase())) {
      const m = `Giá trị "${av}" ở cột ${activeCol} không rõ — sẽ coi là hoạt động.`;
      warnings.push(m);
      issues.push({ field: activeCol, value: av, message: m, level: "warning" });
    }
    for (const rc of refCols) {
      const v = (r[rc.csvKey] ?? "").trim();
      if (v && rc.allowed.size > 0 && !rc.allowed.has(v.toLowerCase())) {
        const m = `Giá trị "${v}" ở cột "${rc.csvKey}" không khớp danh mục — sẽ để trống liên kết.`;
        warnings.push(m);
        issues.push({ field: rc.csvKey, value: v, message: m, level: "warning" });
      }
    }
    return { errors, warnings, issues };
  });
}


