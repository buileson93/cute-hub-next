// Client-side wrappers gọi các RPC nguyên tử ghi_su_co_atomic / ghi_bao_duong_atomic /
// ghi_hong_hoc_atomic. Sau khi ghi, ĐỌC LẠI bản ghi từ DB (không tin state client).
//
// Hai lớp:
//   1) Cũ (giữ nguyên chữ ký): nhận 1 tài sản + hiện tượng/mô tả — dùng ở
//      những nơi chỉ khai nhanh 1 sự cố/bảo dưỡng/hỏng hóc (VD từ node đồ hoạ).
//   2) *Full (mới): nhận payload jsonb đầy đủ — dùng bởi 3 form khai
//      (/su-co/moi, /bao-tri/moi, /hong-hoc/moi). Cả insert vào bảng sổ lý
//      lịch + form_submission + vật tư tiêu hao đều nằm trong 1 transaction
//      phía DB.

import { supabase } from "@/integrations/backend/client";
import type { VatTuTieuHao } from "@/lib/mirats/ghi-nghiep-vu";
import { throwRpcError } from "@/lib/mirats/rpc-error";

function toVatTuJson(dsVT?: VatTuTieuHao[]) {
  return (dsVT ?? []).map((v) => ({
    vat_tu_id: v.vat_tu_id,
    kho_id: v.kho_id,
    so_luong: v.so_luong,
  }));
}

// ---------------------------------------------------------------------------
// Lớp 1 — chữ ký cũ (1 tài sản)
// ---------------------------------------------------------------------------

export async function ghiSuCoAtomic(args: {
  thiet_bi_id: string;
  hien_tuong: string;
  ngay_phat_hien?: string;
  vatTu?: VatTuTieuHao[];
}) {
  const __payload = {
    p_thiet_bi_id: args.thiet_bi_id,
    p_hien_tuong: args.hien_tuong,
    p_ngay_phat_hien: args.ngay_phat_hien ?? null,
    p_vat_tu: toVatTuJson(args.vatTu),
  };
  const { data, error } = await supabase.rpc("ghi_su_co_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_su_co_atomic", __payload, error);
  const id = data as unknown as string;
  const readBack = await supabase.from("su_co").select("*").eq("id", id).single();
  if (readBack.error) throw readBack.error;
  return readBack.data;
}

export async function ghiBaoDuongAtomic(args: {
  thiet_bi_id: string;
  mo_ta: string;
  ngay_bat_dau?: string;
  vatTu?: VatTuTieuHao[];
}) {
  const __payload = {
    p_thiet_bi_id: args.thiet_bi_id,
    p_mo_ta: args.mo_ta,
    p_ngay_bat_dau: args.ngay_bat_dau ?? null,
    p_vat_tu: toVatTuJson(args.vatTu),
  };
  const { data, error } = await supabase.rpc("ghi_bao_duong_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_bao_duong_atomic", __payload, error);
  const id = data as unknown as string;
  const readBack = await supabase.from("bao_tri").select("*").eq("id", id).single();
  if (readBack.error) throw readBack.error;
  return readBack.data;
}

export async function ghiHongHocAtomic(args: {
  thiet_bi_id: string;
  mo_ta_hong_hoc: string;
  ngay_hong?: string;
  vatTu?: VatTuTieuHao[];
}) {
  const __payload = {
    p_thiet_bi_id: args.thiet_bi_id,
    p_mo_ta_hong_hoc: args.mo_ta_hong_hoc,
    p_ngay_hong: args.ngay_hong ?? null,
    p_vat_tu: toVatTuJson(args.vatTu),
  };
  const { data, error } = await supabase.rpc("ghi_hong_hoc_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_hong_hoc_atomic", __payload, error);
  const id = data as unknown as string;
  const readBack = await supabase.from("hong_hoc").select("*").eq("id", id).single();
  if (readBack.error) throw readBack.error;
  return readBack.data;
}

// ---------------------------------------------------------------------------
// Lớp 2 — payload đầy đủ (dùng bởi 3 form khai)
// Mỗi RPC nhận `p_payload jsonb` và tự chạy toàn bộ INSERT trong 1 transaction.
// ---------------------------------------------------------------------------

export interface GhiSuCoFullResult {
  ids: string[];
  ma_nhom_bc: string;
}

export async function ghiSuCoFull(payload: Record<string, unknown>): Promise<GhiSuCoFullResult> {
  const __payload = {
    p_payload: payload,
  };
  const { data, error } = await supabase.rpc("ghi_su_co_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_su_co_atomic", __payload, error);
  const r = data as { ids: string[]; ma_nhom_bc: string };
  // Đọc lại các bản ghi vừa tạo (readback) — chỉ để chắc chắn có mặt.
  if (r?.ids?.length) {
    const rb = await supabase.from("su_co").select("id").in("id", r.ids);
    if (rb.error) throw rb.error;
  }
  return r;
}

export interface GhiBaoDuongFullResult {
  submission_id: string;
  bao_tri_ids: string[];
}

export async function ghiBaoDuongFull(
  payload: Record<string, unknown>,
): Promise<GhiBaoDuongFullResult> {
  const __payload = {
    p_payload: payload,
  };
  const { data, error } = await supabase.rpc("ghi_bao_duong_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_bao_duong_atomic", __payload, error);
  const r = data as { submission_id: string; bao_tri_ids: string[] };
  if (r?.bao_tri_ids?.length) {
    const rb = await supabase.from("bao_tri").select("id").in("id", r.bao_tri_ids);
    if (rb.error) throw rb.error;
  }
  return r;
}

export interface GhiHongHocFullResult {
  ids: string[];
  ma_hong_hoc: string;
}

export async function ghiHongHocFull(
  payload: Record<string, unknown>,
): Promise<GhiHongHocFullResult> {
  const __payload = {
    p_payload: payload,
  };
  const { data, error } = await supabase.rpc("ghi_hong_hoc_atomic" as never, __payload as never);
  if (error) throwRpcError("ghi_hong_hoc_atomic", __payload, error);
  const r = data as { ids: string[]; ma_hong_hoc: string };
  if (r?.ids?.length) {
    const rb = await supabase.from("hong_hoc").select("id").in("id", r.ids);
    if (rb.error) throw rb.error;
  }
  return r;
}

/** 
 * Tạo một yêu cầu thay đổi (Change Request) để đề xuất cập nhật các trường dữ liệu.
 * Dùng khi user không có quyền ghi trực tiếp vào bảng đích (RLS).
 */
export async function createChangeRequest(args: {
  loai: "thiet_bi.propose_field" | "he_thong.propose_field" | "dm.propose_new";
  entity_id?: string;
  noi_dung: Record<string, any>;
  ghi_chu?: string;
}) {
  const { data, error } = await supabase
    .from("change_request")
    .insert({
      loai: args.loai,
      entity_id: args.entity_id,
      noi_dung: args.noi_dung,
      ghi_chu: args.ghi_chu,
      status: "pending",
    } as any)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

