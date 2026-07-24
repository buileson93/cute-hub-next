/**
 * Từ điển dữ liệu curated – NGUỒN SỰ THẬT DUY NHẤT về schema nghiệp vụ cho AI.
 *
 * Chi phối cả:
 *  - `KNOWN_TABLES` (query-helpers) → phạm vi bảng tool generic được phép đọc.
 *  - System prompt (routes/api/chat.ts) → bản đồ dữ liệu AI thấy trước khi truy vấn.
 *  - Tool `describe_schema` → trả mô tả tiếng Việt + kiểu cột thực (RPC live).
 *
 * Nguyên tắc: chỉ liệt kê các cột QUAN TRỌNG (đủ để AI biết lọc/JOIN); chi tiết
 * đầy đủ để dành cho tool `describe_schema` (đọc kiểu cột thực từ DB).
 */

/**
 * Bản đồ thuật ngữ UI ↔ tên bảng CSDL.
 * Tên bảng giữ nguyên vì lý do lịch sử (đổi = vỡ toàn bộ query, RLS, RPC).
 * UI/label đã đổi sang thuật ngữ mới. Dùng bảng này để tra khi đọc schema.
 */
export const TERMINOLOGY_MAP: ReadonlyArray<{
  ui: string;
  table: string;
  legacyUi?: string;
  note?: string;
}> = [
  { ui: "Tài sản", table: "thiet_bi", legacyUi: "Thiết bị", note: "Bảng trung tâm — asset vật lý" },
  { ui: "Model", table: "dm_model", legacyUi: "Mẫu thiết bị" },
  { ui: "Chủng loại", table: "dm_loai_thiet_bi", legacyUi: "Loại thiết bị" },
  { ui: "Nhãn thiết bị", table: "dm_dac_tinh", legacyUi: "Đặc tính", note: "Tag đa trị M:N với Model" },
  { ui: "Trạng thái tài sản", table: "dm_trang_thai_thiet_bi", legacyUi: "Trạng thái thiết bị" },
];


export type ColumnSpec = {
  name: string;
  desc: string;
  /** Nếu cột là khoá tra tới một danh mục dm_* thì ghi tên bảng danh mục ở đây. */
  enumOf?: string;
};

export type TableGroup = "master" | "equipment" | "operations" | "docs" | "system";

export type TableSpec = {
  name: string;
  desc: string;
  columns: ColumnSpec[];
  /** Quan hệ khoá ngoại dạng "cot -> bang.cot". */
  relations?: string[];
  group: TableGroup;
};

