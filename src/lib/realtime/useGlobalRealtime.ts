import { useEffect } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { freshChannel } from "@/lib/realtime/channel";
import {
  PAGED_TABLE_TO_KEYS,
  patchPagedCache,
  type RtEvent,
} from "@/lib/realtime/patch-paged-cache";

/**
 * Bản đồ bảng CSDL → các queryKey prefix cần invalidate khi bảng đó thay đổi.
 * Chỉ cần khớp phần tử đầu của queryKey (React Query so khớp prefix).
 * Nếu bảng không có mapping riêng, sẽ dùng chính tên bảng làm prefix.
 */
const TABLE_TO_KEYS: Record<string, string[]> = {
  thiet_bi: [
    "thiet_bi_by_ma",
    "tb_all_fields",
    "tb_name_overrides",
    "tb_ref_info",
    "operations_data",
    "thiet-bi-picker",
    "thiet-bi-chon",
    "thiet-bi-ranh",
    "thanh-phan-toan-cuc",
    "net-all-thanh-phan",
    "thanh_phan_cua_he_thong",
    "catalog_usage",
    "thiet_bi_tep",
  ],
  dm_he_thong: [
    "operations_data",
    "ht_name_overrides",
    "lien_ket_he_thong_cua",
    "so_do_he_thong",
    "v_do_thi_toan_canh",
    "v_do_thi_he_thong",
    "thanh-phan-toan-cuc",
    "he-thong-goi-y",
    "catalog",
    "catalog-simple",
    "net-all-thanh-phan",
  ],
  he_thong_thanh_phan: [
    "thanh_phan_cua_he_thong",
    "thanh-phan-toan-cuc",
    "net-all-thanh-phan",
    "net-inline-inner",
    "operations_data",
    "v_do_thi_toan_canh",
    "v_do_thi_he_thong",
    "vi-tri-chuc-nang",
    "vi-tri-chuc-nang-all",
    "thiet-bi-dang-lap",
    "ly-lich-vi-tri",
    "ly-lich-thanh-phan",
    "ly-lich-he-thong",
    "vai-tro-thiet-bi",
  ],
  lien_ket_he_thong: ["lien_ket_he_thong_cua", "v_do_thi_toan_canh"],
  lien_ket_khe: ["lien_ket_khe", "v_do_thi_toan_canh", "net-inline-inner"],
  gan_chuc_nang: [
    "thanh_phan_cua_he_thong",
    "operations_data",
    "vi-tri-chuc-nang-all",
    "thiet-bi-dang-lap",
    "thiet-bi-chon",
    "thiet-bi-picker",
    "thiet-bi-ranh",
    "ly-lich-vi-tri",
    "ly-lich-thanh-phan",
    "ly-lich-he-thong",
    "ly-lich-thiet-bi",
    "vai-tro-thiet-bi",
    "net-all-thanh-phan",
    "net-inline-inner",
  ],
  gan_linh_kien: [
    "operations_data",
    "khe-linh-kien",
    "linh-kien-dang-lap",
    "linh-kien-ranh",
    "thiet-bi-chon",
    "thiet-bi-picker",
    "ly-lich-khe-linh-kien",
    "ly-lich-thiet-bi",
    "vai-tro-thiet-bi",
    "net-inline-inner",
  ],
  su_co: ["operations_data", "nav-badge"],
  hong_hoc: ["operations_data", "nav-badge"],
  bao_tri: ["operations_data", "nav-badge"],
  cong_viec_bao_tri: ["operations_data", "nav-badge"],
  van_de: ["operations_data", "nav-badge"],
  kiem_ke: ["operations_data", "nav-badge"],
  kho_giao_dich: ["operations_data"],
  kho: ["operations_data"],
  vat_tu: ["operations_data"],
  ban_giao: ["operations_data"],
  giay_phep: ["operations_data", "nav-badge"],
  giay_phep_khai_thac: ["operations_data", "nav-badge"],
  form_submission: ["my-submissions", "submission", "operations_data"],
  form_submission_item_result: ["submission"],
  form_submission_thiet_bi: ["submission"],
  form_template: [
    "admin-form-templates",
    "forms-catalog",
    "template-by-code",
    "form-template",
    "bao-tri-templates",
  ],
  form_template_version: ["form-versions", "bao-tri-version-template"],
  form_template_he_thong: ["bao-tri-templates"],
  form_section: ["bao-tri-sections"],
  form_field: ["bao-tri-fields"],
  form_check_item: ["bao-tri-fields"],
  du_an: ["du-an", "du-an-list"],
  du_an_cong_viec: ["du-an-cv", "du-an"],
  du_an_moc: ["du-an-moc", "du-an"],
  du_an_cong_viec_phoi_hop: ["cv-phoi-hop", "du-an-cv"],
  thiet_bi_cap_phat: ["operations_data"],
  thiet_bi_ket_noi: ["operations_data"],
  thiet_bi_khe_linh_kien: [
    "operations_data",
    "net-inline-inner",
    "khe-linh-kien",
    "linh-kien-dang-lap",
    "linh-kien-ranh",
    "ly-lich-khe-linh-kien",
  ],
  thiet_bi_tep_dinh_kem: ["thiet_bi_tep"],
  thiet_bi_vong_doi: ["operations_data"],
  node_note: ["node_note", "node_note_search", "noted_node_ids"],
  audit_log: ["audit_log", "change_log", "audit_lap_thao"],
  anomaly_alert: ["operations_data"],
  canh_bao_het_han_log: ["operations_data"],
  cay_node_edit: ["cay_node_edit"],
  cay_thay_doi: ["cay_thay_doi"],
  so_do_he_thong: ["so_do_he_thong"],
  vi_tri_media: ["catalog"],
  he_thong_truong: ["operations_data"],
  dm_don_vi: ["catalog", "catalog-simple", "dm-don-vi", "my-don-vi"],
  dm_vi_tri: ["catalog", "catalog-simple"],
  dm_nhom_he_thong: ["catalog", "catalog-simple"],
  dm_loai_thiet_bi: ["catalog", "catalog-simple", "dm-loai-thiet-bi-all"],
  dm_model: [
    "catalog",
    "catalog-simple",
    "catalog-tools",
    "model_catalog",
    "model_refs",
    "ref_id_options",
  ],
  dm_nha_san_xuat: ["catalog", "catalog-simple", "nsx-tools"],
  dm_nha_cung_cap: ["catalog", "catalog-simple"],
  dm_phan_loai: ["catalog", "catalog-simple"],

  dm_loai_lien_ket: ["catalog", "catalog-simple"],
  dm_loai_giay_phep: ["catalog", "catalog-simple"],
  dm_noi_cap: ["catalog", "catalog-simple"],
  dm_to_chuc: ["catalog", "catalog-simple"],
  dm_trang_thai_thiet_bi: ["catalog", "catalog-simple"],
  dm_danh_gia_nien_han: ["catalog", "catalog-simple"],
  access_request: ["rbac"],
  user_roles: ["rbac", "phan_quyen_stats", "phan_quyen_audit"],
  user_scope: ["rbac"],
  role_permission: ["rbac"],
  profiles: ["all-profiles", "profiles-for", "audit_profiles", "phan_quyen_audit_profiles"],
};

