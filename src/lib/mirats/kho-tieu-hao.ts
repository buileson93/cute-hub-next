/**
 * Task 15 — Khép vòng tiêu hao vật tư.
 *
 * Mỗi dòng "vật tư sử dụng" trong Công việc / Sự cố / Hỏng hóc sẽ gọi RPC
 * `kho_xuat` với đúng khoá liên kết (`_cong_viec_id` / `_su_co_id` /
 * `_hong_hoc_id`) → bảng `kho_giao_dich` sinh bút toán XUẤT, tồn kho và chi
 * phí phản ánh tiêu hao thực, không phải nhập tay hai lần.
 *
 * Module này chỉ chứa builder thuần để dựng tham số RPC — dễ test, không
 * chạm Supabase. Nơi gọi (form UI) truyền builder result vào
 * `supabase.rpc("kho_xuat", args)`.
 */
import { supabase } from "@/integrations/backend/client";

export interface DongTieuHao {
  vat_tu_id: string;
  kho_id: string;
  so_luong: number;
  don_gia?: number;
  ghi_chu?: string;
}

export interface LienKetTieuHao {
  congViecId?: string;
  suCoId?: string;
  hongHocId?: string;
}

/**
 * Dựng tham số cho RPC `kho_xuat`. Chỉ chèn khoá liên kết nếu có giá trị,
 * để phía DB nhận `NULL` cho các nhánh còn lại.
 */
export function buildXuatArgs(d: DongTieuHao, lienKet: LienKetTieuHao): Record<string, unknown> {
  if (!d.vat_tu_id) throw new Error("Thiếu vat_tu_id");
  if (!d.kho_id) throw new Error("Thiếu kho_id");
  if (!(d.so_luong > 0)) throw new Error("Số lượng phải > 0");

  const args: Record<string, unknown> = {
    _vat_tu_id: d.vat_tu_id,
    _kho_id: d.kho_id,
    _so_luong: d.so_luong,
  };
  if (typeof d.don_gia === "number" && d.don_gia >= 0) args._don_gia = d.don_gia;
  if (d.ghi_chu?.trim()) args._ghi_chu = d.ghi_chu.trim();
  if (lienKet.congViecId) args._cong_viec_id = lienKet.congViecId;
  if (lienKet.suCoId) args._su_co_id = lienKet.suCoId;
  if (lienKet.hongHocId) args._hong_hoc_id = lienKet.hongHocId;
  return args;
}

/**
 * Gọi RPC `kho_xuat` cho từng dòng. Trả về danh sách id bút toán đã tạo.
 * Dừng ngay khi gặp lỗi (không rollback các dòng trước — nghiệp vụ chấp nhận
 * ghi từng dòng, người dùng có thể sửa/xoá thủ công nếu cần).
 */
export async function ghiTieuHao(dong: DongTieuHao[], lienKet: LienKetTieuHao): Promise<string[]> {
  const ids: string[] = [];
  for (const d of dong) {
    const args = buildXuatArgs(d, lienKet);
    const { data, error } = await supabase.rpc("kho_xuat", args as never);
    if (error) throw error;
    if (typeof data === "string") ids.push(data);
  }
  return ids;
}
