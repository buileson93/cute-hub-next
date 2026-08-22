import { useCallback, useMemo, useState } from "react";
import { DEFAULT_LIST_STATE, type ListControlsState } from "@/lib/mirats/ui/list-controls";

export interface UseListControlsReturn {
  state: ListControlsState;
  setQ: (s: string) => void;
  setFilter: (k: string, v: string | string[] | null) => void;
  setSort: (field: string) => void;
  setTrang: (n: number) => void;
  setKichThuoc: (n: number) => void;
  reset: () => void;
}

export function useListControls(init: Partial<ListControlsState> = {}): UseListControlsReturn {
  const initial = useMemo<ListControlsState>(
    () => ({ ...DEFAULT_LIST_STATE, ...init }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const [state, setState] = useState<ListControlsState>(initial);

  const setQ = useCallback((q: string) => {
    setState((s) => ({ ...s, q, trang: 1 }));
  }, []);

  const setFilter = useCallback((k: string, v: string | string[] | null) => {
    setState((s) => {
      const next = { ...s.filters };
      if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) {
        delete next[k];
      } else {
        next[k] = v;
      }
      return { ...s, filters: next, trang: 1 };
    });
  }, []);

  const setSort = useCallback((field: string) => {
    setState((s) => {
      if (!s.sort || s.sort.field !== field) return { ...s, sort: { field, dir: "asc" } };
      if (s.sort.dir === "asc") return { ...s, sort: { field, dir: "desc" } };
      return { ...s, sort: null };
    });
  }, []);

  const setTrang = useCallback((n: number) => {
    setState((s) => ({ ...s, trang: Math.max(1, n) }));
  }, []);

  const setKichThuoc = useCallback((n: number) => {
    setState((s) => ({ ...s, kichThuoc: Math.max(1, n), trang: 1 }));
  }, []);

  const reset = useCallback(() => setState(initial), [initial]);

  return { state, setQ, setFilter, setSort, setTrang, setKichThuoc, reset };
}