function invalidateForTable(qc: QueryClient, table: string) {
  const prefixes = TABLE_TO_KEYS[table] ?? [table];
  for (const p of prefixes) {
    qc.invalidateQueries({ queryKey: [p] });
  }
}

/**
 * GĐ 5: patch cache trang paged đang xem thay vì invalidate.
 * Với các bảng có bản đồ trong `PAGED_TABLE_TO_KEYS`, ta cập nhật trực tiếp
 * `PagedResult.rows` / `total` để tránh round-trip refetch không cần thiết.
 */
function patchPagedForTable(
  qc: QueryClient,
  table: string,
  event: RtEvent,
  newRow: Record<string, unknown> | null,
  oldRow: Record<string, unknown> | null,
) {
  const prefixes = PAGED_TABLE_TO_KEYS[table];
  if (!prefixes) return;
  for (const p of prefixes) {
    patchPagedCache(qc, p, event, newRow, oldRow);
  }
}

/**
 * Mount một lần ở gốc app: lắng nghe realtime cho toàn bộ bảng nghiệp vụ và
 * làm mới React Query cache tương ứng, để UI cập nhật tức thì khi CSDL thay đổi
 * (kể cả khi thay đổi từ tài khoản khác, RPC, trigger, hay backend).
 */
export function useGlobalRealtime(enabled: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    // T47: Rút gọn danh sách bảng quan trọng để tối ưu hóa kết nối
    const CORE_TABLES = [
      "su_co",
      "bao_tri",
      "hong_hoc",
      "van_de",
      "ban_giao",
      "thiet_bi",
      "he_thong_thanh_phan",
      "gan_chuc_nang",
      "access_request",
      "user_roles",
      "messages",
      "notifications",
      "du_an",
      "du_an_moc",
      "du_an_cong_viec",
    ];

    let ch: ReturnType<typeof freshChannel> | null = null;
    try {
      ch = freshChannel("mirats-global");

      for (const table of CORE_TABLES) {
        if (!TABLE_TO_KEYS[table]) continue;

        ch = ch.on("postgres_changes", { event: "*", schema: "public", table }, (payload) => {
          const t = (payload.table as string) || table;
          const p2 = payload as unknown as { eventType?: string; new?: unknown; old?: unknown };
          const evt = p2.eventType as RtEvent | undefined;
          const newRow = (p2.new ?? null) as Record<string, unknown> | null;
          const oldRow = (p2.old ?? null) as Record<string, unknown> | null;

          if (evt === "INSERT" || evt === "UPDATE" || evt === "DELETE") {
            patchPagedForTable(qc, t, evt, newRow, oldRow);
          }
          invalidateForTable(qc, t);
        });
      }
      ch.subscribe((status) => {
        if (status === "CHANNEL_ERROR") {
          console.warn("Global realtime subscription channel error");
        }
      });
    } catch (e) {
      console.warn("Global realtime subscribe failed", e);
    }
    return () => {
      if (ch) supabase.removeChannel(ch);
    };
  }, [enabled, qc]);
}
