// src/lib/mirats/ui/status-registry.ts

import { TRANG_THAI_TOKEN, MUC_DO_SU_CO_TOKEN, LOAI_BAO_TRI_TOKEN, PHUONG_AN_HONG_HOC_TOKEN, LOAI_BAN_GIAO_TOKEN } from "./status-tokens";

/**
 * Registry tập trung cho mọi trạng thái hệ thống.
 * Ánh xạ domain sang token tương ứng để dùng chung trong <StatusBadge />.
 */
export const STATUS_REGISTRY = {
  thiet_bi: TRANG_THAI_TOKEN,
  su_co: MUC_DO_SU_CO_TOKEN,
  bao_tri: LOAI_BAO_TRI_TOKEN,
  hong_hoc: PHUONG_AN_HONG_HOC_TOKEN,
  ban_giao: LOAI_BAN_GIAO_TOKEN,
} as const;

export type DomainKey = keyof typeof STATUS_REGISTRY;

export function getToken(domain: DomainKey, code: string | null) {
  if (!code) return null;
  const registry = STATUS_REGISTRY[domain] as any;
  return registry[code.trim()] || { class: "bg-slate-100 text-slate-600 border-slate-200" };
}
