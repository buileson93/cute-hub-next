// Ambient prefill sources for incident (and PM) forms.
// Client-side helpers backed by Supabase (RLS applies as caller).
import { supabase } from "@/integrations/backend/client";

export interface KipTrucRow {
  ho_ten: string;
  chuc_vu: string;
  nang_dinh: string;
}

export interface SuCoJson {
  bao_cao_ban_dau?: {
    kip_truc?: KipTrucRow[];
    thanh_phan_list?: { id?: string }[];
  } | null;
  bien_phap_xu_ly?: string | null;
  nguyen_nhan?: string | null;
  created_at?: string | null;
}

/** Extract the most recent, non-empty `kip_truc` array from a list of su_co rows. */
export function pickLastKipTruc(rows: SuCoJson[]): KipTrucRow[] | null {
  for (const r of rows) {
    const list = r.bao_cao_ban_dau?.kip_truc?.filter((k) => k?.ho_ten?.trim());
    if (list && list.length) return list;
  }
  return null;
}

/**
 * Pick the most-frequent non-empty biện pháp among su_co rows whose payload
 * `thanh_phan_list` intersects with any of `thanhPhanIds`.
 */
export function pickBienPhapForComponents(rows: SuCoJson[], thanhPhanIds: string[]): string | null {
  if (!thanhPhanIds.length) return null;
  const wanted = new Set(thanhPhanIds);
  const freq = new Map<string, number>();
  for (const r of rows) {
    const bp = (r.bien_phap_xu_ly ?? "").trim();
    if (!bp) continue;
    const tps = r.bao_cao_ban_dau?.thanh_phan_list ?? [];
    const hit = tps.some((t) => t.id && wanted.has(t.id));
    if (!hit) continue;
    freq.set(bp, (freq.get(bp) ?? 0) + 1);
  }
  let best: string | null = null;
  let max = 0;
  for (const [k, v] of freq)
    if (v > max) {
      max = v;
      best = k;
    }
  return best;
}

/** Fetch the caller's recent su_co rows to derive their last kíp trực. */
export async function fetchMyRecentSuCo(userDisplay: string, limit = 5): Promise<SuCoJson[]> {
  if (!userDisplay) return [];
  const { data } = await supabase
    .from("su_co")
    .select("bao_cao_ban_dau, created_at")
    .eq("nguoi_bao_cao", userDisplay)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SuCoJson[];
}

/** Fetch recent resolved su_co (30 days) for biện pháp gợi ý. */
export async function fetchRecentResolvedSuCo(days = 30, limit = 40): Promise<SuCoJson[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const { data } = await supabase
    .from("su_co")
    .select("bao_cao_ban_dau, bien_phap_xu_ly, nguyen_nhan, created_at")
    .gte("created_at", since)
    .not("bien_phap_xu_ly", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as SuCoJson[];
}
