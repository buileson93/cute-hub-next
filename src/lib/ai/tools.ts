/**
 * Bộ tool chia sẻ giữa AI chat trong app và MCP server.
 * Tất cả **chỉ đọc**, dùng supabase client của user gọi (RLS đơn vị áp dụng nguyên vẹn).
 */
import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildListSql,
  buildGetRowSql,
  buildCountSql,
  buildDashboardSql,
  KNOWN_TABLES,
  type Filter,
} from "./query-helpers";
import { BUSINESS_TABLES, DANH_MUC_TABLES } from "./data-dictionary";
import { describeDynamicFields } from "@/lib/mirats/registry";

const filterSchema = z.object({
  column: z.string().describe("Tên cột"),
  op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte", "like", "is_null", "not_null"]),
  value: z
    .string()
    .nullable()
    .optional()
    .describe("Giá trị so sánh (bỏ trống cho is_null/not_null)"),
});

const tableEnum = z.enum(KNOWN_TABLES);

type Ctx = {
  supabase: SupabaseClient;
  /** Bật kênh ghi (chỉ khi user là Admin/Phòng kỹ thuật). Mọi tool ghi đều cần user xác nhận. */
  canWrite?: boolean;
};

const trim = (s: string, n = 200) => (s.length > n ? s.slice(0, n) + "…" : s);

