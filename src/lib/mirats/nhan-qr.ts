// ============================================================================
// Tiện ích dựng URL cho nhãn QR tài sản.
// QR trên nhãn in mã hoá một URL quét dạng "<origin>/q/<mã tài sản>", khi quét
// bằng điện thoại sẽ điều hướng thẳng tới trang chi tiết tài sản (route /q).
// ============================================================================

/** Bỏ dấu "/" thừa ở cuối origin để tránh URL kiểu "https://x//q/..". */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, "");
}

/**
 * Dựng URL quét cho nhãn QR của một tài sản.
 * @param origin gốc site, ví dụ "https://mirats.app" (có thể kèm "/" cuối).
 * @param maThietBi mã tài sản.
 * @returns "<origin>/q/<mã đã encode>".
 */
export function buildLabelUrl(origin: string, maThietBi: string): string {
  const base = normalizeOrigin(origin);
  const ma = encodeURIComponent((maThietBi ?? "").trim());
  return `${base}/q/${ma}`;
}

/** Đường dẫn tương đối tới route quét (dùng khi không cần origin tuyệt đối). */
export function buildLabelPath(maThietBi: string): string {
  return `/q/${encodeURIComponent((maThietBi ?? "").trim())}`;
}
