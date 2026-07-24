// ============================================================================
// Task 30 — DetailPanel: state + đồng bộ URL query cho drawer chi tiết.
//
// - Pure logic: parse/serialize query param → { loai, id }.
// - Hook `useDetailPanel(param?)`: open/close cập nhật URL để share link mở
//   sẵn drawer. Không rời trang.
// - Format param: `<loai>:<id>` (VD: ?xem=thiet_bi:TB_ABC123).
// ============================================================================
import * as React from "react";
import type { EntityLoai } from "@/lib/mirats/display/types";

export const PARAM_MAC_DINH = "xem";

export interface DetailPanelState {
  loai: EntityLoai | null;
  moId: string | null;
}

/** Parse chuỗi `loai:id` → state. Invalid → cả 2 null. */
export function parseDetail(raw: string | null | undefined): DetailPanelState {
  if (!raw) return { loai: null, moId: null };
  const s = String(raw).trim();
  if (!s) return { loai: null, moId: null };
  const idx = s.indexOf(":");
  if (idx <= 0 || idx === s.length - 1) return { loai: null, moId: null };
  const loai = s.slice(0, idx).trim() as EntityLoai;
  const moId = s.slice(idx + 1).trim();
  if (!loai || !moId) return { loai: null, moId: null };
  return { loai, moId };
}

/** Serialize state → chuỗi cho URL. `null` nếu chưa mở. */
export function serializeDetail(
  loai: EntityLoai | null,
  id: string | null,
): string | null {
  if (!loai || !id) return null;
  return `${loai}:${id}`;
}

// --- URL adapter (thay bằng mock trong test) ---------------------------------

export interface UrlAdapter {
  get(param: string): string | null;
  set(param: string, value: string | null): void;
  subscribe(cb: () => void): () => void;
}

/** Adapter mặc định — dùng `window.location` + `history.replaceState`. */
export function windowUrlAdapter(): UrlAdapter {
  return {
    get(param) {
      if (typeof window === "undefined") return null;
      return new URLSearchParams(window.location.search).get(param);
    },
    set(param, value) {
      if (typeof window === "undefined") return;
      const url = new URL(window.location.href);
      if (value == null) url.searchParams.delete(param);
      else url.searchParams.set(param, value);
      window.history.replaceState(null, "", url.toString());
      window.dispatchEvent(new Event("mirats:detail-panel"));
    },
    subscribe(cb) {
      if (typeof window === "undefined") return () => {};
      window.addEventListener("popstate", cb);
      window.addEventListener("mirats:detail-panel", cb);
      return () => {
        window.removeEventListener("popstate", cb);
        window.removeEventListener("mirats:detail-panel", cb);
      };
    },
  };
}

// --- Hook -------------------------------------------------------------------

export interface UseDetailPanelResult extends DetailPanelState {
  open: (loai: EntityLoai, id: string) => void;
  close: () => void;
}

/**
 * Hook mở/đóng drawer chi tiết + đồng bộ URL query param.
 * `param` mặc định `xem`. `adapter` chỉ nên override trong test.
 */
export function useDetailPanel(
  param: string = PARAM_MAC_DINH,
  adapter?: UrlAdapter,
): UseDetailPanelResult {
  const adp = React.useMemo(() => adapter ?? windowUrlAdapter(), [adapter]);
  const [raw, setRaw] = React.useState<string | null>(() => adp.get(param));

  React.useEffect(() => {
    setRaw(adp.get(param));
    return adp.subscribe(() => setRaw(adp.get(param)));
  }, [adp, param]);

  const state = React.useMemo(() => parseDetail(raw), [raw]);

  const open = React.useCallback(
    (loai: EntityLoai, id: string) => {
      const s = serializeDetail(loai, id);
      adp.set(param, s);
      setRaw(s);
    },
    [adp, param],
  );

  const close = React.useCallback(() => {
    adp.set(param, null);
    setRaw(null);
  }, [adp, param]);

  return { loai: state.loai, moId: state.moId, open, close };
}
