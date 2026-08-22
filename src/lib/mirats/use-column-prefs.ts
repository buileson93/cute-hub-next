// ============================================================================
// useColumnPrefs — lưu thứ tự & ẩn/hiện cột của một bảng theo TÀI KHOẢN.
//
// Tuỳ chỉnh được ghi vào bảng `bang_cot_tuy_chinh` (RLS theo auth.uid()) nên
// đồng bộ trên mọi tài sản. Khi chưa đăng nhập hoặc lỗi mạng, rơi về
// localStorage để vẫn dùng được offline / trong phiên.
//
// API:
//   const { order, hidden, ready, setOrder, toggle, reset, isHidden }
//     = useColumnPrefs(tableKey, allKeys, defaultHidden)
//   - order:   thứ tự cột hiện tại (mọi key, kể cả cột ẩn)
//   - hidden:  Set<string> các key đang ẩn
//   - setOrder(next): đặt lại thứ tự (dùng khi kéo-thả)
//   - toggle(key):    bật/tắt hiển thị 1 cột
//   - reset():        về mặc định
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/backend/client";

export type ColumnPrefs = {
  order: string[];
  hidden: string[];
  widths?: Record<string, number>;
  presetId?: string;
  customized?: boolean;
  layoutMode?: "fluid" | "auto" | "custom";
};

const LS_PREFIX = "mirats:colprefs:v2:";

/** Hợp nhất thứ tự đã lưu với danh sách key hiện có (thêm key mới vào cuối,
 *  bỏ key không còn tồn tại). Giữ đúng thứ tự người dùng đã sắp.
 *  Cột thao tác ("actions") luôn được ghim ở cuối cùng. */
function reconcileOrder(saved: string[] | undefined, allKeys: string[]): string[] {
  const set = new Set(allKeys);
  const kept = (saved ?? []).filter((k) => set.has(k));
  const keptSet = new Set(kept);
  const added = allKeys.filter((k) => !keptSet.has(k));
  const merged = [...kept, ...added];
  // Ghim cột thao tác về cuối (nút Sửa/Xoá luôn ở sau cùng).
  if (merged.includes("actions")) {
    return [...merged.filter((k) => k !== "actions"), "actions"];
  }
  return merged;
}

