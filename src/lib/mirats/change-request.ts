// N2 — Client library cho Change Request.
// Là lớp mỏng bọc RPC + hook đọc danh sách CR + nhãn hiển thị cho từng `loai`.
// UI KHÔNG được gọi trực tiếp mutation nhạy cảm — luôn đi qua `createChangeRequest`
// (hoặc dispatch tương đương trong RPC `approve_change_request` do admin gọi).

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";

export type ChangeRequestLoai =
  | "cay.delete_node"
  | "cay.restore_node"
  | "cay.hard_delete_node"
  | "cay.reorg"
  | "thiet_bi.change_model"
  | "thiet_bi.change_don_vi"
  | "thiet_bi.propose_field"
  | "he_thong.change_nhom"
  | "he_thong.change_don_vi"
  | "he_thong.propose_field"
  | "danh_muc.merge"
  | "danh_muc.deactivate"
  | "dm.propose_new"
  | "role.grant"
  | "role.revoke";

export type ChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "applied_failed";

export type ChangeRequestRow = {
  id: string;
  loai: ChangeRequestLoai;
  payload: Record<string, unknown>;
  ghi_chu: string | null;
  nguoi_tao: string;
  trang_thai: ChangeRequestStatus;
  ly_do: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  applied_audit_id: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

export const LOAI_LABEL: Record<ChangeRequestLoai, string> = {
  "cay.delete_node": "Xoá mềm node cây",
  "cay.restore_node": "Khôi phục node",
  "cay.hard_delete_node": "Xoá cứng node",
  "cay.reorg": "Đổi cấu trúc cây",
  "thiet_bi.change_model": "Đổi model tài sản",
  "thiet_bi.change_don_vi": "Chuyển tài sản sang đơn vị khác",
  "thiet_bi.propose_field": "Đề xuất sửa thông tin tài sản",
  "he_thong.change_nhom": "Đổi nhóm hệ thống",
  "he_thong.change_don_vi": "Đổi đơn vị của hệ thống",
  "he_thong.propose_field": "Đề xuất sửa thông tin hệ thống",
  "danh_muc.merge": "Gộp danh mục",
  "danh_muc.deactivate": "Vô hiệu hoá danh mục",
  "dm.propose_new": "Đề xuất giá trị danh mục mới",
  "role.grant": "Cấp vai trò",
  "role.revoke": "Thu hồi vai trò",
};

export const STATUS_LABEL: Record<ChangeRequestStatus, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Đã từ chối",
  cancelled: "Đã huỷ",
  applied_failed: "Áp dụng lỗi",
};

export const STATUS_TONE: Record<ChangeRequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  rejected: "border-red-500/30 bg-red-500/10 text-red-600",
  cancelled: "border-border bg-muted text-muted-foreground",
  applied_failed: "border-red-500/30 bg-red-500/10 text-red-600",
};

/** Danh sách các loại CR mà `approve_change_request` đã có dispatcher. */
const SUPPORTED_APPLY: ChangeRequestLoai[] = [
  "danh_muc.merge",
  "danh_muc.deactivate",
  "role.grant",
  "role.revoke",
  "thiet_bi.change_don_vi",
  "he_thong.change_nhom",
  "he_thong.change_don_vi",
];

export function isApplySupported(loai: ChangeRequestLoai): boolean {
  return SUPPORTED_APPLY.includes(loai);
}

/** Tạo change request. Trả về id của CR mới. */
export async function createChangeRequest(
  loai: ChangeRequestLoai,
  payload: Record<string, unknown>,
  ghi_chu?: string,
): Promise<string> {
  if (!payload || typeof payload !== "object") throw new Error("invalid_payload");
  const { data, error } = await supabase.rpc("create_change_request", {
    p_loai: loai,
    p_payload: payload as never,
    p_ghi_chu: ghi_chu ?? undefined,
  });
  if (error) throw error;
  return data as string;
}

