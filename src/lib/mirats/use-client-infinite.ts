import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Cuộn-tải-thêm phía client cho các bảng đã có sẵn toàn bộ dữ liệu trong bộ nhớ
 * (danh mục nhóm hệ thống, giấy phép khai thác…). Không đổi contract API: chỉ
 * cắt dần mảng nguồn theo từng lô để DOM/virtualizer không phải dựng hàng chục
 * nghìn dòng ngay lần render đầu.
 *
 * - Reset về lô đầu khi nguồn dữ liệu đổi (search/filter/sort/tab).
 * - Không "tải thêm" khi đã hết dữ liệu → `hasNextPage` luôn chính xác.
 */
export type ClientInfinite<T> = {
  rows: T[];
  totalCount: number;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  reset: () => void;
};

export function computeClientPageSlice(total: number, visible: number, pageSize: number) {
  const shown = Math.min(Math.max(visible, 0), total);
  return { shown, hasNextPage: shown < total, next: Math.min(shown + pageSize, total) };
}

export function useClientInfinite<T>(source: readonly T[], pageSize = 100): ClientInfinite<T> {
  const [visible, setVisible] = useState(pageSize);
  const sourceRef = useRef(source);

  // Nguồn đổi (đổi filter/search/sort) → quay lại lô đầu, tránh trộn dữ liệu.
  useEffect(() => {
    if (sourceRef.current !== source) {
      sourceRef.current = source;
      setVisible(pageSize);
    }
  }, [source, pageSize]);

  const total = source.length;
  const { shown, hasNextPage, next } = computeClientPageSlice(total, visible, pageSize);

  const rows = useMemo(() => source.slice(0, shown) as T[], [source, shown]);

  // Lô cuối chỉ lấy đúng số bản ghi còn lại (remaining), không bao giờ vượt
  // `total` — tránh "trang cuối luôn xin đủ pageSize" và tránh gọi thừa khi hết.
  const fetchNextPage = useCallback(() => {
    setVisible((v) => {
      const cur = Math.min(Math.max(v, 0), total);
      if (cur >= total) return cur;
      const remaining = total - cur;
      return cur + Math.min(pageSize, remaining);
    });
  }, [pageSize, total]);

  const reset = useCallback(() => setVisible(pageSize), [pageSize]);

  return {
    rows,
    totalCount: total,
    hasNextPage,
    isFetchingNextPage: false,
    fetchNextPage,
    reset,
  };
}
