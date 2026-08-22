import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { errResult, requireAuth, supabaseForUser, textResult } from "./_shared";

/* ================= HỆ THỐNG & THÀNH PHẦN ================= */

export const getHeThongLyLich = defineTool({
  name: "get_he_thong_ly_lich",
  title: "Sổ lý lịch hệ thống",
  description:
    "Snapshot toàn diện 1 hệ thống: thông tin, thành phần con, GPKT hiện hành, sự cố 30 ngày.",
  inputSchema: { he_thong_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ he_thong_id }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    const sb = supabaseForUser(ctx);
    const [ht, tp, gpkt, su_co] = await Promise.all([
      sb.from("dm_he_thong").select("*").eq("id", he_thong_id).maybeSingle(),
      sb
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten_thanh_phan, loai, trang_thai")
        .eq("he_thong_id", he_thong_id),
      sb
        .from("giay_phep_khai_thac")
        .select("id, so_giay_phep, co_quan_cap, ngay_cap, ngay_het_han, trang_thai")
        .eq("he_thong_id", he_thong_id)
        .order("ngay_het_han", { ascending: false })
        .limit(5),
      sb
        .from("su_co")
        .select("id, ma_su_co, hien_tuong, muc_do, trang_thai, ngay_phat_hien")
        .eq("he_thong_id", he_thong_id)
        .gte("ngay_phat_hien", new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10))
        .order("ngay_phat_hien", { ascending: false })
        .limit(20),
    ]);
    if (ht.error) return errResult(ht.error.message);
    return textResult({
      he_thong: ht.data,
      thanh_phan: tp.data ?? [],
      gpkt: gpkt.data ?? [],
      su_co_30_ngay: su_co.data ?? [],
    });
  },
});

export const getThanhPhanLyLich = defineTool({
  name: "get_thanh_phan_ly_lich",
  title: "Sổ lý lịch thành phần",
  description: "KPI (MTBF/MTTR/tỉ lệ đạt) và lịch sử tài sản gắn-tháo của 1 thành phần hệ thống.",
  inputSchema: { thanh_phan_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ thanh_phan_id }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    const sb = supabaseForUser(ctx);
    const [kpi, hist, info] = await Promise.all([
      sb.rpc("thanh_phan_kpi", { _tp_id: thanh_phan_id }),
      sb.rpc("thanh_phan_tai_san_history", { _tp_id: thanh_phan_id }),
      sb.from("he_thong_thanh_phan").select("*").eq("id", thanh_phan_id).maybeSingle(),
    ]);
    if (info.error) return errResult(info.error.message);
    return textResult({ thanh_phan: info.data, kpi: kpi.data, lich_su_tai_san: hist.data ?? [] });
  },
});

