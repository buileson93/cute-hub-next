import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  buildListSql,
  buildGetRowSql,
  buildCountSql,
  buildDashboardSql,
  KNOWN_TABLES,
  type Filter,
} from "../../ai/query-helpers";

/** Tạo Supabase client chạy dưới quyền user (RLS đơn vị áp dụng). */
function supabaseForUser(ctx: ToolContext) {
  const token = ctx.getToken();
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function textResult(obj: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(obj, null, 2) }],
    structuredContent: obj as Record<string, unknown>,
  };
}

function errResult(msg: string) {
  return { content: [{ type: "text" as const, text: msg }], isError: true };
}

export const searchGlobal = defineTool({
  name: "search_global",
  title: "Tìm kiếm toàn hệ thống",
  description: "Tìm nhanh tài sản, giấy phép, biểu mẫu theo từ khoá (không dấu vẫn được).",
  inputSchema: {
    q: z.string().min(2).describe("Từ khoá tìm kiếm"),
    limit: z.number().int().min(1).max(30).default(10),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ q, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const { data, error } = await supabaseForUser(ctx).rpc("global_search", { _q: q, _limit: limit });
    if (error) return errResult(error.message);
    return textResult({ hits: data ?? [] });
  },
});

export const listThietBi = defineTool({
  name: "list_thiet_bi",
  title: "Danh sách tài sản",
  description: "Liệt kê tài sản theo bộ lọc (trạng thái, đơn vị, hệ thống, từ khoá).",
  inputSchema: {
    keyword: z.string().optional(),
    trang_thai_id: z.string().uuid().optional(),
    don_vi_quan_ly_id: z.string().uuid().optional(),
    he_thong_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ keyword, trang_thai_id, don_vi_quan_ly_id, he_thong_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    let q = supabaseForUser(ctx)
      .from("thiet_bi")
      .select("id, ma_thiet_bi, ten_thiet_bi, model, ma_serial, vi_tri, trang_thai_id, don_vi_quan_ly_id, he_thong_id, han_bao_hanh")
      .limit(limit);
    if (keyword) q = q.or(`ten_thiet_bi.ilike.%${keyword}%,ma_thiet_bi.ilike.%${keyword}%,ma_serial.ilike.%${keyword}%`);
    if (trang_thai_id) q = q.eq("trang_thai_id", trang_thai_id);
    if (don_vi_quan_ly_id) q = q.eq("don_vi_quan_ly_id", don_vi_quan_ly_id);
    if (he_thong_id) q = q.eq("he_thong_id", he_thong_id);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const getThietBi = defineTool({
  name: "get_thiet_bi",
  title: "Chi tiết tài sản",
  description: "Lấy chi tiết 1 tài sản theo id hoặc mã tài sản.",
  inputSchema: {
    id: z.string().uuid().optional(),
    ma_thiet_bi: z.string().optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ma_thiet_bi }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    if (!id && !ma_thiet_bi) return errResult("Cần id hoặc ma_thiet_bi");
    let q = supabaseForUser(ctx).from("thiet_bi").select("*").limit(1);
    if (id) q = q.eq("id", id);
    else if (ma_thiet_bi) q = q.eq("ma_thiet_bi", ma_thiet_bi);
    const { data, error } = await q.maybeSingle();
    if (error) return errResult(error.message);
    return textResult({ item: data });
  },
});

export const listGiayPhepSapHetHan = defineTool({
  name: "list_giay_phep_sap_het_han",
  title: "Giấy phép sắp hết hạn",
  description: "Danh sách giấy phép sẽ hết hạn trong X ngày tới.",
  inputSchema: {
    so_ngay: z.number().int().min(1).max(365).default(30),
    limit: z.number().int().min(1).max(100).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ so_ngay, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const today = new Date().toISOString().slice(0, 10);
    const until = new Date(Date.now() + so_ngay * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("giay_phep")
      .select("id, ma_giay_phep, so_giay_phep, ngay_cap, ngay_het_han, thiet_bi_id, ghi_chu")
      .gte("ngay_het_han", today)
      .lte("ngay_het_han", until)
      .order("ngay_het_han", { ascending: true })
      .limit(limit);
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listFormSubmissions = defineTool({
  name: "list_form_submissions",
  title: "Danh sách biểu mẫu",
  description: "Liệt kê biên bản/biểu mẫu đã nộp, lọc theo trạng thái/tài sản/loại.",
  inputSchema: {
    status: z.enum(["draft", "submitted", "reviewed", "signed", "rejected"]).optional(),
    thiet_bi_id: z.string().uuid().optional(),
    template_code: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status, thiet_bi_id, template_code, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    let q = supabaseForUser(ctx)
      .from("form_submission")
      .select("id, tieu_de, template_code, status, ky_bao_cao, submitted_at, reviewed_at, thiet_bi_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (status) q = q.eq("status", status);
    if (thiet_bi_id) q = q.eq("thiet_bi_id", thiet_bi_id);
    if (template_code) q = q.eq("template_code", template_code);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const countThietBiByTrangThai = defineTool({
  name: "count_thiet_bi_by_trang_thai",
  title: "Đếm tài sản theo trạng thái",
  description: "Thống kê số lượng tài sản theo từng trạng thái.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const sb = supabaseForUser(ctx);
    const { data, error } = await sb.rpc("rpc_count_thiet_bi_by_trang_thai");
    if (error) return errResult(error.message);
    const payload = (data ?? { total: 0, by_trang_thai: {} }) as { total: number; by_trang_thai: Record<string, number> };
    return textResult({ total: payload.total, by_trang_thai: payload.by_trang_thai });
  },
});

const tableEnum = z.enum(KNOWN_TABLES);
const filterSchema = z.object({
  column: z.string().describe("Tên cột"),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "is_null", "not_null"]),
  value: z.string().optional().describe("Giá trị so sánh (bỏ trống cho is_null/not_null)"),
});

export const describeSchema = defineTool({
  name: "describe_schema",
  title: "Mô tả lược đồ CSDL",
  description: "Trả về danh sách bảng nghiệp vụ, cột, kiểu dữ liệu và khoá ngoại để hiểu cấu trúc trước khi truy vấn.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const { data, error } = await supabaseForUser(ctx).rpc("ai_describe_schema");
    if (error) return errResult(error.message);
    return textResult(data);
  },
});

export const runSelectQuery = defineTool({
  name: "run_select_query",
  title: "Chạy truy vấn SELECT",
  description:
    "Chạy 1 câu SELECT/WITH bất kỳ trên CSDL (chỉ đọc, RLS theo quyền user, tối đa 500 dòng). Cho phép tương tác với TOÀN BỘ dữ liệu. Dùng describe_schema trước để biết cột & khoá ngoại.",
  inputSchema: {
    sql: z.string().min(6).describe("Câu SELECT hoàn chỉnh, không có ; ở cuối"),
    max_rows: z.number().int().min(1).max(500).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sql, max_rows }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", { _sql: sql, _max_rows: max_rows });
    if (error) return errResult(error.message);
    return textResult(data);
  },
});

export const listTable = defineTool({
  name: "list_table",
  title: "Liệt kê bảng bất kỳ",
  description:
    "Liệt kê bản ghi từ bất kỳ bảng nghiệp vụ nào (thiet_bi, giay_phep, tickets, du_an, so_do_he_thong, form_submission, notifications, dm_*...) với bộ lọc/sắp xếp. RLS áp dụng.",
  inputSchema: {
    table: tableEnum,
    columns: z.array(z.string()).optional(),
    filters: z.array(filterSchema).optional(),
    order_by: z.string().optional(),
    ascending: z.boolean().optional(),
    limit: z.number().int().min(1).max(500).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, columns, filters, order_by, ascending, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    try {
      const sql = buildListSql(table, { columns, filters: filters as Filter[] | undefined, order_by, ascending, limit });
      const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", { _sql: sql, _max_rows: limit });
      if (error) return errResult(error.message);
      return textResult(data);
    } catch (e) {
      return errResult(e instanceof Error ? e.message : String(e));
    }
  },
});

export const getRow = defineTool({
  name: "get_row",
  title: "Lấy 1 bản ghi",
  description: "Lấy đầy đủ 1 bản ghi từ bất kỳ bảng nào theo cột định danh (mặc định 'id').",
  inputSchema: {
    table: tableEnum,
    id_value: z.string(),
    id_column: z.string().default("id"),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, id_value, id_column }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    try {
      const sql = buildGetRowSql(table, id_column, id_value);
      const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", { _sql: sql, _max_rows: 1 });
      if (error) return errResult(error.message);
      return textResult(data);
    } catch (e) {
      return errResult(e instanceof Error ? e.message : String(e));
    }
  },
});

export const countBy = defineTool({
  name: "count_by",
  title: "Đếm / gom nhóm",
  description: "Đếm số bản ghi của một bảng, tuỳ chọn gom nhóm theo 1 cột và lọc.",
  inputSchema: {
    table: tableEnum,
    group_by: z.string().optional(),
    filters: z.array(filterSchema).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, group_by, filters }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    try {
      const sql = buildCountSql(table, group_by, filters as Filter[] | undefined);
      const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", { _sql: sql, _max_rows: 200 });
      if (error) return errResult(error.message);
      return textResult(data);
    } catch (e) {
      return errResult(e instanceof Error ? e.message : String(e));
    }
  },
});

export const dashboardStats = defineTool({
  name: "dashboard_stats",
  title: "Thống kê tổng quan",
  description: "Số liệu tổng quan: tài sản, giấy phép (và sắp hết hạn), biểu mẫu, tickets, dự án, sơ đồ.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", { _sql: buildDashboardSql(), _max_rows: 1 });
    if (error) return errResult(error.message);
    return textResult(data);
  },
});

export const listTickets = defineTool({
  name: "list_tickets",
  title: "Danh sách ticket",
  description: "Liệt kê ticket/yêu cầu hỗ trợ, lọc theo trạng thái/ưu tiên/loại.",
  inputSchema: {
    trang_thai: z.string().optional(),
    uu_tien: z.string().optional(),
    loai: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trang_thai, uu_tien, loai, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    let q = supabaseForUser(ctx)
      .from("tickets")
      .select("id, loai, tieu_de, trang_thai, uu_tien, assigned_to, don_vi, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (trang_thai) q = q.eq("trang_thai", trang_thai);
    if (uu_tien) q = q.eq("uu_tien", uu_tien);
    if (loai) q = q.eq("loai", loai);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listDuAn = defineTool({
  name: "list_du_an",
  title: "Danh sách dự án",
  description: "Liệt kê dự án, lọc theo trạng thái. Trả về tên, mã, tiến độ, mốc thời gian.",
  inputSchema: {
    trang_thai: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trang_thai, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    let q = supabaseForUser(ctx)
      .from("du_an")
      .select("id, ma, ten, trang_thai, tien_do, ngay_bat_dau, ngay_ket_thuc_du_kien, don_vi_id")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (trang_thai) q = q.eq("trang_thai", trang_thai);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listDanhMuc = defineTool({
  name: "list_danh_muc",
  title: "Danh sách danh mục nền",
  description: "Liệt kê danh mục nền (đơn vị, hệ thống, vị trí, loại/ trạng thái tài sản, nhà sản xuất...). Dùng để tra id lọc tài sản.",
  inputSchema: {
    table: z.enum([
      "dm_don_vi", "dm_he_thong", "dm_nhom_he_thong", "dm_vi_tri",
      "dm_loai_thiet_bi", "dm_trang_thai_thiet_bi", "dm_nha_san_xuat",
      "dm_nha_cung_cap", "dm_noi_cap", "dm_loai_giay_phep",
    ]),
    limit: z.number().int().min(1).max(200).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ table, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    const { data, error } = await supabaseForUser(ctx).rpc("ai_run_select", {
      _sql: `SELECT * FROM public.${table} ORDER BY 1 LIMIT ${limit}`,
      _max_rows: limit,
    });
    if (error) return errResult(error.message);
    return textResult(data);
  },
});

export const listNotifications = defineTool({
  name: "list_notifications",
  title: "Thông báo của tôi",
  description: "Liệt kê thông báo gần đây của người dùng hiện tại (tuỳ chọn chỉ chưa đọc).",
  inputSchema: {
    chua_doc: z.boolean().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ chua_doc, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return errResult("Chưa đăng nhập");
    let q = supabaseForUser(ctx)
      .from("notifications")
      .select("id, loai, tieu_de, noi_dung, link, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (chua_doc) q = q.is("read_at", null);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});
