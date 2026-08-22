// ============================================================================
// useColumnWidths — lưu độ rộng từng cột của một bảng theo TÀI KHOẢN (localStorage).
//
// Nhẹ, không đụng DB: mọi thứ cache trong localStorage theo tableKey. Bảng
// tự do vẫn dùng lại được thứ tự & cột ẩn của useColumnPrefs.
//
// API:
//   const { widths, setWidth, resetWidth, resetAll } = useColumnWidths(tableKey)
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";

const LS_PREFIX = "mirats:colwidths:";
const MIN_W = 60;
const MAX_W = 1200;

export type ColumnWidths = Record<string, number>;

export function useColumnWidths(tableKey: string) {
  const lsKey = LS_PREFIX + tableKey;
  const [widths, setWidths] = useState<ColumnWidths>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(lsKey) : null;
      if (raw) setWidths(JSON.parse(raw) as ColumnWidths);
      else setWidths({});
    } catch {
      setWidths({});
    }
  }, [lsKey]);

  const persist = useCallback(
    (next: ColumnWidths) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        try {
          window.localStorage.setItem(lsKey, JSON.stringify(next));
        } catch {
          /* ignore */
        }
      }, 200);
    },
    [lsKey],
  );

  const setWidth = useCallback(
    (key: string, w: number) => {
      const clamped = Math.max(MIN_W, Math.min(MAX_W, Math.round(w)));
      setWidths((prev) => {
        if (prev[key] === clamped) return prev;
        const next = { ...prev, [key]: clamped };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetWidth = useCallback(
    (key: string) => {
      setWidths((prev) => {
        if (!(key in prev)) return prev;
        const next = { ...prev };
        delete next[key];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const resetAll = useCallback(() => {
    setWidths({});
    persist({});
  }, [persist]);

  return { widths, setWidth, resetWidth, resetAll, MIN_W, MAX_W };
}