export const listThanhPhanByHeThong = defineTool({
  name: "list_thanh_phan_by_he_thong",
  title: "Danh sách thành phần theo hệ thống",
  description: "Liệt kê thành phần (vị trí chức năng) của một hệ thống kỹ thuật.",
  inputSchema: {
    he_thong_id: z.string().uuid(),
    limit: z.number().int().min(1).max(200).default(100),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ he_thong_id, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx)
      .from("he_thong_thanh_phan")
      .select("id, ma_thanh_phan, ten_thanh_phan, loai, trang_thai, thu_tu")
      .eq("he_thong_id", he_thong_id)
      .order("thu_tu", { ascending: true })
      .limit(limit);
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

/* ================= ĐỢT BẢO DƯỠNG ================= */

export const listDotBaoDuong = defineTool({
  name: "list_dot_bao_duong",
  title: "Danh sách đợt bảo dưỡng lớn",
  description: "Đợt bảo dưỡng lớn theo năm/đơn vị/trạng thái.",
  inputSchema: {
    nam: z.number().int().min(2000).max(2100).optional(),
    don_vi_id: z.string().uuid().optional(),
    trang_thai: z.enum(["nhap", "mo", "dang_thuc_hien", "dong", "huy"]).optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ nam, don_vi_id, trang_thai, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("dot_bao_duong")
      .select("*")
      .order("nam", { ascending: false })
      .limit(limit);
    if (nam) q = q.eq("nam", nam);
    if (don_vi_id) q = q.eq("don_vi_id", don_vi_id);
    if (trang_thai) q = q.eq("trang_thai", trang_thai);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const getDotBaoDuong = defineTool({
  name: "get_dot_bao_duong",
  title: "Chi tiết đợt bảo dưỡng",
  description: "Chi tiết đợt kèm tiến độ hạng mục (số dat/khong_dat/con lai).",
  inputSchema: { id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    const sb = supabaseForUser(ctx);
    const [dot, hm] = await Promise.all([
      sb.from("dot_bao_duong").select("*").eq("id", id).maybeSingle(),
      sb
        .from("dot_bao_duong_hang_muc")
        .select("id, he_thong_id, don_vi_id, trang_thai, ket_qua, nguon, han_hoan_thanh")
        .eq("dot_bao_duong_id", id)
        .limit(500),
    ]);
    if (dot.error) return errResult(dot.error.message);
    const items = hm.data ?? [];
    const summary = {
      tong: items.length,
      dat: items.filter((x) => x.ket_qua === "dat").length,
      khong_dat: items.filter((x) => x.ket_qua === "khong_dat").length,
      chua_bat_dau: items.filter((x) => x.trang_thai === "chua_bat_dau").length,
      dang_lam: items.filter((x) => x.trang_thai === "dang_lam").length,
      hoan_thanh: items.filter((x) => x.trang_thai === "hoan_thanh").length,
    };
    return textResult({ dot: dot.data, hang_muc: items, summary });
  },
});

/* ================= BẢO TRÌ / SỰ CỐ / HỎNG HÓC / VẤN ĐỀ ================= */

export const listBaoTri = defineTool({
  name: "list_bao_tri",
  title: "Danh sách phiếu bảo trì",
  description: "Phiếu bảo dưỡng, lọc theo hệ thống/đơn vị/khoảng ngày.",
  inputSchema: {
    he_thong_id: z.string().uuid().optional(),
    don_vi_id: z.string().uuid().optional(),
    tu_ngay: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ he_thong_id, don_vi_id, tu_ngay, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("bao_tri")
      .select(
        "id, ma_bao_tri, mo_ta_cong_viec, loai_bao_tri, he_thong_id, thiet_bi_id, don_vi_id, ngay_bat_dau, ngay_hoan_thanh, ket_qua",
      )
      .order("ngay_bat_dau", { ascending: false })
      .limit(limit);
    if (he_thong_id) q = q.eq("he_thong_id", he_thong_id);
    if (don_vi_id) q = q.eq("don_vi_id", don_vi_id);
    if (tu_ngay) q = q.gte("ngay_bat_dau", tu_ngay);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listSuCo = defineTool({
  name: "list_su_co",
  title: "Danh sách sự cố",
  description: "Sự cố kỹ thuật lọc theo trạng thái/mức độ/hệ thống/khoảng ngày.",
  inputSchema: {
    trang_thai: z.string().optional(),
    muc_do: z.string().optional(),
    he_thong_id: z.string().uuid().optional(),
    tu_ngay: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trang_thai, muc_do, he_thong_id, tu_ngay, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("su_co")
      .select(
        "id, ma_su_co, hien_tuong, muc_do, trang_thai, he_thong_id, thiet_bi_id, don_vi_id, ngay_phat_hien, nguoi_bao_cao",
      )
      .order("ngay_phat_hien", { ascending: false })
      .limit(limit);
    if (trang_thai) q = q.eq("trang_thai", trang_thai);
    if (muc_do) q = q.eq("muc_do", muc_do);
    if (he_thong_id) q = q.eq("he_thong_id", he_thong_id);
    if (tu_ngay) q = q.gte("ngay_phat_hien", tu_ngay);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listHongHoc = defineTool({
  name: "list_hong_hoc",
  title: "Danh sách hỏng hóc",
  description: "Hỏng hóc tài sản, lọc theo tài sản/khoảng ngày.",
  inputSchema: {
    thiet_bi_id: z.string().uuid().optional(),
    tu_ngay: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ thiet_bi_id, tu_ngay, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("hong_hoc")
      .select(
        "id, ma_hong_hoc, mo_ta_hong_hoc, bo_phan_hong, thiet_bi_id, ngay_hong, phuong_an, thiet_bi_thay_the_id",
      )
      .order("ngay_hong", { ascending: false })
      .limit(limit);
    if (thiet_bi_id) q = q.eq("thiet_bi_id", thiet_bi_id);
    if (tu_ngay) q = q.gte("ngay_hong", tu_ngay);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

export const listVanDe = defineTool({
  name: "list_van_de",
  title: "Danh sách vấn đề tồn đọng",
  description: "Vấn đề tồn đọng phát sinh từ sự cố/hỏng hóc; lọc theo trạng thái.",
  inputSchema: {
    trang_thai: z.string().optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ trang_thai, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("van_de")
      .select("id, ma_van_de, tieu_de, mo_ta, trang_thai, muc_do, he_thong_id, ngay_mo, ngay_dong")
      .order("ngay_mo", { ascending: false })
      .limit(limit);
    if (trang_thai) q = q.eq("trang_thai", trang_thai);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

/* ================= GIẤY PHÉP ================= */

export const listGiayPhepByHeThong = defineTool({
  name: "list_giay_phep_by_he_thong",
  title: "GPKT theo hệ thống",
  description: "Danh sách giấy phép khai thác của một hệ thống.",
  inputSchema: { he_thong_id: z.string().uuid() },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ he_thong_id }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    const { data, error } = await supabaseForUser(ctx)
      .from("giay_phep_khai_thac")
      .select("*")
      .eq("he_thong_id", he_thong_id)
      .order("ngay_het_han", { ascending: false });
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

/* ================= KHO ================= */

export const listKhoGiaoDich = defineTool({
  name: "list_kho_giao_dich",
  title: "Giao dịch kho",
  description: "Lịch sử nhập/xuất/điều chuyển kho.",
  inputSchema: {
    kho_id: z.string().uuid().optional(),
    limit: z.number().int().min(1).max(100).default(30),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ kho_id, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("kho_giao_dich")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (kho_id) q = q.eq("kho_id", kho_id);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});

/* ================= METRIC TIMESERIES ================= */

export const metricTimeseries = defineTool({
  name: "metric_timeseries",
  title: "Chuỗi thời gian chỉ số vận hành",
  description:
    "Đọc v_metric_timeseries: chỉ số bảo dưỡng (metric_key) của hệ thống theo thời gian.",
  inputSchema: {
    he_thong_id: z.string().uuid().optional(),
    metric_key: z.string().optional(),
    tu_ngay: z.string().optional(),
    den_ngay: z.string().optional(),
    limit: z.number().int().min(1).max(500).default(200),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ he_thong_id, metric_key, tu_ngay, den_ngay, limit }, ctx) => {
    const auth = requireAuth(ctx);
    if (auth) return auth;
    let q = supabaseForUser(ctx)
      .from("v_metric_timeseries")
      .select("*")
      .order("ts", { ascending: false })
      .limit(limit);
    if (he_thong_id) q = q.eq("he_thong_id", he_thong_id);
    if (metric_key) q = q.eq("metric_key", metric_key);
    if (tu_ngay) q = q.gte("ts", tu_ngay);
    if (den_ngay) q = q.lte("ts", den_ngay);
    const { data, error } = await q;
    if (error) return errResult(error.message);
    return textResult({ items: data ?? [] });
  },
});
