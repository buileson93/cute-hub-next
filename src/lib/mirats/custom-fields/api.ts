/**
 * Task 45 — Data access cho định nghĩa trường tuỳ biến.
 * Chỉ đọc; ghi/sửa dùng admin UI riêng qua supabase-js.
 */

import { supabase } from "@/integrations/backend/client";
import type { DinhNghiaTruong, LoaiTruong } from "./registry";

interface RawRow {
  id: string;
  key: string;
  nhan: string;
  loai: LoaiTruong;
  bat_buoc: boolean;
  lua_chon: string[] | null;
  ap_dung_cho: string;
  mo_ta: string | null;
  min_so: number | null;
  max_so: number | null;
  thu_tu: number;
  kich_hoat: boolean;
}

function map(r: RawRow): DinhNghiaTruong {
  return {
    key: r.key,
    nhan: r.nhan,
    loai: r.loai,
    batBuoc: r.bat_buoc,
    luaChon: r.lua_chon ?? undefined,
    apDungCho: r.ap_dung_cho,
    moTa: r.mo_ta ?? undefined,
    min: r.min_so ?? undefined,
    max: r.max_so ?? undefined,
  };
}

export async function fetchDinhNghiaTruong(entity: string): Promise<DinhNghiaTruong[]> {
  const { data, error } = await supabase
    .from("dinh_nghia_truong")
    .select("id,key,nhan,loai,bat_buoc,lua_chon,ap_dung_cho,mo_ta,min_so,max_so,thu_tu,kich_hoat")
    .eq("ap_dung_cho", entity)
    .eq("kich_hoat", true)
    .order("thu_tu", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as unknown as RawRow[]).map(map);
}