export async function approveChangeRequest(id: string, ly_do?: string): Promise<void> {
  const { error } = await supabase.rpc("approve_change_request", {
    p_id: id,
    p_ly_do: ly_do ?? undefined,
  });
  if (error) throw error;
}

export async function rejectChangeRequest(id: string, ly_do: string): Promise<void> {
  if (!ly_do || ly_do.trim().length < 5) {
    throw new Error("Lý do từ chối cần ≥ 5 ký tự");
  }
  const { error } = await supabase.rpc("reject_change_request", {
    p_id: id,
    p_ly_do: ly_do.trim(),
  });
  if (error) throw error;
}

export async function cancelChangeRequest(id: string): Promise<void> {
  const { error } = await supabase.rpc("cancel_change_request", { p_id: id });
  if (error) throw error;
}

export type ChangeRequestFilter = {
  trang_thai?: ChangeRequestStatus | "all";
  loai?: ChangeRequestLoai | "all";
  limit?: number;
};

/** Hook đọc danh sách CR. RLS chốt cuối — server sẽ tự lọc theo vai trò. */
export function useChangeRequests(filter: ChangeRequestFilter = {}) {
  return useQuery<ChangeRequestRow[]>({
    queryKey: ["change_request:list", filter],
    queryFn: async () => {
      let q = supabase
        .from("change_request")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(filter.limit ?? 200);
      if (filter.trang_thai && filter.trang_thai !== "all")
        q = q.eq("trang_thai", filter.trang_thai);
      if (filter.loai && filter.loai !== "all") q = q.eq("loai", filter.loai);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ChangeRequestRow[];
    },
    staleTime: 15_000,
  });
}

/** Số CR đang chờ duyệt — dùng cho badge trên sidebar. */
export function usePendingChangeRequestCount() {
  return useQuery<number>({
    queryKey: ["change_request:count:pending"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("change_request")
        .select("id", { count: "exact", head: true })
        .eq("trang_thai", "pending");
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

/** Tóm tắt payload cho hiển thị nhanh trong bảng danh sách. */
export function summarizePayload(
  loai: ChangeRequestLoai,
  payload: Record<string, unknown>,
): string {
  const p = payload ?? {};
  const s = (k: string) => (p[k] == null ? "" : String(p[k]));
  switch (loai) {
    case "danh_muc.merge":
      return `entity=${s("entity")} · giữ=${s("keep_id")} · bỏ=${s("drop_id")}`;
    case "danh_muc.deactivate":
      return `entity=${s("entity")} · id=${s("id")}`;
    case "dm.propose_new":
      return `danh mục=${s("entity")} · giá trị=${s("value")}`;
    case "role.grant":
    case "role.revoke":
      return `user=${s("user_id")} · role=${s("role")}`;
    case "thiet_bi.change_don_vi":
      return `tài sản=${s("thiet_bi_id")} → đơn vị=${s("to_don_vi_id")}`;
    case "thiet_bi.propose_field":
      return `tài sản=${s("target_id")} · ${s("field_key")}: ${s("gia_tri_cu")} → ${s("gia_tri_moi")}`;
    case "he_thong.change_nhom":
      return `hệ thống=${s("he_thong_id")} → nhóm=${s("to_nhom_id")}`;
    case "he_thong.change_don_vi":
      return `hệ thống=${s("he_thong_id")} → đơn vị=${s("to_don_vi_id")}`;
    case "he_thong.propose_field":
      return `hệ thống=${s("target_id")} · ${s("field_key")}: ${s("gia_tri_cu")} → ${s("gia_tri_moi")}`;
    case "cay.delete_node":
    case "cay.restore_node":
    case "cay.hard_delete_node":
      return `node=${s("node_id")} · entity=${s("entity")}`;
    case "cay.reorg":
      return `node=${s("node_id")} · ${s("from_parent")} → ${s("to_parent")}`;
    case "thiet_bi.change_model":
      return `tài sản=${s("thiet_bi_id")} · model ${s("from_model_id")} → ${s("to_model_id")}`;
    default:
      return JSON.stringify(p);
  }
}