export function useColumnPrefs(tableKey: string, allKeys: string[], defaultHidden: string[] = []) {
  const allKeysSig = allKeys.join("|");
  const defHiddenSig = defaultHidden.join("|");
  const lsKey = LS_PREFIX + tableKey;

  const [order, setOrderState] = useState<string[]>(() => reconcileOrder(undefined, allKeys));
  const [hidden, setHiddenState] = useState<Set<string>>(() => new Set(defaultHidden));
  const [widths, setWidthsState] = useState<Record<string, number>>({});
  const [layoutMode, setLayoutModeState] = useState<"fluid" | "auto" | "custom">("fluid");
  const [activePreset, setActivePreset] = useState<string | undefined>();

  const [isCustomized, setIsCustomized] = useState(false);
  const [ready, setReady] = useState(false);
  const isDirtyRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nạp tuỳ chỉnh: localStorage trước (nhanh), rồi từ tài khoản (ưu tiên).
  useEffect(() => {
    let cancelled = false;

    const applyPrefs = (p: ColumnPrefs | null) => {
      if (cancelled) return;
      setOrderState(reconcileOrder(p?.order, allKeys));
      setHiddenState(new Set(p?.hidden ?? defaultHidden));
      setWidthsState(p?.widths ?? {});
      setLayoutModeState(p?.layoutMode ?? "fluid");
      setActivePreset(p?.presetId);
      setIsCustomized(p?.customized ?? false);
    };

    // 1) localStorage
    try {
      const rawV2 = typeof window !== "undefined" ? window.localStorage.getItem(lsKey) : null;
      if (rawV2) {
        applyPrefs(JSON.parse(rawV2) as ColumnPrefs);
      } else {
        // Fallback sang v1 nếu chưa có v2
        const rawV1 =
          typeof window !== "undefined"
            ? window.localStorage.getItem("mirats:colprefs:" + tableKey)
            : null;
        if (rawV1) {
          const v1 = JSON.parse(rawV1) as ColumnPrefs;
          applyPrefs({ ...v1, customized: true });
        } else {
          applyPrefs(null);
        }
      }
    } catch {
      applyPrefs(null);
    }

    // 2) tài khoản
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id ?? null;
      userIdRef.current = uid;
      if (!uid) {
        if (!cancelled) setReady(true);
        return;
      }
      const { data } = await supabase
        .from("bang_cot_tuy_chinh")
        .select("cau_hinh")
        .eq("user_id", uid)
        .eq("bang_key", tableKey)
        .maybeSingle();
      if (cancelled) return;
      const cfg = (data?.cau_hinh ?? null) as ColumnPrefs | null;
      if (cfg && (cfg.order?.length || cfg.hidden) && !isDirtyRef.current) applyPrefs(cfg);
      setReady(true);
    })().catch(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, allKeysSig, defHiddenSig]);

  // Lưu (debounce) vào localStorage + tài khoản.
  const persist = useCallback(
    (next: ColumnPrefs) => {
      isDirtyRef.current = true;
      try {
        window.localStorage.setItem(lsKey, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        isDirtyRef.current = false;
        const uid = userIdRef.current;
        if (!uid) return;
        supabase
          .from("bang_cot_tuy_chinh")
          .upsert(
            { user_id: uid, bang_key: tableKey, cau_hinh: next },
            { onConflict: "user_id,bang_key" },
          )
          .then(() => {
            /* im lặng */
          });
      }, 600);
    },
    [lsKey, tableKey],
  );

  const setOrder = useCallback(
    (next: string[]) => {
      const reconciled = reconcileOrder(next, allKeys);
      setOrderState(reconciled);
      setIsCustomized(true);
      persist({
        order: reconciled,
        hidden: [...hidden],
        widths,
        presetId: activePreset,
        customized: true,
        layoutMode,
      });
    },
    [allKeys, persist, activePreset, hidden, widths],
  );

  const setWidth = useCallback(
    (key: string, w: number) => {
      const nextWidths = { ...widths, [key]: Math.round(w) };
      setWidthsState(nextWidths);
      setIsCustomized(true);
      persist({
        order,
        hidden: [...hidden],
        widths: nextWidths,
        presetId: activePreset,
        customized: true,
        layoutMode,
      });
    },
    [widths, order, hidden, persist, activePreset],
  );

  const resetWidth = useCallback(
    (key: string) => {
      const nextWidths = { ...widths };
      delete nextWidths[key];
      setWidthsState(nextWidths);
      persist({
        order,
        hidden: [...hidden],
        widths: nextWidths,
        presetId: activePreset,
        customized: true,
        layoutMode,
      });
    },
    [widths, order, hidden, persist, activePreset],
  );

  const toggle = useCallback(
    (key: string) => {
      const nextHidden = new Set(hidden);
      nextHidden.has(key) ? nextHidden.delete(key) : nextHidden.add(key);
      setHiddenState(nextHidden);
      setIsCustomized(true);
      persist({
        order,
        hidden: [...nextHidden],
        widths,
        presetId: activePreset,
        customized: true,
        layoutMode,
      });
    },
    [hidden, order, widths, persist, activePreset],
  );

  const setHidden = useCallback(
    (keys: string[]) => {
      const next = new Set(keys);
      setHiddenState(next);
      setIsCustomized(true);
      setOrderState((o) => {
        persist({
          order: o,
          hidden: [...next],
          widths,
          presetId: activePreset,
          customized: true,
          layoutMode,
        });
        return o;
      });
    },
    [persist, activePreset, widths, layoutMode],
  );

  const reset = useCallback(() => {
    const o = reconcileOrder(undefined, allKeys);
    const h = new Set(defaultHidden);
    setOrderState(o);
    setHiddenState(h);
    setWidthsState({});
    setActivePreset(undefined);
    setIsCustomized(false);
    persist({ order: o, hidden: [...h], widths: {}, customized: false, layoutMode: "fluid" });
  }, [allKeys, defaultHidden, persist]);

  const setPreset = useCallback(
    (presetId: string, visibleKeys: string[], orderKeys?: string[]) => {
      const reconciledOrder = reconcileOrder(orderKeys ?? allKeys, allKeys);
      const hiddenKeys = allKeys.filter((k) => k !== "actions" && !visibleKeys.includes(k));
      const nextHidden = new Set(hiddenKeys);

      setOrderState(reconciledOrder);
      setHiddenState(nextHidden);
      setActivePreset(presetId);
      setIsCustomized(false);
      persist({
        order: reconciledOrder,
        hidden: [...nextHidden],
        presetId,
        customized: false,
        layoutMode,
      });
    },
    [allKeys, persist],
  );

  const setLayoutMode = useCallback(
    (mode: "fluid" | "auto" | "custom") => {
      setLayoutModeState(mode);
      setIsCustomized(true);
      persist({
        order,
        hidden: [...hidden],
        widths,
        presetId: activePreset,
        customized: true,
        layoutMode: mode,
      });
    },
    [order, hidden, widths, activePreset, persist],
  );

  const setWidthsBatch = useCallback(
    (nextWidths: Record<string, number>) => {
      setWidthsState(nextWidths);
      setIsCustomized(true);
      persist({
        order,
        hidden: [...hidden],
        widths: nextWidths,
        presetId: activePreset,
        customized: true,
        layoutMode,
      });
    },
    [order, hidden, activePreset, persist, layoutMode],
  );

  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);

  return useMemo(
    () => ({
      order,
      hidden,
      widths,
      layoutMode,
      ready,
      activePreset,
      isCustomized,
      setOrder,
      setWidth,
      setWidthsBatch,
      resetWidth,
      toggle,
      setHidden,
      setLayoutMode,
      reset,
      isHidden,
      setPreset,
    }),
    [
      order,
      hidden,
      widths,
      layoutMode,
      ready,
      activePreset,
      isCustomized,
      setOrder,
      setWidth,
      setWidthsBatch,
      resetWidth,
      toggle,
      setHidden,
      setLayoutMode,
      reset,
      isHidden,
      setPreset,
    ],
  );
}
