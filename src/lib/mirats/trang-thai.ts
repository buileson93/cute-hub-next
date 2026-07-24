// ============================================================================
// NGUỒN DUY NHẤT ĐỊNH NGHĨA TRẠNG THÁI cho 5 domain của MIRATS 2.0:
//   su_co · van_de · cong_viec · hong_hoc · ban_giao
//
// Mỗi trạng thái có `code` (khoá ổn định, snake_case ASCII), `label` (VN
// hiển thị), `phase` (open|in_progress|closed|cancelled) để mọi module
// dùng chung logic phân loại open/closed & ánh xạ từ giá trị lưu cũ.
//
// Ràng buộc: KHÔNG thay đổi giá trị đang lưu trong DB. Module này chỉ chuẩn
// hoá ở tầng ứng dụng — DB tiếp tục lưu nguyên bản (VN label / UPPER_SNAKE),
// còn `normalizeLegacy` ánh xạ về code chuẩn khi cần so sánh / phân loại.
// ============================================================================

export type Domain = "su_co" | "van_de" | "cong_viec" | "hong_hoc" | "ban_giao" | "bao_tri";

export type Phase = "open" | "in_progress" | "closed" | "cancelled";

export interface StatusDef {
  code: string;
  label: string;
  phase: Phase;
  /** Mọi biến thể chuỗi cũ đã từng xuất hiện trong DB / dữ liệu seed. */
  aliases: readonly string[];
}

const DEFS: Record<Domain, readonly StatusDef[]> = {
  // ------------------------------------------------------------------------
  // SỰ CỐ — DB hiện lưu chuỗi tiếng Việt ("Mới", "Đang xử lý", ...)
  // ------------------------------------------------------------------------
  su_co: [
    { code: "moi", label: "Mới", phase: "open",
      aliases: ["Mới", "moi", "MOI", "new"] },
    { code: "dang_xu_ly", label: "Đang xử lý", phase: "in_progress",
      aliases: ["Đang xử lý", "dang_xu_ly", "DANG_XU_LY", "in_progress"] },
    { code: "da_khac_phuc", label: "Đã khắc phục", phase: "closed",
      aliases: ["Đã khắc phục", "da_khac_phuc", "DA_KHAC_PHUC", "resolved"] },
    { code: "dong", label: "Đóng", phase: "closed",
      aliases: ["Đóng", "dong", "DONG", "closed"] },
  ],

  // ------------------------------------------------------------------------
  // VẤN ĐỀ (RCA) — DB lưu snake_case ("moi", "dang_phan_tich", ...)
  // ------------------------------------------------------------------------
  van_de: [
    { code: "moi", label: "Mới", phase: "open",
      aliases: ["moi", "Mới", "MOI"] },
    { code: "dang_phan_tich", label: "Đang phân tích", phase: "in_progress",
      aliases: ["dang_phan_tich", "Đang phân tích"] },
    { code: "da_xac_dinh", label: "Đã xác định", phase: "in_progress",
      aliases: ["da_xac_dinh", "Đã xác định"] },
    { code: "da_khac_phuc", label: "Đã khắc phục", phase: "in_progress",
      aliases: ["da_khac_phuc", "Đã khắc phục"] },
    { code: "dong", label: "Đóng", phase: "closed",
      aliases: ["dong", "Đóng", "closed", "DONG"] },
  ],

  // ------------------------------------------------------------------------
  // CÔNG VIỆC BẢO DƯỠNG — DB lưu UPPER_SNAKE ("MO", "DANG_LAM", ...)
  // ------------------------------------------------------------------------
  cong_viec: [
    { code: "mo", label: "Mở", phase: "open",
      aliases: ["MO", "mo", "Mở", "Mo", "Mới"] },
    { code: "dang_lam", label: "Đang làm", phase: "in_progress",
      aliases: ["DANG_LAM", "dang_lam", "Đang làm"] },
    { code: "hoan_thanh", label: "Hoàn thành", phase: "closed",
      aliases: ["HOAN_THANH", "hoan_thanh", "Hoàn thành"] },
    { code: "huy", label: "Hủy", phase: "cancelled",
      aliases: ["HUY", "huy", "Hủy", "Huỷ"] },
  ],

  // ------------------------------------------------------------------------
  // HỎNG HÓC / THAY THẾ — DB lưu VN ("Mới", "Đang xử lý", "Hoàn thành")
  // ------------------------------------------------------------------------
  hong_hoc: [
    { code: "moi", label: "Mới", phase: "open",
      aliases: ["Mới", "moi"] },
    { code: "dang_xu_ly", label: "Đang xử lý", phase: "in_progress",
      aliases: ["Đang xử lý", "dang_xu_ly"] },
    { code: "hoan_thanh", label: "Hoàn thành", phase: "closed",
      aliases: ["Hoàn thành", "hoan_thanh", "HOAN_THANH"] },
  ],

  // ------------------------------------------------------------------------
  // BÀN GIAO — DB lưu VN ("Đang mượn", "Đang giữ", "Đã trả")
  // ------------------------------------------------------------------------
  ban_giao: [
    { code: "dang_muon", label: "Đang mượn", phase: "open",
      aliases: ["Đang mượn", "dang_muon"] },
    { code: "dang_giu", label: "Đang giữ", phase: "open",
      aliases: ["Đang giữ", "dang_giu"] },
    { code: "da_tra", label: "Đã trả", phase: "closed",
      aliases: ["Đã trả", "da_tra"] },
  ],

  // ------------------------------------------------------------------------
  // BẢO DƯỠNG (phiếu bảo dưỡng) — DB lưu VN ("Kế hoạch", "Đang thực hiện", ...)
  // ------------------------------------------------------------------------
  bao_tri: [
    { code: "ke_hoach", label: "Kế hoạch", phase: "open",
      aliases: ["Kế hoạch", "ke_hoach", "KE_HOACH", "planned"] },
    { code: "dang_thuc_hien", label: "Đang thực hiện", phase: "in_progress",
      aliases: ["Đang thực hiện", "dang_thuc_hien", "DANG_THUC_HIEN", "in_progress"] },
    { code: "hoan_thanh", label: "Hoàn thành", phase: "closed",
      aliases: ["Hoàn thành", "hoan_thanh", "HOAN_THANH", "done"] },
    { code: "hoan", label: "Hoãn", phase: "cancelled",
      aliases: ["Hoãn", "hoan", "HOAN", "postponed"] },
  ],
};

