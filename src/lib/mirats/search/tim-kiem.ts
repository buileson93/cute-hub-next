/**
 * Client wrapper cho RPC `tim_kiem_toan_cuc` (Task 46).
 * - Chuẩn hoá truy vấn qua `chuanHoaTruyVan`
 * - Debounce + react-query cache
 * - Tôn trọng RLS thông qua SECURITY INVOKER phía DB
 */
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { chuanHoaTruyVan } from "./chuan-hoa";

export interface KetQuaTim {
  loai: string;
  id: string;
  tieuDe: string;
  motaNgan: string;
  route: string;
  hang: number;
}

const NHAN_LOAI: Record<string, string> = {
  thiet_bi: "Tài sản",
  su_co: "Sự cố",
  van_de: "Vấn đề",
  cong_viec_bao_tri: "Công việc bảo dưỡng",
  bao_tri: "Bảo dưỡng",
  hong_hoc: "Hỏng hóc",
  ban_giao: "Bàn giao",
  giay_phep_khai_thac: "Giấy phép",
  vat_tu: "Vật tư",
  dm_he_thong: "Hệ thống",
  trang: "Trang",
};

export function nhanLoai(loai: string): string {
  return NHAN_LOAI[loai] ?? loai;
}

export async function timKiemToanCuc(
  q: string,
  opts: { loai?: string | null; gioiHan?: number } = {},
): Promise<KetQuaTim[]> {
  const cleaned = chuanHoaTruyVan(q);
  if (!cleaned) return [];
  const { data, error } = await supabase.rpc("tim_kiem_toan_cuc", {
    _q: q,
    _loai: opts.loai ?? undefined,
    _gioi_han: opts.gioiHan ?? 30,
  });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => ({
    loai: String(r.loai),
    id: String(r.id),
    tieuDe: String(r.tieu_de),
    motaNgan: String(r.mota_ngan ?? ""),
    route: String(r.route),
    hang: Number(r.hang ?? 0),
  }));
}

const DEBOUNCE_MS = 150;

export function useTimKiemToanCuc(rawQ: string, opts: { loai?: string | null; gioiHan?: number } = {}) {
  const term = rawQ.trim();
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [term]);
  const cleaned = chuanHoaTruyVan(debounced);
  const enabled = cleaned.length > 0;
  const query = useQuery({
    queryKey: ["tim_kiem_toan_cuc", debounced, opts.loai ?? null, opts.gioiHan ?? 30],
    queryFn: () => timKiemToanCuc(debounced, opts),
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });
  return {
    ket_qua: (query.data ?? []) as KetQuaTim[],
    dang_tai: enabled && (query.isFetching || term !== debounced),
    activeTerm: debounced,
    hasQuery: enabled,
  };
}