export const BUSINESS_TABLES: TableSpec[] = [
  // ── Equipment ─────────────────────────────────────────────
  {
    name: "thiet_bi",
    group: "equipment",
    desc: "Tài sản kỹ thuật (bảng trung tâm)",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_thiet_bi", desc: "Mã định danh duy nhất, bất biến (dạng TB-000123, số tuần tự tự sinh). KHÔNG mã hoá đơn vị/vị trí/hệ thống — điều chuyển hay thay thế không đổi mã. Đơn vị/hệ thống đang lắp nằm ở các cột riêng (don_vi_id, he_thong_id)." },
      { name: "ma_tai_san_bravo", desc: "Mã tài sản Bravo (cột vật lý cố định)" },
      { name: "ten_thiet_bi", desc: "Tên tài sản" },
      { name: "model", desc: "Model" },
      { name: "ma_serial", desc: "Số serial" },
      { name: "vi_tri", desc: "Vị trí lắp đặt (text)" },
      { name: "trang_thai_id", desc: "Trạng thái", enumOf: "dm_trang_thai_thiet_bi" },
      { name: "don_vi_quan_ly_id", desc: "Đơn vị quản lý", enumOf: "dm_don_vi" },
      { name: "he_thong_id", desc: "Hệ thống", enumOf: "dm_he_thong" },
      { name: "loai_thiet_bi_id", desc: "Chủng loại", enumOf: "dm_loai_thiet_bi" },
      { name: "nha_san_xuat_id", desc: "Nhà sản xuất", enumOf: "dm_nha_san_xuat" },
      { name: "han_bao_hanh", desc: "Hạn bảo hành (date)" },
      { name: "thuoc_tinh", desc: "Trường động JSONB (khai thêm theo hệ thống)" },
    ],
    relations: [
      "trang_thai_id -> dm_trang_thai_thiet_bi.id",
      "don_vi_quan_ly_id -> dm_don_vi.id",
      "he_thong_id -> dm_he_thong.id",
    ],
  },
  {
    name: "thiet_bi_tep_dinh_kem",
    group: "equipment",
    desc: "Tệp đính kèm của tài sản",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "thiet_bi_id", desc: "Tài sản", enumOf: "thiet_bi" },
      { name: "ten_tep", desc: "Tên tệp" },
    ],
    relations: ["thiet_bi_id -> thiet_bi.id"],
  },

  // ── Operations (vận hành) ─────────────────────────────────
  {
    name: "su_co",
    group: "operations",
    desc: "Sự cố kỹ thuật của tài sản/hệ thống",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_su_co", desc: "Mã sự cố" },
      { name: "thiet_bi", desc: "Tài sản (text theo báo cáo)" },
      { name: "thiet_bi_id", desc: "Tài sản liên quan (FK)", enumOf: "thiet_bi" },
      { name: "he_thong", desc: "Hệ thống (text)" },
      { name: "muc_do", desc: "Mức độ nghiêm trọng" },
      { name: "ngay_phat_hien", desc: "Ngày phát hiện" },
      { name: "hien_tuong", desc: "Hiện tượng" },
      { name: "nguyen_nhan", desc: "Nguyên nhân" },
      { name: "bien_phap_xu_ly", desc: "Biện pháp xử lý" },
      { name: "trang_thai", desc: "Trạng thái xử lý (text)" },
    ],
    relations: ["thiet_bi_id -> thiet_bi.id"],
  },
  {
    name: "bao_tri",
    group: "operations",
    desc: "Bảo trì / bảo dưỡng tài sản",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_bao_tri", desc: "Mã bảo trì" },
      { name: "thiet_bi", desc: "Tài sản (text)" },
      { name: "thiet_bi_id", desc: "Tài sản (FK)", enumOf: "thiet_bi" },
      { name: "loai_bao_tri", desc: "Loại bảo trì (định kỳ/đột xuất)" },
      { name: "ngay_bat_dau", desc: "Ngày bắt đầu" },
      { name: "ngay_hoan_thanh", desc: "Ngày hoàn thành" },
      { name: "ket_qua", desc: "Kết quả" },
      { name: "trang_thai", desc: "Trạng thái (text)" },
    ],
    relations: ["thiet_bi_id -> thiet_bi.id"],
  },
  {
    name: "hong_hoc",
    group: "operations",
    desc: "Hỏng hóc & thay thế tài sản",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_hong_hoc", desc: "Mã hỏng hóc" },
      { name: "thiet_bi_hong", desc: "Tài sản hỏng (text)" },
      { name: "thiet_bi_hong_id", desc: "Tài sản hỏng (FK)", enumOf: "thiet_bi" },
      { name: "thiet_bi_thay_the", desc: "Tài sản thay thế (text)" },
      { name: "thiet_bi_thay_the_id", desc: "Tài sản thay thế (FK)", enumOf: "thiet_bi" },
      { name: "ngay_hong", desc: "Ngày hỏng" },
      { name: "bo_phan_hong", desc: "Bộ phận hỏng" },
      { name: "phuong_an", desc: "Phương án xử lý" },
      { name: "trang_thai", desc: "Trạng thái (text)" },
    ],
    relations: [
      "thiet_bi_hong_id -> thiet_bi.id",
      "thiet_bi_thay_the_id -> thiet_bi.id",
      "su_co -> su_co.id",
    ],
  },
  {
    name: "ban_giao",
    group: "operations",
    desc: "Bàn giao ca / cấp phát tài sản",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_ban_giao", desc: "Mã bàn giao" },
      { name: "thiet_bi", desc: "Tài sản (text)" },
      { name: "thiet_bi_id", desc: "Tài sản (FK)", enumOf: "thiet_bi" },
      { name: "loai_ban_giao", desc: "Loại bàn giao" },
      { name: "nguoi_giao", desc: "Người giao" },
      { name: "nguoi_nhan", desc: "Người nhận" },
      { name: "ngay_nhan", desc: "Ngày nhận" },
      { name: "trang_thai", desc: "Trạng thái (text)" },
    ],
    relations: ["thiet_bi_id -> thiet_bi.id"],
  },

  // ── Docs / Giấy tờ ───────────────────────────────────────
  {
    name: "giay_phep",
    group: "docs",
    desc: "Giấy phép (cấp phép tài sản/hệ thống)",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma_giay_phep", desc: "Mã giấy phép" },
      { name: "so_giay_phep", desc: "Số giấy phép" },
      { name: "ngay_cap", desc: "Ngày cấp" },
      { name: "ngay_het_han", desc: "Ngày hết hạn (date)" },
      { name: "thiet_bi_id", desc: "Tài sản liên quan", enumOf: "thiet_bi" },
    ],
    relations: ["thiet_bi_id -> thiet_bi.id"],
  },
  {
    name: "giay_phep_khai_thac",
    group: "docs",
    desc: "Giấy phép khai thác hệ thống (theo hệ thống)",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "he_thong_id", desc: "Hệ thống", enumOf: "dm_he_thong" },
      { name: "gp_so", desc: "Số giấy phép" },
      { name: "gp_ngay", desc: "Ngày cấp" },
      { name: "gp_han", desc: "Hạn giấy phép" },
    ],
    relations: ["he_thong_id -> dm_he_thong.id"],
  },
  {
    name: "form_template",
    group: "docs",
    desc: "Biểu mẫu mẫu (template)",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ten", desc: "Tên biểu mẫu" },
      { name: "loai", desc: "Loại biểu mẫu" },
    ],
  },
  {
    name: "form_field",
    group: "docs",
    desc: "Trường của biểu mẫu template",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "form_template_id", desc: "Template", enumOf: "form_template" },
      { name: "ten", desc: "Tên trường" },
    ],
    relations: ["form_template_id -> form_template.id"],
  },
  {
    name: "form_submission",
    group: "docs",
    desc: "Biên bản/biểu mẫu đã nộp",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "form_template_id", desc: "Template", enumOf: "form_template" },
      { name: "status", desc: "Trạng thái: draft/submitted/reviewed/signed" },
      { name: "created_by", desc: "Người tạo" },
    ],
    relations: ["form_template_id -> form_template.id"],
  },
  {
    name: "form_submission_thiet_bi",
    group: "docs",
    desc: "Liên kết biểu mẫu ↔ tài sản",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "form_submission_id", desc: "Biểu mẫu", enumOf: "form_submission" },
      { name: "thiet_bi_id", desc: "Tài sản", enumOf: "thiet_bi" },
    ],
    relations: [
      "form_submission_id -> form_submission.id",
      "thiet_bi_id -> thiet_bi.id",
    ],
  },

  // ── System / hỗ trợ ──────────────────────────────────────
  {
    name: "tickets",
    group: "system",
    desc: "Ticket / yêu cầu hỗ trợ",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "loai", desc: "Loại ticket" },
      { name: "tieu_de", desc: "Tiêu đề" },
      { name: "trang_thai", desc: "Trạng thái: open/in_progress/closed" },
      { name: "uu_tien", desc: "Ưu tiên" },
      { name: "don_vi", desc: "Đơn vị" },
    ],
  },
  {
    name: "ticket_comment",
    group: "system",
    desc: "Bình luận trong ticket",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ticket_id", desc: "Ticket", enumOf: "tickets" },
    ],
    relations: ["ticket_id -> tickets.id"],
  },
  {
    name: "du_an",
    group: "system",
    desc: "Dự án",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ma", desc: "Mã dự án" },
      { name: "ten", desc: "Tên dự án" },
      { name: "trang_thai", desc: "Trạng thái" },
      { name: "tien_do", desc: "Tiến độ (%)" },
      { name: "don_vi_id", desc: "Đơn vị", enumOf: "dm_don_vi" },
    ],
  },
  {
    name: "du_an_cong_viec",
    group: "system",
    desc: "Công việc trong dự án",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "du_an_id", desc: "Dự án", enumOf: "du_an" },
      { name: "ten", desc: "Tên công việc" },
      { name: "trang_thai", desc: "Trạng thái" },
    ],
    relations: ["du_an_id -> du_an.id"],
  },
  {
    name: "du_an_moc",
    group: "system",
    desc: "Mốc thời gian của dự án",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "du_an_id", desc: "Dự án", enumOf: "du_an" },
    ],
    relations: ["du_an_id -> du_an.id"],
  },
  {
    name: "du_an_cong_viec_phoi_hop",
    group: "system",
    desc: "Phối hợp giữa các công việc dự án",
    columns: [{ name: "id", desc: "UUID" }],
  },
  {
    name: "so_do_he_thong",
    group: "system",
    desc: "Sơ đồ hệ thống đã lưu",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "ten", desc: "Tên sơ đồ" },
      { name: "he_thong_ten", desc: "Tên hệ thống" },
      { name: "don_vi_ma", desc: "Mã đơn vị" },
    ],
  },
  {
    name: "so_do_tep_dinh_kem",
    group: "system",
    desc: "Tệp đính kèm sơ đồ",
    columns: [{ name: "id", desc: "UUID" }, { name: "so_do_id", desc: "Sơ đồ", enumOf: "so_do_he_thong" }],
    relations: ["so_do_id -> so_do_he_thong.id"],
  },
  {
    name: "so_do_thu_vien_hinh",
    group: "system",
    desc: "Thư viện hình khối cho sơ đồ",
    columns: [{ name: "id", desc: "UUID" }],
  },
  {
    name: "notifications",
    group: "system",
    desc: "Thông báo của người dùng",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "loai", desc: "Loại" },
      { name: "tieu_de", desc: "Tiêu đề" },
      { name: "read_at", desc: "Thời điểm đã đọc (null = chưa đọc)" },
    ],
  },
  {
    name: "cay_node_edit",
    group: "system",
    desc: "Ghi đè tổ chức cây hệ thống (di chuyển node, đổi tên)",
    columns: [{ name: "id", desc: "UUID" }, { name: "ten", desc: "Tên hiển thị" }],
  },
  {
    name: "he_thong_truong",
    group: "system",
    desc: "Đăng ký trường động khai thêm cho tài sản theo phạm vi",
    columns: [
      { name: "id", desc: "UUID" },
      { name: "field_key", desc: "Khoá trường (lưu trong thiet_bi.thuoc_tinh)" },
      { name: "hoat_dong", desc: "Đang bật (boolean)" },
    ],
  },
  {
    name: "profiles",
    group: "system",
    desc: "Hồ sơ người dùng",
    columns: [{ name: "id", desc: "UUID user" }, { name: "full_name", desc: "Họ tên" }],
  },
  {
    name: "user_roles",
    group: "system",
    desc: "Vai trò người dùng (admin/moderator/user)",
    columns: [{ name: "user_id", desc: "User" }, { name: "role", desc: "Vai trò" }],
  },
  {
    name: "audit_log",
    group: "system",
    desc: "Nhật ký thay đổi dữ liệu (rollback)",
    columns: [{ name: "id", desc: "UUID" }, { name: "table_name", desc: "Bảng bị thay đổi" }],
  },

  // ── Master data (danh mục nền dm_*) ──────────────────────
  { name: "dm_don_vi", group: "master", desc: "Danh mục Đơn vị", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_he_thong", group: "master", desc: "Danh mục Hệ thống", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }, { name: "ma_tai_san_bravo", desc: "Mã tài sản Bravo (cột vật lý cố định)" }] },
  { name: "dm_nhom_he_thong", group: "master", desc: "Danh mục Nhóm hệ thống", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  
  { name: "dm_vi_tri", group: "master", desc: "Danh mục Vị trí", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_loai_thiet_bi", group: "master", desc: "Danh mục Chủng loại", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_trang_thai_thiet_bi", group: "master", desc: "Danh mục Trạng thái tài sản", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_nha_san_xuat", group: "master", desc: "Danh mục Nhà sản xuất", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_nha_cung_cap", group: "master", desc: "Danh mục Nhà cung cấp", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_noi_cap", group: "master", desc: "Danh mục Nơi cấp", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_loai_giay_phep", group: "master", desc: "Danh mục Loại giấy phép", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
  { name: "dm_danh_gia_nien_han", group: "master", desc: "Danh mục Đánh giá niên hạn", columns: [{ name: "id", desc: "UUID" }, { name: "ma", desc: "Mã" }, { name: "ten", desc: "Tên" }] },
];

/** Danh mục nền (dm_*) – dùng cho tool list_danh_muc để tra id. */
export const DANH_MUC_TABLES: string[] = BUSINESS_TABLES.filter(
  (t) => t.group === "master",
).map((t) => t.name);

export function getKnownTableNames(): string[] {
  return BUSINESS_TABLES.map((t) => t.name);
}

export function getTableSpec(name: string): TableSpec | undefined {
  return BUSINESS_TABLES.find((t) => t.name === name);
}

/** Render bản đồ dữ liệu gọn cho system prompt. */
export function renderSchemaForPrompt(): string {
  const lines = BUSINESS_TABLES.map((t) => {
    const cols = t.columns
      .map((c) => (c.enumOf ? `${c.name}(→${c.enumOf})` : c.name))
      .join(", ");
    const fk = t.relations?.length ? ` | FK: ${t.relations.join("; ")}` : "";
    return `- ${t.name}: ${t.desc}. Cột: ${cols}${fk}`;
  });
  return lines.join("\n");
}
