import { 
  TRANG_THAI_TOKEN, 
  MUC_DO_SU_CO_TOKEN, 
  LOAI_BAO_TRI_TOKEN, 
  PHUONG_AN_HONG_HOC_TOKEN, 
  LOAI_BAN_GIAO_TOKEN,
  XEP_LOAI_HEALTH_TOKEN,
  TYPO_STATUS
} from "./status-tokens";

export const STATUS_REGISTRY = {
  thiet_bi: TRANG_THAI_TOKEN,
  su_co: MUC_DO_SU_CO_TOKEN,
  bao_tri: LOAI_BAO_TRI_TOKEN,
  hong_hoc: PHUONG_AN_HONG_HOC_TOKEN,
  ban_giao: LOAI_BAN_GIAO_TOKEN,
  van_de: MUC_DO_SU_CO_TOKEN,
  cong_viec: LOAI_BAO_TRI_TOKEN,
  health: XEP_LOAI_HEALTH_TOKEN,
  ocr: TYPO_STATUS,
  connectivity: TYPO_STATUS,
  expiry: TYPO_STATUS,
} as const;

export type DomainKey = keyof typeof STATUS_REGISTRY;

export function getToken(domain: DomainKey, code: string | null) {
  if (!code) return null;
  const registry = STATUS_REGISTRY[domain] as any;
  const k = code.trim();
  const token = registry[k];
  if (token) return token;
  
  // Fallback match for legacy names
  if (domain === 'thiet_bi') {
    const entry = Object.entries(TRANG_THAI_TOKEN).find(([key, val]: [string, any]) => 
      key === k || val.label === k
    );
    if (entry) return entry[1];
  }

  return { class: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" };
}
