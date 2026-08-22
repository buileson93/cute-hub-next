// ============================================================================
// Task 26 — Ma trận phân quyền GHI (write) dùng chung, khớp RLS/RPC ở CSDL.
// Mọi component chỉ nên gọi `canWrite(domain, roles)` thay vì kiểm tra role rời rạc.
// Nguồn: đối chiếu với chính sách CSDL và các module *-state (hỏng hóc, sự cố,
// vấn đề, công việc). Nếu ma trận DB thay đổi, cập nhật ở ĐÂY và trong test.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";

export type Domain =
  | "thiet_bi"
  | "he_thong"
  | "vi_tri"
  | "don_vi"
  | "su_co"
  | "van_de"
  | "bao_tri"
  | "cong_viec"
  | "hong_hoc"
  | "ban_giao"
  | "giay_phep"
  | "vat_tu"
  | "kho"
  | "kiem_ke"
  | "danh_muc"
  | "topology";

/** Vai trò được phép GHI theo từng miền. */
const MA_TRAN: Record<Domain, readonly AppRole[]> = {
  thiet_bi: ["admin", "phong_kt"],
  he_thong: ["admin", "phong_kt"],
  vi_tri: ["admin", "phong_kt"],
  don_vi: ["admin"],
  su_co: ["admin", "phong_kt", "ktv"],
  van_de: ["admin", "phong_kt"],
  bao_tri: ["admin", "phong_kt", "ktv"],
  cong_viec: ["admin", "phong_kt", "ktv", "to_truong"],
  hong_hoc: ["admin", "phong_kt", "ktv"],
  ban_giao: ["admin", "phong_kt", "ktv"],
  giay_phep: ["admin", "phong_kt"],
  vat_tu: ["admin", "phong_kt"],
  kho: ["admin", "phong_kt"],
  kiem_ke: ["admin", "phong_kt", "ktv"],
  danh_muc: ["admin", "phong_kt"],
  topology: ["admin", "phong_kt"],
};

/** Người dùng có quyền GHI ở miền này không? */
export function canWrite(domain: Domain, roles: readonly AppRole[] | null | undefined): boolean {
  if (!roles || roles.length === 0) return false;
  const allowed = MA_TRAN[domain];
  return roles.some((r) => allowed.includes(r));
}

/** Chỉ tra cứu = KHÔNG có bất kỳ quyền ghi nào trong danh sách miền. */
export function isReadOnly(
  domains: Domain[],
  roles: readonly AppRole[] | null | undefined,
): boolean {
  return !domains.some((d) => canWrite(d, roles));
}
