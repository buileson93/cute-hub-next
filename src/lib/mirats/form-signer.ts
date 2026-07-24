// ============================================================================
// form-signer.ts — Logic THUẦN (pure) cho CHỮ KÝ nhiều người trên 1 biên bản.
//
// Một biên bản bảo dưỡng cần ít nhất 2 vai trò ký theo ĐÚNG QUYỀN & THỨ TỰ:
//   1. NGƯỜI THỰC HIỆN  (nguoi_thuc_hien) — kỹ thuật viên trực tiếp làm.
//   2. PHỤ TRÁCH/GIÁM SÁT (phu_trach)     — tổ trưởng / phụ trách đơn vị duyệt.
//
// Quy tắc:
//   • Mỗi vai trò ký cần QUYỀN phù hợp (canSignAs).
//   • THỨ TỰ: Phụ trách/Giám sát chỉ ký SAU khi Người thực hiện đã ký.
//   • TÁCH VAI: một người không được ký cả hai vai trò (separation of duties).
//   • Giữ `signed_by` / `signed_at` cũ trên form_submission làm FALLBACK khi
//     chưa có bản ghi signer nào (biên bản cũ) — `resolveSigners`.
//
// KHÔNG phụ thuộc React/Supabase → test được, dùng chung server/client.
// ============================================================================

import type { AppRole } from "@/hooks/use-session";

/** Vai trò ký trên biên bản. */
export type SignerRole = "nguoi_thuc_hien" | "phu_trach";

export const SIGNER_ROLE_LABEL: Record<SignerRole, string> = {
  nguoi_thuc_hien: "Người thực hiện",
  phu_trach: "Phụ trách/Giám sát",
};

/** Thứ tự ký (nhỏ hơn = ký trước). */
export const SIGNER_ROLE_ORDER: Record<SignerRole, number> = {
  nguoi_thuc_hien: 1,
  phu_trach: 2,
};

/** Danh sách vai trò ký theo thứ tự chuẩn. */
export const SIGNER_ROLES: SignerRole[] = ["nguoi_thuc_hien", "phu_trach"];

/**
 * Ma trận QUYỀN: app_role nào được ký ở vai trò nào.
 *   • Người thực hiện: kỹ thuật viên trở lên (ktv/to_truong/phong_kt/admin).
 *   • Phụ trách/Giám sát: cấp giám sát (to_truong/phu_trach_dv/phong_kt/admin).
 */
export const SIGNER_ALLOWED_ROLES: Record<SignerRole, ReadonlySet<AppRole>> = {
  nguoi_thuc_hien: new Set<AppRole>(["ktv", "to_truong", "phong_kt", "admin"]),
  phu_trach: new Set<AppRole>(["to_truong", "phu_trach_dv", "phong_kt", "admin"]),
};

/** Đúng nếu tập vai trò của người dùng cho phép ký ở `signerRole`. */
export function canSignAs(
  signerRole: SignerRole,
  appRoles: readonly AppRole[] | null | undefined,
): boolean {
  if (!appRoles || appRoles.length === 0) return false;
  const allowed = SIGNER_ALLOWED_ROLES[signerRole];
  return appRoles.some((r) => allowed.has(r));
}

/** 1 bản ghi chữ ký (đã ký). */
export type SignerRecord = {
  signer_role: SignerRole;
  signed_by: string;
  signed_at: string;
  ho_ten?: string | null;
};

/** Có bản ghi ký cho vai trò này chưa? */
export function hasSigned(
  signers: readonly SignerRecord[] | null | undefined,
  role: SignerRole,
): boolean {
  return (signers ?? []).some((s) => s.signer_role === role);
}

/**
 * Vai trò tiếp theo cần ký theo thứ tự chuẩn. Trả null nếu đã đủ chữ ký.
 */
export function nextSignerRole(
  signers: readonly SignerRecord[] | null | undefined,
): SignerRole | null {
  for (const role of SIGNER_ROLES) {
    if (!hasSigned(signers, role)) return role;
  }
  return null;
}

export type SignAttempt = {
  signerRole: SignerRole;
  userId: string;
  appRoles: readonly AppRole[] | null | undefined;
  existing: readonly SignerRecord[] | null | undefined;
};

/**
 * Kiểm tra một lần KÝ. Trả về thông báo lỗi (chuỗi) hoặc null nếu hợp lệ.
 * Áp dụng: quyền (canSignAs) • không ký trùng vai trò • đúng thứ tự •
 * tách vai (người thực hiện ≠ phụ trách).
 */
export function validateSignAttempt(a: SignAttempt): string | null {
  const existing = a.existing ?? [];

  if (!canSignAs(a.signerRole, a.appRoles)) {
    return `Bạn không có quyền ký với vai trò "${SIGNER_ROLE_LABEL[a.signerRole]}"`;
  }

  if (hasSigned(existing, a.signerRole)) {
    return `Vai trò "${SIGNER_ROLE_LABEL[a.signerRole]}" đã được ký`;
  }

  // THỨ TỰ: các vai trò trước phải đã ký.
  const target = SIGNER_ROLE_ORDER[a.signerRole];
  for (const role of SIGNER_ROLES) {
    if (SIGNER_ROLE_ORDER[role] < target && !hasSigned(existing, role)) {
      return `Cần "${SIGNER_ROLE_LABEL[role]}" ký trước khi "${SIGNER_ROLE_LABEL[a.signerRole]}" ký`;
    }
  }

  // TÁCH VAI: không tự ký cả hai vai trò.
  if (existing.some((s) => s.signed_by === a.userId)) {
    return "Một người không thể ký thay cho nhiều vai trò trên cùng biên bản";
  }

  return null;
}

/** Sắp xếp danh sách chữ ký theo đúng thứ tự vai trò. */
export function sortSigners(signers: readonly SignerRecord[]): SignerRecord[] {
  return [...signers].sort(
    (a, b) => SIGNER_ROLE_ORDER[a.signer_role] - SIGNER_ROLE_ORDER[b.signer_role],
  );
}

/** Đủ chữ ký = cả người thực hiện và phụ trách đã ký. */
export function isFullySigned(
  signers: readonly SignerRecord[] | null | undefined,
): boolean {
  return nextSignerRole(signers) === null;
}

export type LegacySignature = {
  signed_by: string | null;
  signed_at: string | null;
};

/**
 * FALLBACK: nếu chưa có bản ghi signer nào nhưng biên bản cũ đã có
 * signed_by/signed_at, coi đó là chữ ký "Phụ trách/Giám sát" (người duyệt cũ).
 * Nếu đã có bản ghi signer thì bỏ qua fallback (nguồn chuẩn).
 */
export function resolveSigners(
  signers: readonly SignerRecord[] | null | undefined,
  legacy: LegacySignature | null | undefined,
): SignerRecord[] {
  const rows = signers ?? [];
  if (rows.length > 0) return sortSigners(rows);
  if (legacy?.signed_by && legacy.signed_at) {
    return [
      {
        signer_role: "phu_trach",
        signed_by: legacy.signed_by,
        signed_at: legacy.signed_at,
        ho_ten: null,
      },
    ];
  }
  return [];
}
