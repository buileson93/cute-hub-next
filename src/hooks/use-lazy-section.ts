import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Theo dõi một vùng trên trang bằng IntersectionObserver native.
 * Trả về ref để gắn vào sentinel và cờ `hasIntersected` (chỉ bật một lần cho mỗi lần vào trang).
 * Dùng để hoãn việc tải dữ liệu nặng cho tới khi người dùng cuộn tới gần vùng đó.
 */
export function useLazySection<T extends HTMLElement>(options?: {
  rootMargin?: string;
  /** Bật sẵn (ví dụ khi section đang hiển thị theo tab và cần tải ngay). */
  disabled?: boolean;
}) {
  const rootMargin = options?.rootMargin ?? "200px";
  const disabled = options?.disabled ?? false;
  const [hasIntersected, setHasIntersected] = useState(false);
  const nodeRef = useRef<T | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const cleanup = useCallback(() => {
    observerRef.current?.disconnect();
    observerRef.current = null;
  }, []);

  const ref = useCallback(
    (node: T | null) => {
      nodeRef.current = node;
      cleanup();
      if (!node || disabled || hasIntersected) return;
      if (typeof IntersectionObserver === "undefined") {
        setHasIntersected(true);
        return;
      }
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            setHasIntersected(true);
            observer.disconnect();
            observerRef.current = null;
          }
        },
        { rootMargin },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [cleanup, disabled, hasIntersected, rootMargin],
  );

  useEffect(() => cleanup, [cleanup]);

  return { ref, hasIntersected: hasIntersected || disabled } as const;
}
