import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, requireAuth, supabaseForUser, textResult } from "./_shared";

/**
 * Tool ghi tác nghiệp – dùng RPC agent_add_* / ghi_kiem_ke / dong_van_de.
 * Đặt needsApproval=true để MCP client (Claude/ChatGPT) hỏi user xác nhận trước.
 */

export const createSuCo = defineTool({
  name: "create_su_co",
  title: "Tạo sự cố",
  description:
    "Tạo bản ghi sự cố mới. BẮT BUỘC hệ thống và hiện tượng. Trước khi gọi, hãy TÓM TẮT nội dung cho user duyệt.",
  inputSchema: {
    he_thong: z.string().min(2).describe("Tên hoặc mã hệ thống (bắt buộc)"),
    hien_tuong: z.string().min(3).describe("Hiện tượng sự cố (bắt buộc)"),
    thiet_bi: z.string().optional().describe("Tên/mã tài sản liên quan"),
    don_vi: z.string().optional().describe("Mã đơn vị (CRA/CLA/PBA/PCA/THO/PLK)"),
    muc_do: z.enum(["nhe", "trung_binh", "nghiem_trong"]).optional(),
    ngay_phat_hien: z.string().optional().describe("YYYY-MM-DD"),
    nguoi_bao_cao: z.string().optional(),
    nguyen_nhan: z.string().optional(),
    bien_phap_xu_ly: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const auth = requireAuth(ctx); if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx).rpc("agent_add_su_co", {
      p_he_thong: input.he_thong,
      p_hien_tuong: input.hien_tuong,
      p_thiet_bi: input.thiet_bi ?? null,
      p_don_vi: input.don_vi ?? null,
      p_muc_do: input.muc_do ?? null,
      p_ngay_phat_hien: input.ngay_phat_hien ?? null,
      p_nguoi_bao_cao: input.nguoi_bao_cao ?? null,
      p_nguyen_nhan: input.nguyen_nhan ?? null,
      p_bien_phap_xu_ly: input.bien_phap_xu_ly ?? null,
    });
    if (error) return errResult(error.message);
    return textResult({ ok: true, result: data });
  },
});

export const createBaoTri = defineTool({
  name: "create_bao_tri",
  title: "Tạo phiếu bảo trì",
  description:
    "Tạo phiếu bảo trì. BẮT BUỘC hệ thống và mô tả công việc. Tóm tắt cho user trước khi gọi.",
  inputSchema: {
    he_thong: z.string().min(2),
    mo_ta_cong_viec: z.string().min(3),
    thiet_bi: z.string().optional(),
    don_vi: z.string().optional(),
    loai_bao_tri: z.enum(["dinh_ky", "dot_xuat", "khac"]).optional(),
    ke_hoach: z.string().optional(),
    ngay_bat_dau: z.string().optional(),
    ngay_hoan_thanh: z.string().optional(),
    ket_qua: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const auth = requireAuth(ctx); if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx).rpc("agent_add_bao_tri", {
      p_he_thong: input.he_thong,
      p_mo_ta_cong_viec: input.mo_ta_cong_viec,
      p_thiet_bi: input.thiet_bi ?? null,
      p_don_vi: input.don_vi ?? null,
      p_loai_bao_tri: input.loai_bao_tri ?? null,
      p_ke_hoach: input.ke_hoach ?? null,
      p_ngay_bat_dau: input.ngay_bat_dau ?? null,
      p_ngay_hoan_thanh: input.ngay_hoan_thanh ?? null,
      p_ket_qua: input.ket_qua ?? null,
    });
    if (error) return errResult(error.message);
    return textResult({ ok: true, result: data });
  },
});

export const createHongHoc = defineTool({
  name: "create_hong_hoc",
  title: "Tạo bản ghi hỏng hóc",
  description:
    "Ghi nhận hỏng hóc của một tài sản. BẮT BUỘC tài sản và mô tả. Tóm tắt cho user trước khi gọi.",
  inputSchema: {
    thiet_bi_hong: z.string().min(2).describe("Tên/mã tài sản bị hỏng"),
    mo_ta_hong_hoc: z.string().min(3),
    su_co: z.string().optional().describe("Mã sự cố liên quan"),
    ngay_hong: z.string().optional(),
    bo_phan_hong: z.string().optional(),
    phuong_an: z.string().optional(),
    thiet_bi_thay_the: z.string().optional().describe("Tên/mã tài sản dùng thay thế"),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const auth = requireAuth(ctx); if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx).rpc("agent_add_hong_hoc", {
      p_thiet_bi_hong: input.thiet_bi_hong,
      p_mo_ta_hong_hoc: input.mo_ta_hong_hoc,
      p_su_co: input.su_co ?? null,
      p_ngay_hong: input.ngay_hong ?? null,
      p_bo_phan_hong: input.bo_phan_hong ?? null,
      p_phuong_an: input.phuong_an ?? null,
      p_thiet_bi_thay_the: input.thiet_bi_thay_the ?? null,
    });
    if (error) return errResult(error.message);
    return textResult({ ok: true, result: data });
  },
});

export const ghiKiemKe = defineTool({
  name: "create_kiem_ke_ghi",
  title: "Ghi nhận kiểm kê tài sản",
  description: "Ghi kiểm kê cho 1 tài sản: tình trạng, GPS, ảnh, ghi chú.",
  inputSchema: {
    thiet_bi_id: z.string().uuid(),
    tinh_trang: z.string().min(1),
    nguoi_kiem: z.string().optional(),
    vi_tri_gps: z.string().optional(),
    anh_url: z.string().optional(),
    ghi_chu: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const auth = requireAuth(ctx); if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx).rpc("ghi_kiem_ke", {
      _thiet_bi_id: input.thiet_bi_id,
      _tinh_trang: input.tinh_trang,
      _nguoi_kiem: input.nguoi_kiem ?? null,
      _vi_tri_gps: input.vi_tri_gps ?? null,
      _anh_url: input.anh_url ?? null,
      _ghi_chu: input.ghi_chu ?? null,
    });
    if (error) return errResult(error.message);
    return textResult({ ok: true, result: data });
  },
});

export const closeVanDe = defineTool({
  name: "close_van_de",
  title: "Đóng vấn đề tồn đọng",
  description: "Đóng 1 vấn đề (van_de) với ghi chú lý do đóng.",
  inputSchema: {
    id: z.string().uuid(),
    ghi_chu: z.string().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ id, ghi_chu }, ctx) => {
    const auth = requireAuth(ctx); if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx).rpc("dong_van_de", {
      p_id: id,
      p_ghi_chu: ghi_chu ?? null,
    });
    if (error) return errResult(error.message);
    return textResult({ ok: true, result: data });
  },
});