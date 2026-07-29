import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { HardDrive, ShieldCheck, FileText, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { useDbTaxonomy, useSystemNameOverrides } from "@/lib/mirats/db-taxonomy";

/**
 * Nguồn tìm kiếm dùng chung cho thanh tìm kiếm tổng (GlobalSearch) và
 * Command Palette, đảm bảo cùng tập kết quả + cùng thứ tự + cùng cách hiển thị
 * với các ô tìm kiếm nhỏ (cây Hệ thống, Sổ lý lịch).
 */

export type SearchEntity = "he_thong" | "thiet_bi" | "giay_phep" | "form_submission";

export type SearchRow = {
  entity: SearchEntity;
  id: string;
  title: string;
  subtitle: string | null;
  /** Tên hệ thống cha (badge) cho tài sản. */
  sysName?: string | null;
  /** Số tài sản (badge) cho kết quả hệ thống. */
  count?: number;
  /** Đường dẫn điều hướng đã tính sẵn (đúng theo route thực tế). */
  to: string;
};

/** Tính đường dẫn điều hướng đúng cho từng loại kết quả.
 * Lưu ý: RPC trả `id` là UUID; route tài sản dùng mã (ma_thiet_bi) nằm ở subtitle. */
function hitTo(entity: SearchEntity, id: string, code: string | null): string {
  switch (entity) {
    case "thiet_bi":
      return `/thiet-bi/${code ?? id}`;
    case "giay_phep":
      return "/giay-phep";
    case "form_submission":
      return `/forms/submissions/${id}`;
    case "he_thong":
    default:
      return `/he-thong/${id}`;
  }
}

// Thứ tự phân cấp thống nhất: hệ thống > tài sản > giấy phép > biểu mẫu.
export const TIER: Record<SearchEntity, number> = {
  he_thong: 0,
  thiet_bi: 1,
  giay_phep: 2,
  form_submission: 3,
};

export const ENTITY_META: Record<
  SearchEntity,
  { label: string; icon: typeof HardDrive; to: (id: string) => string }
> = {
  he_thong: { label: "Hệ thống", icon: BookOpen, to: (id) => `/he-thong/${id}` },
  thiet_bi: { label: "Tài sản", icon: HardDrive, to: (id) => `/thiet-bi/${id}` },
  giay_phep: { label: "Giấy phép", icon: ShieldCheck, to: (id) => `/giay-phep/${id}` },
  form_submission: { label: "Biểu mẫu", icon: FileText, to: (id) => `/forms/submissions/${id}` },
};

export const SEARCH_MIN_LEN = 2;
const DEBOUNCE_MS = 160;
const RESULT_LIMIT = 15;

/** Bỏ dấu tiếng Việt để so khớp không phân biệt dấu. */
export function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

type RpcHit = { entity: SearchEntity; id: string; title: string; subtitle: string | null };

/** Gộp kết quả hệ thống (client) + RPC, bỏ trùng, xếp theo phân cấp. */
function buildRows(
  term: string,
  rpcData: RpcHit[],
  systems: { id: string; ten: string; count: number }[],
  devSys: Map<string, string>,
): SearchRow[] {
  const nq = normalize(term);
  if (!nq) return [];

  const sysRows: SearchRow[] = systems
    .filter((s) => normalize(s.ten).includes(nq))
    .sort((a, b) => b.count - a.count || a.ten.localeCompare(b.ten, "vi"))
    .slice(0, 6)
    .map((s) => ({ entity: "he_thong" as const, id: s.id, title: s.ten, subtitle: null, count: s.count, to: hitTo("he_thong", s.id, null) }));

  const rpcRows: SearchRow[] = rpcData.map((h) => ({
    ...h,
    sysName: h.entity === "thiet_bi" ? devSys.get(h.id) ?? null : undefined,
    to: hitTo(h.entity, h.id, h.subtitle),
  }));

  const byKey = new Map<string, SearchRow>();
  for (const r of [...sysRows, ...rpcRows]) {
    const key = `${r.entity}:${r.id}`;
    if (!byKey.has(key)) byKey.set(key, r);
  }
  // Sắp xếp ổn định theo phân cấp (thứ tự chèn giữ nguyên trong cùng tier).
  return [...byKey.values()].sort((a, b) => TIER[a.entity] - TIER[b.entity]);
}

export type UseGlobalSearchResult = {
  rows: SearchRow[];
  /** Đang tải dữ liệu nền hoặc đang chờ debounce/RPC. */
  loading: boolean;
  /** Dữ liệu nền (taxonomy) đã sẵn sàng chưa. */
  ready: boolean;
  /** Từ khóa đang thực sự được truy vấn (sau debounce). */
  activeTerm: string;
  /** Từ khóa đủ dài để tìm kiếm. */
  hasQuery: boolean;
};

/**
 * Hook tìm kiếm dùng chung: debounce + cache (react-query) + làm giàu taxonomy.
 * Truyền vào từ khóa thô; nhận về kết quả đã gộp & xếp thứ tự.
 */
export function useGlobalSearch(rawTerm: string): UseGlobalSearchResult {
  const term = rawTerm.trim();
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [term]);

  const { data: taxo, isLoading: taxoLoading } = useDbTaxonomy();
  const { data: overrides } = useSystemNameOverrides();

  const { devSys, systems } = useMemo(() => {
    const devSys = new Map<string, string>();
    const systems: { id: string; ten: string; count: number }[] = [];
    if (!taxo) return { devSys, systems };
    const htName = (id: string, fallback: string) => overrides?.get(id) ?? fallback;
    const sysCount = new Map<string, number>();
    for (const d of taxo.devices) {
      if (d._htId) {
        sysCount.set(d._htId, (sysCount.get(d._htId) ?? 0) + 1);
        if (d.id) devSys.set(d.id, htName(d._htId, d._htTen));
      }
    }
    for (const h of taxo.htList) {
      systems.push({ id: h.id, ten: htName(h.id, h.ten), count: sysCount.get(h.id) ?? 0 });
    }
    return { devSys, systems };
  }, [taxo, overrides]);

  const enabled = debounced.length >= SEARCH_MIN_LEN;

  const { data: rpcData, isFetching } = useQuery({
    queryKey: ["global_search", debounced],
    queryFn: async (): Promise<RpcHit[]> => {
      const { data, error } = await supabase.rpc("global_search", { _q: debounced, _limit: RESULT_LIMIT });
      if (error) throw error;
      return (data ?? []) as RpcHit[];
    },
    enabled,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(
    () => (enabled ? buildRows(debounced, rpcData ?? [], systems, devSys) : []),
    [enabled, debounced, rpcData, systems, devSys],
  );

  const hasQuery = term.length >= SEARCH_MIN_LEN;
  // "Đang tìm" khi: đang chờ debounce đuổi kịp, hoặc RPC đang chạy, hoặc taxonomy chưa tải.
  const loading = hasQuery && (term !== debounced || isFetching || taxoLoading);

  return {
    rows,
    loading,
    ready: !!taxo,
    activeTerm: debounced,
    hasQuery,
  };
}

// ---------------------------------------------------------------------------
// Tô sáng phần trùng khớp (không phân biệt dấu) trong chuỗi kết quả.
// ---------------------------------------------------------------------------

/** Tìm khoảng [start, end] trong text khớp query (bỏ dấu), map về chỉ số gốc. */
function matchRange(text: string, query: string): [number, number] | null {
  const nq = normalize(query);
  if (!nq) return null;
  let norm = "";
  const map: number[] = []; // chỉ số trong norm -> chỉ số trong text gốc
  for (let i = 0; i < text.length; i++) {
    const n = normalize(text[i]);
    for (let k = 0; k < n.length; k++) {
      norm += n[k];
      map.push(i);
    }
  }
  const idx = norm.indexOf(nq);
  if (idx < 0) return null;
  const start = map[idx];
  const end = map[idx + nq.length - 1];
  return [start, end];
}

/** Render text với phần khớp query được tô sáng. */
export function Highlight({ text, query }: { text: string; query: string }): ReactNode {
  if (!text || !query) return text;
  const range = matchRange(text, query);
  if (!range) return text;
  const [start, end] = range;
  return (
    <>
      {text.slice(0, start)}
      <mark className="rounded-[2px] bg-primary/20 px-0.5 text-foreground">{text.slice(start, end + 1)}</mark>
      {text.slice(end + 1)}
    </>
  );
}