/** Trả về danh sách trạng thái đã định nghĩa cho một domain. */
export function statuses(d: Domain): StatusDef[] {
  return [...DEFS[d]];
}

function findByCode(d: Domain, code: string): StatusDef | null {
  return DEFS[d].find((s) => s.code === code) ?? null;
}

/** Trả về `phase` của một mã trạng thái chuẩn; `null` nếu không nhận diện. */
export function phaseOf(d: Domain, code: string): Phase | null {
  return findByCode(d, code)?.phase ?? null;
}

/** Nhãn hiển thị của một mã trạng thái chuẩn (fallback = chính mã). */
export function labelOf(d: Domain, code: string): string {
  return findByCode(d, code)?.label ?? code;
}

/** Đúng khi phase !== closed / cancelled. */
export function isOpen(d: Domain, code: string): boolean {
  const p = phaseOf(d, code);
  return p === "open" || p === "in_progress";
}

/**
 * Ánh xạ giá trị stored (đủ mọi biến thể lịch sử) → code chuẩn.
 * Nếu không nhận diện, trả về chuỗi đã trim (để caller vẫn có input hợp lệ).
 */
export function normalizeLegacy(d: Domain, stored: string): string {
  const raw = (stored ?? "").trim();
  if (!raw) return "";
  for (const s of DEFS[d]) {
    if (raw === s.code) return s.code;
    if (s.aliases.includes(raw)) return s.code;
  }
  // Không nhận diện — thử so khớp bỏ dấu / lowercase để an toàn thêm.
  const lower = raw.toLowerCase();
  for (const s of DEFS[d]) {
    if (s.code.toLowerCase() === lower) return s.code;
    if (s.aliases.some((a) => a.toLowerCase() === lower)) return s.code;
  }
  return raw;
}

/** Tất cả giá trị stored (aliases) cho các phase chỉ định. */
export function storedValuesFor(d: Domain, phases: readonly Phase[]): Set<string> {
  const out = new Set<string>();
  for (const s of DEFS[d]) {
    if (!phases.includes(s.phase)) continue;
    out.add(s.code);
    out.add(s.label);
    for (const a of s.aliases) out.add(a);
  }
  return out;
}
