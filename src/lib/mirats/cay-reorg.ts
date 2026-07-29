// ============================================================================
// Sắp xếp lại cây hệ thống trực tiếp trên sơ đồ + khai báo trường dữ liệu
// tuỳ chỉnh cho lớp Tài sản (phạm vi từng hệ thống).
//
// Ghi vào CSDL qua các hàm RPC bảo mật:
//   cay_submit_change  — gửi thay đổi (admin áp dụng ngay, phòng KT chờ duyệt)
//   cay_duyet          — admin duyệt / từ chối
//   cay_hoan_tac       — admin hoàn tác về dữ liệu cũ (nút "back")
// ============================================================================

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";

// Bảng/RPC mới chưa có trong types sinh tự động → dùng lớp bọc lỏng kiểu.
type SbRes = Promise<{ data: unknown; error: { message: string } | null }>;
interface SbBuilder extends SbRes {
  eq: (col: string, val: unknown) => SbBuilder;
  order: (c: string, o?: { ascending: boolean }) => SbBuilder;
  limit: (n: number) => SbBuilder;
}
const sb = supabase as unknown as {
  rpc: (fn: string, args?: Record<string, unknown>) => SbRes;
  from: (t: string) => { select: (c: string) => SbBuilder };
};

/* ----------------------- Trường dữ liệu tuỳ chỉnh ----------------------- */

export type FieldKind = "text" | "number" | "date" | "select" | "textarea" | "reference";

export interface HeThongTruong {
  id: string;
  he_thong_id: string;
  field_key: string;
  nhan: string;
  kieu: FieldKind;
  tuy_chon: string[];
  thu_tu: number;
  help_text: string | null;
  bat_buoc: boolean;
  rang_buoc: { regex?: string; min?: number; max?: number; ref?: string } | null;
  mac_dinh: unknown;
  nhom_field: string | null;
}

export function useHeThongTruong(heThongId: string | null | undefined) {
  return useQuery({
    queryKey: ["he_thong_truong", heThongId],
    enabled: !!heThongId,
    queryFn: async (): Promise<HeThongTruong[]> => {
      const { data, error } = await sb
        .from("he_thong_truong")
        .select("id,he_thong_id,field_key,nhan,kieu,tuy_chon,thu_tu,help_text,bat_buoc,nhom_field")
        .eq("he_thong_id", heThongId)
        .order("thu_tu");
      if (error) throw new Error(error.message);
      return ((data ?? []) as Array<Omit<HeThongTruong, "rang_buoc" | "mac_dinh">>).map((r) => ({
        ...r,
        tuy_chon: Array.isArray(r.tuy_chon) ? r.tuy_chon : [],
        bat_buoc: r.bat_buoc === true,
        rang_buoc: null,
        mac_dinh: null,
      }));
    },
  });
}

/** Danh sách field_set (nhóm trường dùng lại) để chọn ở dropdown nhom_field. */
export interface FieldSet {
  id: string;
  ten: string;
  mo_ta: string | null;
}

export function useFieldSets() {
  return useQuery({
    queryKey: ["field_set"],
    queryFn: async (): Promise<FieldSet[]> => {
      const { data, error } = await sb
        .from("field_set")
        .select("id,ten,mo_ta")
        .order("ten");
      if (error) throw new Error(error.message);
      return (data ?? []) as FieldSet[];
    },
  });
}

/* -------------------------- Hàng đợi thay đổi -------------------------- */

export interface CayThayDoi {
  id: string;
  loai: "move_system" | "custom_fields" | string;
  he_thong_id: string | null;
  mo_ta: string | null;
  payload: Record<string, unknown>;
  trang_thai: string;
  da_ap_dung: boolean;
  da_hoan_tac: boolean;
  nguoi_tao: string | null;
  created_at: string;
}

