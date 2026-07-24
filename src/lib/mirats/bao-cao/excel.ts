// ============================================================================
// bao-cao/excel.ts — Xuất báo cáo sang XLSX (dùng xlsx).
// Hàm thuần: nhận BaoCaoData → trả về Uint8Array (buffer file).
// ============================================================================

import * as XLSX from "xlsx";
import type { BaoCaoData } from "./types";

export function xuatBaoCaoExcel(data: BaoCaoData): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet Meta + KPI
  const metaRows: (string | number)[][] = [
    ["Tiêu đề", data.meta.tieu_de],
    ["Loại", data.meta.loai],
    ["Tạo lúc", data.meta.tao_luc],
    ["Kỳ bắt đầu", data.meta.ky_bat_dau ?? ""],
    ["Kỳ kết thúc", data.meta.ky_ket_thuc ?? ""],
    ["Đơn vị", data.meta.don_vi ?? ""],
    [],
    ["KPI", "Giá trị"],
    ...(data.kpi ?? []).map((k) => [k.nhan, k.gia_tri]),
  ];
  const wsMeta = XLSX.utils.aoa_to_sheet(metaRows);
  XLSX.utils.book_append_sheet(wb, wsMeta, "Tổng quan");

  // Mỗi bảng một sheet
  for (const bang of data.bang) {
    const header = bang.cot.map((c) => c.nhan);
    const keys = bang.cot.map((c) => c.key);
    const rows = bang.hang.map((h) => keys.map((k) => (h[k] ?? "") as string | number));
    const aoa: (string | number)[][] = [header, ...rows];
    if (bang.tom_tat) {
      aoa.push(keys.map((k) => (bang.tom_tat![k] ?? "") as string | number));
    }
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Đặt rộng cột theo hint
    ws["!cols"] = bang.cot.map((c) => ({ wch: c.rong ?? Math.max(12, c.nhan.length + 2) }));
    const sheetName = bang.ten.slice(0, 31).replace(/[\\/?*[\]:]/g, "_");
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  const buf = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Uint8Array(buf);
}
