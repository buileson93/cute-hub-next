// ============================================================================
// format.ts — Task 25: NGUỒN DUY NHẤT các hàm định dạng hiển thị.
//
// Gom fmtVND / fmtSo / fmtNgay / fmtNgayGio / fmtDowntime. Mọi route/component
// import từ đây; các bản trong `metrics.ts` / `demo-data.ts` giữ nguyên chữ ký
// nhưng chỉ re-export (đánh @deprecated) để mã cũ không vỡ.
//
// Quy ước:
//   - null / undefined / NaN / chuỗi rỗng → "—" (dấu em-dash).
//   - Số: nhóm nghìn theo locale vi-VN.
//   - Ngày: dd/MM/yyyy — dùng cho hiển thị người dùng, KHÔNG dùng cho DB.
//   - Ngày+giờ: dd/MM/yyyy HH:mm.
//   - Thời lượng phút → "x giờ y phút" / "x ngày y giờ" tuỳ độ lớn.
// ============================================================================

/** Placeholder khi giá trị rỗng — dùng đồng nhất toàn hệ thống. */
export const KHONG_CO = "—";

function laKhongHopLe(n: unknown): boolean {
  return n == null || (typeof n === "number" && !Number.isFinite(n));
}

/**
 * Định dạng số theo locale vi-VN (nhóm nghìn dấu chấm).
 * `null | undefined | NaN` → "—".
 */
export function fmtSo(n: number | null | undefined, opts?: Intl.NumberFormatOptions): string {
  if (laKhongHopLe(n)) return KHONG_CO;
  return (n as number).toLocaleString("vi-VN", opts);
}

/**
 * Định dạng tiền Việt.
 * - ≥ 1 tỷ  → "x.xx tỷ"
 * - ≥ 1 triệu → "x.x triệu"
 * - còn lại → nhóm nghìn (VD "1.234.567").
 * Không kèm ký hiệu "đ" — nơi hiển thị tự thêm nếu muốn.
 */
export function fmtVND(n: number | null | undefined): string {
  if (laKhongHopLe(n)) return KHONG_CO;
  const v = n as number;
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) return `${(v / 1_000_000_000).toFixed(2)} tỷ`;
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)} triệu`;
  return v.toLocaleString("vi-VN");
}

function parseDate(iso: string | Date | null | undefined): Date | null {
  if (iso == null || iso === "") return null;
  const d = iso instanceof Date ? iso : new Date(iso);
  return Number.isFinite(d.getTime()) ? d : null;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** ISO / Date → "dd/MM/yyyy". Rỗng / không hợp lệ → "—". */
export function fmtNgay(iso: string | Date | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return KHONG_CO;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** ISO / Date → "dd/MM/yyyy HH:mm". Rỗng / không hợp lệ → "—". */
export function fmtNgayGio(iso: string | Date | null | undefined): string {
  const d = parseDate(iso);
  if (!d) return KHONG_CO;
  return `${fmtNgay(d)} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/**
 * Số phút → chuỗi ngắn gọn cho UI.
 *   < 60      → "x phút"
 *   < 1440    → "x giờ y phút" (bỏ phần phút nếu = 0)
 *   ≥ 1440    → "x ngày y giờ" (bỏ phần giờ nếu = 0)
 * `null | undefined` → "—".
 */
export function fmtDowntime(phut: number | null | undefined): string {
  if (laKhongHopLe(phut)) return KHONG_CO;
  const m = Math.max(0, Math.round(phut as number));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (h < 24) return rm ? `${h} giờ ${rm} phút` : `${h} giờ`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d} ngày ${rh} giờ` : `${d} ngày`;
}