export function buildAiTools(ctx: Ctx) {
  const { supabase } = ctx;

  const readTools = {
    search_global: tool({
      description:
        "Tìm nhanh toàn hệ thống (tài sản, giấy phép, biểu mẫu) theo từ khoá tự do (không dấu vẫn được).",
      inputSchema: z.object({
        q: z.string().describe("Từ khoá tìm kiếm, tối thiểu 2 ký tự"),
        limit: z.number().int().min(1).max(30).default(10),
      }),
      execute: async ({ q, limit }) => {
        const { data, error } = await supabase.rpc("global_search", { _q: q, _limit: limit });
        if (error) return { error: error.message };
        return { hits: data ?? [] };
      },
    }),

    list_thiet_bi: tool({
      description:
        "Liệt kê tài sản theo bộ lọc. Trả về danh sách rút gọn (mã, tên, model, vị trí, trạng thái_id, đơn vị_id).",
      inputSchema: z.object({
        keyword: z.string().nullable().optional().describe("Tìm gần đúng theo tên/mã/serial"),
        trang_thai_id: z.string().uuid().nullable().optional(),
        don_vi_quan_ly_id: z.string().uuid().nullable().optional(),
        he_thong_id: z.string().uuid().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ keyword, trang_thai_id, don_vi_quan_ly_id, he_thong_id, limit }) => {
        let q = supabase
          .from("thiet_bi")
          .select(
            "id, ma_thiet_bi, ten_thiet_bi, model, ma_serial, vi_tri, trang_thai_id, don_vi_quan_ly_id, he_thong_id, han_bao_hanh",
            { count: "exact" },
          )
          .limit(limit);
        if (keyword)
          q = q.or(
            `ten_thiet_bi.ilike.%${keyword}%,ma_thiet_bi.ilike.%${keyword}%,ma_serial.ilike.%${keyword}%`,
          );
        if (trang_thai_id) q = q.eq("trang_thai_id", trang_thai_id);
        if (don_vi_quan_ly_id) q = q.eq("don_vi_quan_ly_id", don_vi_quan_ly_id);
        if (he_thong_id) q = q.eq("he_thong_id", he_thong_id);
        const { data, error, count } = await q;
        if (error) return { error: error.message };
        // count = tổng bản ghi khớp bộ lọc (không bị giới hạn bởi limit)
        return { items: data ?? [], count: count ?? data?.length ?? 0, tra_ve: data?.length ?? 0 };
      },
    }),

    get_thiet_bi: tool({
      description: "Chi tiết 1 tài sản theo id hoặc mã tài sản.",
      inputSchema: z.object({
        id: z.string().uuid().nullable().optional(),
        ma_thiet_bi: z.string().nullable().optional(),
      }),
      execute: async ({ id, ma_thiet_bi }) => {
        if (!id && !ma_thiet_bi) return { error: "Cần id hoặc ma_thiet_bi" };
        let q = supabase.from("thiet_bi").select("*").limit(1);
        if (id) q = q.eq("id", id);
        else if (ma_thiet_bi) q = q.eq("ma_thiet_bi", ma_thiet_bi);
        const { data, error } = await q.maybeSingle();
        if (error) return { error: error.message };
        return { item: data };
      },
    }),

    list_thiet_bi_sap_het_bao_hanh: tool({
      description:
        "Danh sách tài sản sắp hết hạn bảo hành trong X ngày tới (mặc định 30). Khớp câu hỏi 'Tài sản nào sắp hết hạn bảo hành?'.",
      inputSchema: z.object({
        so_ngay: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      execute: async ({ so_ngay, limit }) => {
        const today = new Date().toISOString().slice(0, 10);
        const until = new Date(Date.now() + so_ngay * 86400_000).toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("thiet_bi")
          .select(
            "id, ma_thiet_bi, ten_thiet_bi, model, han_bao_hanh, trang_thai_id, don_vi_quan_ly_id",
          )
          .gte("han_bao_hanh", today)
          .lte("han_bao_hanh", until)
          .order("han_bao_hanh", { ascending: true })
          .limit(limit);
        if (error) return { error: error.message };
        return { items: data ?? [] };
      },
    }),

    list_giay_phep_sap_het_han: tool({
      description: "Danh sách giấy phép sắp hết hạn trong X ngày tới (mặc định 30).",
      inputSchema: z.object({
        so_ngay: z.number().int().min(1).max(365).default(30),
        limit: z.number().int().min(1).max(100).default(50),
      }),
      execute: async ({ so_ngay, limit }) => {
        const today = new Date().toISOString().slice(0, 10);
        const until = new Date(Date.now() + so_ngay * 86400_000).toISOString().slice(0, 10);
        const { data, error } = await supabase
          .from("giay_phep")
          .select("id, ma_giay_phep, so_giay_phep, ngay_cap, ngay_het_han, thiet_bi_id, ghi_chu")
          .gte("ngay_het_han", today)
          .lte("ngay_het_han", until)
          .order("ngay_het_han", { ascending: true })
          .limit(limit);
        if (error) return { error: error.message };
        return { items: data ?? [] };
      },
    }),

    list_sap_het_han: tool({
      description:
        "Danh sách hợp nhất các mục SẮP HẾT HẠN từ view v_sap_het_han: bảo hành tài sản (loai='bao_hanh', từ thiet_bi.han_bao_hanh) VÀ giấy phép (loai='giay_phep', từ giay_phep.ngay_het_han), lọc theo số ngày còn lại. Khớp câu hỏi 'tài sản nào sắp hết bảo hành/giấy phép?'. Kết quả sắp xếp gần hết hạn trước; tôn trọng RLS.",
      inputSchema: z.object({
        so_ngay: z
          .number()
          .int()
          .min(0)
          .max(365)
          .default(60)
          .describe("Ngưỡng số ngày còn lại (vd 30/60/90)"),
        loai: z
          .enum(["bao_hanh", "giay_phep"])
          .nullable()
          .optional()
          .describe("Lọc theo loại (bỏ trống = cả hai)"),
        limit: z.number().int().min(1).max(200).default(100),
      }),
      execute: async ({ so_ngay, loai, limit }) => {
        let q = supabase
          .from("v_sap_het_han")
          .select("loai, thiet_bi_id, ten, ngay_het_han, so_ngay_con_lai")
          .gte("so_ngay_con_lai", 0)
          .lte("so_ngay_con_lai", so_ngay)
          .order("so_ngay_con_lai", { ascending: true })
          .limit(limit);
        if (loai) q = q.eq("loai", loai);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { items: data ?? [], tra_ve: data?.length ?? 0 };
      },
    }),

    list_form_submissions: tool({
      description:
        "Danh sách biên bản/biểu mẫu đã nộp, lọc theo trạng thái (draft/submitted/reviewed/signed) hoặc tài sản.",
      inputSchema: z.object({
        status: z
          .enum(["draft", "submitted", "reviewed", "signed", "rejected"])
          .nullable()
          .optional(),
        thiet_bi_id: z.string().uuid().nullable().optional(),
        template_code: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ status, thiet_bi_id, template_code, limit }) => {
        let q = supabase
          .from("form_submission")
          .select(
            "id, tieu_de, template_code, status, ky_bao_cao, submitted_at, reviewed_at, thiet_bi_id",
          )
          .order("created_at", { ascending: false })
          .limit(limit);
        if (status) q = q.eq("status", status);
        if (thiet_bi_id) q = q.eq("thiet_bi_id", thiet_bi_id);
        if (template_code) q = q.eq("template_code", template_code);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return {
          items: (data ?? []).map((r) => ({ ...r, tieu_de: r.tieu_de ? trim(r.tieu_de) : null })),
        };
      },
    }),

    count_thiet_bi_by_trang_thai: tool({
      description: "Đếm số tài sản theo từng trạng thái.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase.rpc("rpc_count_thiet_bi_by_trang_thai");
        if (error) return { error: error.message };
        const payload = (data ?? { total: 0, by_trang_thai: {} }) as {
          total: number;
          by_trang_thai: Record<string, number>;
        };
        return { total: payload.total, by_trang_thai: payload.by_trang_thai };
      },
    }),

    describe_schema: tool({
      description:
        "Trả về cấu trúc bảng nghiệp vụ: mô tả tiếng Việt + quan hệ (từ điển curated) kèm kiểu cột thực từ DB, VÀ danh sách trường động (khai thêm theo hệ thống) lưu trong cột JSONB thiet_bi.thuoc_tinh — kèm cách truy vấn thuoc_tinh->>'key'. Dùng để hiểu lược đồ trước khi tạo truy vấn.",
      inputSchema: z.object({
        he_thong_id: z
          .string()
          .nullable()
          .optional()
          .describe("Lọc trường động theo 1 hệ thống (bỏ trống = tất cả trường đang bật)"),
      }),
      execute: async ({ he_thong_id }) => {
        const { data: live, error } = await supabase.rpc("ai_describe_schema");

        // Trường động (he_thong_truong) — nhãn VN, kieu, bat_buoc + cách truy vấn JSONB.
        let dynQ = supabase
          .from("he_thong_truong")
          .select(
            "field_key, nhan, kieu, bat_buoc, thu_tu, help_text, nhom_field, he_thong_id, pham_vi",
          )
          .eq("hoat_dong", true)
          .eq("ap_dung_lop", "thiet_bi")
          .order("thu_tu", { ascending: true });
        if (he_thong_id) dynQ = dynQ.or(`he_thong_id.eq.${he_thong_id},pham_vi.eq.toan_cuc`);
        const { data: dynRows, error: dynErr } = await dynQ;

        return {
          dictionary: BUSINESS_TABLES,
          live: error ? { error: error.message } : live,
          truong_dong: dynErr ? { error: dynErr.message } : describeDynamicFields(dynRows),
        };
      },
    }),

    run_select_query: tool({
      description:
        "Chạy 1 câu SELECT (hoặc WITH ... SELECT) trên PostgreSQL để đọc dữ liệu. Chỉ đọc, không được INSERT/UPDATE/DELETE. Kết quả tự giới hạn tối đa 500 dòng và tôn trọng quyền RLS của user hiện tại. Luôn dùng schema `public.`.",
      inputSchema: z.object({
        sql: z.string().describe("Câu SELECT hoàn chỉnh, không có dấu ; ở cuối"),
        max_rows: z.number().int().min(1).max(500).default(100),
      }),
      execute: async ({ sql, max_rows }) => {
        const { data, error } = await supabase.rpc("ai_run_select", {
          _sql: sql,
          _max_rows: max_rows,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    list_table: tool({
      description:
        "Liệt kê bản ghi từ BẤT KỲ bảng nghiệp vụ nào (thiet_bi, giay_phep, tickets, du_an, so_do_he_thong, form_submission, notifications, dm_*...). Hỗ trợ lọc/sắp xếp. RLS áp dụng theo quyền user. Dùng describe_schema để biết tên cột.",
      inputSchema: z.object({
        table: tableEnum.describe("Tên bảng cần đọc"),
        columns: z
          .array(z.string())
          .nullable()
          .optional()
          .describe("Cột muốn lấy, bỏ trống = tất cả"),
        filters: z.array(filterSchema).nullable().optional(),
        order_by: z.string().nullable().optional(),
        ascending: z.boolean().nullable().optional(),
        limit: z.number().int().min(1).max(500).default(50),
      }),
      execute: async ({ table, columns, filters, order_by, ascending, limit }) => {
        try {
          const sql = buildListSql(table, {
            columns,
            filters: filters as Filter[] | null,
            order_by,
            ascending,
            limit,
          });
          const { data, error } = await supabase.rpc("ai_run_select", {
            _sql: sql,
            _max_rows: limit,
          });
          if (error) return { error: error.message };
          return data;
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) };
        }
      },
    }),

    get_row: tool({
      description: "Lấy 1 bản ghi đầy đủ từ bất kỳ bảng nào theo cột định danh (mặc định cột id).",
      inputSchema: z.object({
        table: tableEnum,
        id_value: z.string().describe("Giá trị định danh cần tìm"),
        id_column: z.string().default("id").describe("Cột định danh, mặc định 'id'"),
      }),
      execute: async ({ table, id_value, id_column }) => {
        try {
          const sql = buildGetRowSql(table, id_column, id_value);
          const { data, error } = await supabase.rpc("ai_run_select", { _sql: sql, _max_rows: 1 });
          if (error) return { error: error.message };
          return data;
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) };
        }
      },
    }),

    count_by: tool({
      description:
        "Đếm số bản ghi của một bảng, tuỳ chọn nhóm theo 1 cột (group by) và lọc. Ví dụ: đếm tài sản theo trang_thai_id, tickets theo trang_thai, du_an theo trang_thai.",
      inputSchema: z.object({
        table: tableEnum,
        group_by: z.string().nullable().optional().describe("Cột gom nhóm (bỏ trống = đếm tổng)"),
        filters: z.array(filterSchema).nullable().optional(),
      }),
      execute: async ({ table, group_by, filters }) => {
        try {
          const sql = buildCountSql(table, group_by, filters as Filter[] | null);
          const { data, error } = await supabase.rpc("ai_run_select", {
            _sql: sql,
            _max_rows: 200,
          });
          if (error) return { error: error.message };
          return data;
        } catch (e) {
          return { error: e instanceof Error ? e.message : String(e) };
        }
      },
    }),

    dashboard_stats: tool({
      description:
        "Số liệu tổng quan toàn hệ thống: tổng tài sản, giấy phép (và sắp hết hạn), biểu mẫu, tickets, dự án, sơ đồ.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase.rpc("ai_run_select", {
          _sql: buildDashboardSql(),
          _max_rows: 1,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    list_tickets: tool({
      description: "Liệt kê ticket/yêu cầu hỗ trợ, lọc theo trạng thái/ưu tiên/loại.",
      inputSchema: z.object({
        trang_thai: z.string().nullable().optional().describe("vd: open, in_progress, closed"),
        uu_tien: z.string().nullable().optional(),
        loai: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ trang_thai, uu_tien, loai, limit }) => {
        let q = supabase
          .from("tickets")
          .select("id, loai, tieu_de, trang_thai, uu_tien, assigned_to, don_vi, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (trang_thai) q = q.eq("trang_thai", trang_thai);
        if (uu_tien) q = q.eq("uu_tien", uu_tien);
        if (loai) q = q.eq("loai", loai);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return {
          items: (data ?? []).map((r) => ({ ...r, tieu_de: r.tieu_de ? trim(r.tieu_de) : null })),
        };
      },
    }),

    list_du_an: tool({
      description: "Liệt kê dự án, lọc theo trạng thái. Trả về tên, mã, tiến độ, mốc thời gian.",
      inputSchema: z.object({
        trang_thai: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ trang_thai, limit }) => {
        let q = supabase
          .from("du_an")
          .select(
            "id, ma, ten, trang_thai, tien_do, ngay_bat_dau, ngay_ket_thuc_du_kien, don_vi_id",
          )
          .order("created_at", { ascending: false })
          .limit(limit);
        if (trang_thai) q = q.eq("trang_thai", trang_thai);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { items: data ?? [] };
      },
    }),

    list_so_do: tool({
      description: "Liệt kê sơ đồ hệ thống đã lưu (tên, hệ thống, đơn vị).",
      inputSchema: z.object({
        keyword: z.string().nullable().optional(),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ keyword, limit }) => {
        let q = supabase
          .from("so_do_he_thong")
          .select("id, ten, mo_ta, he_thong_ten, don_vi_ma, updated_at")
          .order("updated_at", { ascending: false })
          .limit(limit);
        if (keyword) q = q.or(`ten.ilike.%${keyword}%,he_thong_ten.ilike.%${keyword}%`);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { items: data ?? [] };
      },
    }),

    list_danh_muc: tool({
      description:
        "Liệt kê một danh mục nền (đơn vị, hệ thống, vị trí, chủng loại, trạng thái, nhà sản xuất...). Dùng để tra id phục vụ lọc tài sản.",
      inputSchema: z.object({
        table: z.enum(DANH_MUC_TABLES as unknown as [string, ...string[]]),
        limit: z.number().int().min(1).max(200).default(100),
      }),
      execute: async ({ table, limit }) => {
        const { data, error } = await supabase.rpc("ai_run_select", {
          _sql: `SELECT * FROM public.${table} ORDER BY 1 LIMIT ${limit}`,
          _max_rows: limit,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    list_notifications: tool({
      description: "Liệt kê thông báo gần đây của người dùng hiện tại (chưa/đã đọc).",
      inputSchema: z.object({
        chua_doc: z.boolean().nullable().optional().describe("true = chỉ lấy chưa đọc"),
        limit: z.number().int().min(1).max(50).default(20),
      }),
      execute: async ({ chua_doc, limit }) => {
        let q = supabase
          .from("notifications")
          .select("id, loai, tieu_de, noi_dung, link, read_at, created_at")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (chua_doc) q = q.is("read_at", null);
        const { data, error } = await q;
        if (error) return { error: error.message };
        return { items: data ?? [] };
      },
    }),
  };

  if (!ctx.canWrite) return readTools;

  // ===== KÊNH GHI CÓ KIỂM SOÁT =====
  // Mỗi tool gọi đúng 1 RPC hẹp (SECURITY DEFINER + kiểm tra vai trò + ghi audit_log).
  // needsApproval: true → AI KHÔNG tự ghi; người dùng phải bấm xác nhận trước.
  const writeTools = {
    add_su_co: tool({
      description:
        "TẠO bản ghi SỰ CỐ kỹ thuật mới. Chỉ gọi khi người dùng yêu cầu ghi/lưu sự cố. Cần người dùng xác nhận trước khi ghi.",
      inputSchema: z.object({
        he_thong: z.string().describe("Tên hệ thống bị sự cố (bắt buộc)"),
        hien_tuong: z.string().describe("Mô tả hiện tượng sự cố (bắt buộc)"),
        thiet_bi: z.string().nullable().optional().describe("Tài sản liên quan"),
        don_vi: z.string().nullable().optional(),
        muc_do: z
          .string()
          .nullable()
          .optional()
          .describe("Mức độ, vd: Nhẹ/Trung bình/Nghiêm trọng"),
        ngay_phat_hien: z.string().nullable().optional().describe("Ngày phát hiện dạng YYYY-MM-DD"),
        nguoi_bao_cao: z.string().nullable().optional(),
        nguyen_nhan: z.string().nullable().optional(),
        bien_phap_xu_ly: z.string().nullable().optional(),
      }),
      needsApproval: true,
      execute: async (i) => {
        const { data, error } = await supabase.rpc("agent_add_su_co", {
          p_he_thong: i.he_thong,
          p_hien_tuong: i.hien_tuong,
          p_thiet_bi: i.thiet_bi ?? null,
          p_don_vi: i.don_vi ?? null,
          p_muc_do: i.muc_do ?? null,
          p_ngay_phat_hien: i.ngay_phat_hien ?? null,
          p_nguoi_bao_cao: i.nguoi_bao_cao ?? null,
          p_nguyen_nhan: i.nguyen_nhan ?? null,
          p_bien_phap_xu_ly: i.bien_phap_xu_ly ?? null,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    add_bao_tri: tool({
      description:
        "TẠO bản ghi BẢO DƯỠNG mới. Chỉ gọi khi người dùng yêu cầu ghi/lưu phiếu bảo dưỡng. Cần người dùng xác nhận trước khi ghi.",
      inputSchema: z.object({
        he_thong: z.string().describe("Tên hệ thống (bắt buộc)"),
        mo_ta_cong_viec: z.string().describe("Mô tả công việc bảo dưỡng (bắt buộc)"),
        thiet_bi: z.string().nullable().optional(),
        don_vi: z.string().nullable().optional(),
        loai_bao_tri: z.string().nullable().optional().describe("vd: Định kỳ/Đột xuất"),
        ke_hoach: z.string().nullable().optional(),
        ngay_bat_dau: z.string().nullable().optional().describe("YYYY-MM-DD"),
        ngay_hoan_thanh: z.string().nullable().optional().describe("YYYY-MM-DD"),
        ket_qua: z.string().nullable().optional(),
      }),
      needsApproval: true,
      execute: async (i) => {
        const { data, error } = await supabase.rpc("agent_add_bao_tri", {
          p_he_thong: i.he_thong,
          p_mo_ta_cong_viec: i.mo_ta_cong_viec,
          p_thiet_bi: i.thiet_bi ?? null,
          p_don_vi: i.don_vi ?? null,
          p_loai_bao_tri: i.loai_bao_tri ?? null,
          p_ke_hoach: i.ke_hoach ?? null,
          p_ngay_bat_dau: i.ngay_bat_dau ?? null,
          p_ngay_hoan_thanh: i.ngay_hoan_thanh ?? null,
          p_ket_qua: i.ket_qua ?? null,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    add_hong_hoc: tool({
      description:
        "TẠO bản ghi HỎNG HÓC mới. Chỉ gọi khi người dùng yêu cầu ghi/lưu hỏng hóc. Cần người dùng xác nhận trước khi ghi.",
      inputSchema: z.object({
        thiet_bi_hong: z.string().describe("Tên tài sản hỏng (bắt buộc)"),
        mo_ta_hong_hoc: z.string().describe("Mô tả hỏng hóc (bắt buộc)"),
        su_co: z.string().nullable().optional().describe("Mã/tên sự cố liên quan"),
        ngay_hong: z.string().nullable().optional().describe("YYYY-MM-DD"),
        bo_phan_hong: z.string().nullable().optional(),
        phuong_an: z.string().nullable().optional(),
        thiet_bi_thay_the: z.string().nullable().optional(),
      }),
      needsApproval: true,
      execute: async (i) => {
        const { data, error } = await supabase.rpc("agent_add_hong_hoc", {
          p_thiet_bi_hong: i.thiet_bi_hong,
          p_mo_ta_hong_hoc: i.mo_ta_hong_hoc,
          p_su_co: i.su_co ?? null,
          p_ngay_hong: i.ngay_hong ?? null,
          p_bo_phan_hong: i.bo_phan_hong ?? null,
          p_phuong_an: i.phuong_an ?? null,
          p_thiet_bi_thay_the: i.thiet_bi_thay_the ?? null,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),

    add_kiem_ke: tool({
      description:
        "TẠO bản ghi KIỂM KÊ tài sản. Cần id tài sản (dùng list_thiet_bi để tra id trước). Cần người dùng xác nhận trước khi ghi.",
      inputSchema: z.object({
        thiet_bi_id: z.string().uuid().describe("id tài sản (bắt buộc)"),
        tinh_trang: z.string().describe("Tình trạng kiểm kê (bắt buộc), vd: Tốt/Hỏng/Mất"),
        nguoi_kiem: z.string().nullable().optional(),
        ghi_chu: z.string().nullable().optional(),
        vi_tri_gps: z.string().nullable().optional(),
      }),
      needsApproval: true,
      execute: async (i) => {
        const { data, error } = await supabase.rpc("agent_add_kiem_ke", {
          p_thiet_bi_id: i.thiet_bi_id,
          p_tinh_trang: i.tinh_trang,
          p_nguoi_kiem: i.nguoi_kiem ?? null,
          p_ghi_chu: i.ghi_chu ?? null,
          p_vi_tri_gps: i.vi_tri_gps ?? null,
        });
        if (error) return { error: error.message };
        return data;
      },
    }),
  };

  return { ...readTools, ...writeTools };
}

export type AiTools = ReturnType<typeof buildAiTools>;
