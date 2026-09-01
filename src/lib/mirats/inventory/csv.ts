// ============================================================================
// Tiện ích CSV tối thiểu cho bảng "Thành phần & Tài sản".
// Không thêm dependency: dùng Blob + URL.createObjectURL + thẻ <a>.
// ============================================================================

/** Escape một ô CSV: bọc nháy kép khi có dấu phẩy / nháy kép / xuống dòng. */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = typeof value === "string" ? value : String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Ghép mảng 2 chiều thành chuỗi CSV (CRLF để Excel xuống dòng đúng). */
export function toCsv(rows: ReadonlyArray<ReadonlyArray<unknown>>): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

/** Tải chuỗi CSV về máy, kèm BOM UTF-8 để Excel đọc đúng tiếng Việt. */
export function downloadCsv(fileName: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Tên tệp dạng `<prefix>-YYYY-MM-DD.csv`. */
export function csvFileName(prefix: string, now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${prefix}-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.csv`;
}

/**
 * Chuẩn hoá chuỗi ngày về Date. Chấp nhận ISO (yyyy-mm-dd) và dd/MM/yyyy —
 * hai định dạng thực tế đang có trong dữ liệu tài sản. Trả về null nếu không đọc được.
 */
export function parseNgay(input: unknown): Date | null {
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const s = typeof input === "string" ? input.trim() : "";
  if (!s) return null;
  const vn = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(s);
  if (vn) {
    const d = new Date(Number(vn[3]), Number(vn[2]) - 1, Number(vn[1]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Nhãn trạng thái bảo hành từ hạn bảo hành. Thiếu dữ liệu → chuỗi rỗng
 * (xuất ô trống thay vì suy diễn).
 */
export function trangThaiBaoHanh(hanBaoHanh: unknown, now: Date = new Date()): string {
  const han = parseNgay(hanBaoHanh);
  if (!han) return "";
  const ngayConLai = Math.ceil((han.getTime() - now.getTime()) / 86_400_000);
  if (ngayConLai < 0) return "Hết bảo hành";
  if (ngayConLai <= 60) return "Sắp hết bảo hành";
  return "Còn bảo hành";
}
