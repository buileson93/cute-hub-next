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

export type ColumnPrefs = { order: string[]; hidden: string[] };

const LS_PREFIX = "mirats:colprefs:";

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
  const [ready, setReady] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nạp tuỳ chỉnh: localStorage trước (nhanh), rồi từ tài khoản (ưu tiên).
  useEffect(() => {
    let cancelled = false;

    const applyPrefs = (p: ColumnPrefs | null) => {
      if (cancelled) return;
      setOrderState(reconcileOrder(p?.order, allKeys));
      setHiddenState(new Set(p?.hidden ?? defaultHidden));
    };

    // 1) localStorage
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(lsKey) : null;
      if (raw) applyPrefs(JSON.parse(raw) as ColumnPrefs);
      else applyPrefs(null);
    } catch {
      applyPrefs(null);
    }

    // 2) tài khoản
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user?.id ?? null;
      userIdRef.current = uid;
      if (!uid) { if (!cancelled) setReady(true); return; }
      const { data } = await supabase
        .from("bang_cot_tuy_chinh")
        .select("cau_hinh")
        .eq("user_id", uid)
        .eq("bang_key", tableKey)
        .maybeSingle();
      if (cancelled) return;
      const cfg = (data?.cau_hinh ?? null) as ColumnPrefs | null;
      if (cfg && (cfg.order?.length || cfg.hidden)) applyPrefs(cfg);
      setReady(true);
    })().catch(() => { if (!cancelled) setReady(true); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey, allKeysSig, defHiddenSig]);

  // Lưu (debounce) vào localStorage + tài khoản.
  const persist = useCallback((next: ColumnPrefs) => {
    try { window.localStorage.setItem(lsKey, JSON.stringify(next)); } catch { /* ignore */ }
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const uid = userIdRef.current;
      if (!uid) return;
      supabase
        .from("bang_cot_tuy_chinh")
        .upsert({ user_id: uid, bang_key: tableKey, cau_hinh: next }, { onConflict: "user_id,bang_key" })
        .then(() => { /* im lặng */ });
    }, 600);
  }, [lsKey, tableKey]);

  const setOrder = useCallback((next: string[]) => {
    const reconciled = reconcileOrder(next, allKeys);
    setOrderState(reconciled);
    setHiddenState((h) => { persist({ order: reconciled, hidden: [...h] }); return h; });
  }, [allKeys, persist]);

  const toggle = useCallback((key: string) => {
    setHiddenState((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      setOrderState((o) => { persist({ order: o, hidden: [...next] }); return o; });
      return next;
    });
  }, [persist]);

  const setHidden = useCallback((keys: string[]) => {
    const next = new Set(keys);
    setHiddenState(next);
    setOrderState((o) => { persist({ order: o, hidden: [...next] }); return o; });
  }, [persist]);

  const reset = useCallback(() => {
    const o = reconcileOrder(undefined, allKeys);
    const h = new Set(defaultHidden);
    setOrderState(o);
    setHiddenState(h);
    persist({ order: o, hidden: [...h] });
  }, [allKeys, defaultHidden, persist]);

  const isHidden = useCallback((key: string) => hidden.has(key), [hidden]);

  return useMemo(
    () => ({ order, hidden, ready, setOrder, toggle, setHidden, reset, isHidden }),
    [order, hidden, ready, setOrder, toggle, setHidden, reset, isHidden],
  );
}
