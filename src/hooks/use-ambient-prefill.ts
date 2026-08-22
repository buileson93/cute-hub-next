import { useQuery } from "@tanstack/react-query";
import {
  fetchMyRecentSuCo,
  fetchRecentResolvedSuCo,
  pickBienPhapForComponents,
  pickLastKipTruc,
  type KipTrucRow,
} from "@/lib/mirats/prefill-suggestions";

const STALE = 60_000;

/** Suggested kíp trực (from caller's most recent su_co). */
export function usePrefillKipTruc(userDisplay: string) {
  return useQuery({
    queryKey: ["ambient-prefill", "kip-truc", userDisplay],
    queryFn: async () =>
      pickLastKipTruc(await fetchMyRecentSuCo(userDisplay)) as KipTrucRow[] | null,
    enabled: !!userDisplay,
    staleTime: STALE,
  });
}

/** Suggested biện pháp xử lý based on selected components. */
export function usePrefillBienPhap(thanhPhanIds: string[]) {
  const key = [...thanhPhanIds].sort().join(",");
  return useQuery({
    queryKey: ["ambient-prefill", "bien-phap", key],
    queryFn: async () => pickBienPhapForComponents(await fetchRecentResolvedSuCo(), thanhPhanIds),
    enabled: thanhPhanIds.length > 0,
    staleTime: STALE,
  });
}