export function useCayThayDoi() {
  return useQuery({
    queryKey: ["cay_thay_doi"],
    queryFn: async (): Promise<CayThayDoi[]> => {
      const { data, error } = await sb
        .from("cay_thay_doi")
        .select("id,loai,he_thong_id,mo_ta,payload,trang_thai,da_ap_dung,da_hoan_tac,nguoi_tao,created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw new Error(error.message);
      return (data ?? []) as CayThayDoi[];
    },
  });
}

/* ------------------------------- RPC hooks ------------------------------- */

export function useCayRpc() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
    qc.invalidateQueries({ queryKey: ["cay_thay_doi"] });
    qc.invalidateQueries({ queryKey: ["he_thong_truong"] });
    qc.invalidateQueries({ queryKey: ["ht_name_overrides"] });
    qc.invalidateQueries({ queryKey: ["tb_name_overrides"] });
  };

  const submit = useMutation({
    mutationFn: async (v: {
      loai: "move_system" | "move_systems" | "move_device" | "custom_fields";
      he_thong_id: string;
      mo_ta?: string;
      payload: Record<string, unknown>;
      /** Bỏ qua thông báo mặc định (để nơi gọi tự hiển thị toast + nút Hoàn tác). */
      _silent?: boolean;
    }) => {
      const { data, error } = await sb.rpc("cay_submit_change", {
        _loai: v.loai,
        _he_thong_id: v.he_thong_id,
        _mo_ta: v.mo_ta ?? null,
        _payload: v.payload,
      });
      if (error) throw new Error(error.message);
      return data as { id: string; applied: boolean };
    },
    onSuccess: (d, v) => {
      invalidate();
      if (v._silent) return;
      toast.success(d?.applied ? "Đã áp dụng vào cơ sở dữ liệu" : "Đã gửi, chờ admin duyệt");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được thay đổi"),
  });

  // Gửi nhiều thay đổi cùng lúc (gán/gỡ hàng loạt) — trả về danh sách id đã áp dụng
  // để nơi gọi có thể hiển thị nút Hoàn tác hàng loạt.
  const submitMany = useMutation({
    mutationFn: async (v: {
      items: Array<{
        loai: "move_system" | "move_systems" | "move_device" | "custom_fields";
        he_thong_id: string;
        mo_ta?: string;
        payload: Record<string, unknown>;
      }>;
      /** Bỏ qua thông báo mặc định. */
      silent?: boolean;
    }) => {
      const appliedIds: string[] = [];
      for (const it of v.items) {
        const { data, error } = await sb.rpc("cay_submit_change", {
          _loai: it.loai,
          _he_thong_id: it.he_thong_id,
          _mo_ta: it.mo_ta ?? null,
          _payload: it.payload,
        });
        if (error) throw new Error(error.message);
        const res = data as { id?: string; applied?: boolean } | null;
        if (res?.applied && res.id) appliedIds.push(res.id);
      }
      return { total: v.items.length, applied: appliedIds.length, appliedIds };
    },
    onSuccess: (d, v) => {
      invalidate();
      if (v.silent) return;
      toast.success(
        d.applied === d.total
          ? `Đã áp dụng ${d.total} thay đổi vào cơ sở dữ liệu`
          : `Đã gửi ${d.total} thay đổi, chờ admin duyệt`,
      );
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được thay đổi"),
  });

  const duyet = useMutation({
    mutationFn: async (v: { id: string; approve: boolean }) => {
      const { error } = await sb.rpc("cay_duyet", { _id: v.id, _approve: v.approve });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã cập nhật trạng thái duyệt");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thực hiện được"),
  });

  const hoanTac = useMutation({
    mutationFn: async (arg: string | { id: string; silent?: boolean }) => {
      const id = typeof arg === "string" ? arg : arg.id;
      const { error } = await sb.rpc("cay_hoan_tac", { _id: id });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, arg) => {
      invalidate();
      const silent = typeof arg === "object" && arg.silent;
      if (!silent) toast.success("Đã hoàn tác về dữ liệu cũ");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không hoàn tác được"),
  });

  return { submit, submitMany, duyet, hoanTac };
}
