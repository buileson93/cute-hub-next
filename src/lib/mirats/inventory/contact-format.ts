// ============================================================================
// contact-format — chuẩn hoá cách hiển thị & xuất dữ liệu "liên hệ" cho màn
// hình Thành phần & Tài sản.
//
// Trong CSDL hiện tại KHÔNG có trường email/điện thoại riêng cho tài sản.
// Các đầu mối thực tế đang lưu dưới dạng TÊN ĐƠN VỊ / TỔ CHỨC:
//   - donViQuanLy  → đơn vị phụ trách tài sản
//   - nhaCungCap   → đầu mối cung cấp / bảo hành thương mại
//   - nhaSanXuat   → hãng sản xuất (hỗ trợ kỹ thuật)
// Module này chỉ định dạng dữ liệu sẵn có, không thay đổi schema.
// ============================================================================

export type ContactRole = "Đơn vị quản lý" | "Nhà cung cấp" | "Hãng sản xuất";

export type ContactEntry = {
  /** Vai trò của đầu mối (dùng làm nhãn ngắn). */
  role: ContactRole;
  /** Tên đơn vị/đầu mối — luôn là chuỗi đã trim, không rỗng. */
  name: string;
};

/** Chuẩn hoá 1 giá trị bất kỳ về chuỗi hiển thị an toàn (không "[object Object]"). */
export function toDisplayString(value: unknown, sep = "; "): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map((v) => toDisplayString(v, sep)).filter(Boolean).join(sep);
  }
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const label = o.ten ?? o.name ?? o.label ?? o.ma;
    if (typeof label === "string" && label.trim()) return label.trim();
    return Object.values(o)
      .filter((v) => typeof v === "string" || typeof v === "number")
      .map((v) => String(v).trim())
      .filter(Boolean)
      .join(" · ");
  }
  return String(value).trim();
}

/** Nguồn dữ liệu liên hệ tối thiểu — dùng chung cho dòng tài sản & thành phần. */
export type ContactSource = {
  donViQuanLy?: unknown;
  nhaCungCap?: unknown;
  nhaSanXuat?: unknown;
};

/**
 * Dựng danh sách đầu mối liên hệ theo thứ tự ưu tiên nghiệp vụ.
 * Bỏ qua giá trị rỗng và các đầu mối trùng tên (tránh lặp thông tin).
 */
export function buildContacts(src: ContactSource): ContactEntry[] {
  const raw: Array<[ContactRole, unknown]> = [
    ["Đơn vị quản lý", src.donViQuanLy],
    ["Nhà cung cấp", src.nhaCungCap],
    ["Hãng sản xuất", src.nhaSanXuat],
  ];
  const seen = new Set<string>();
  const out: ContactEntry[] = [];
  for (const [role, value] of raw) {
    const name = toDisplayString(value);
    if (!name) continue;
    const key = name.toLocaleLowerCase("vi-VN");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ role, name });
  }
  return out;
}

/** Chuỗi liên hệ ổn định để tìm kiếm / xuất CSV: "Vai trò: Tên; …". */
export function formatContactsForExport(contacts: ContactEntry[], sep = "; "): string {
  return contacts.map((c) => `${c.role}: ${c.name}`).join(sep);
}

/** Một dòng metadata label/value trong tooltip/popover. */
export type MetaItem = { label: string; value: string };

/**
 * Lọc danh sách metadata: bỏ dòng rỗng và bỏ dòng trùng với giá trị đang hiển
 * thị ngay tại ô kích hoạt (tránh lặp MODEL/SERIAL trong popover).
 */
export function buildMetaItems(
  items: Array<{ label: string; value: unknown }>,
  omitValues: Array<string | null | undefined> = [],
): MetaItem[] {
  const omit = new Set(
    omitValues
      .map((v) => (v ?? "").toString().trim().toLocaleLowerCase("vi-VN"))
      .filter(Boolean),
  );
  const seen = new Set<string>();
  const out: MetaItem[] = [];
  for (const it of items) {
    const value = toDisplayString(it.value);
    if (!value) continue;
    const norm = value.toLocaleLowerCase("vi-VN");
    if (omit.has(norm)) continue;
    const key = `${it.label}|${norm}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ label: it.label, value });
  }
  return out;
}
