import React, { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface HorizontalScrollRailProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

/**
 * HorizontalScrollRail - Thanh cuộn ngang đồng bộ cho StandardTable.
 * Luôn hiển thị ở đáy viewport nhìn thấy, hỗ trợ kéo và phím.
 */
export const HorizontalScrollRail = ({ containerRef, className }: HorizontalScrollRailProps) => {
  const [scrollInfo, setScrollInfo] = useState({ left: 0, width: 0, scrollWidth: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const railRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const updateScrollInfo = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, clientWidth, scrollWidth } = containerRef.current;
    setScrollInfo({ left: scrollLeft, width: clientWidth, scrollWidth });
    setIsVisible(scrollWidth > clientWidth + 1); // +1 để tránh lỗi làm tròn
  }, [containerRef]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateScrollInfo();
    
    const onScroll = () => {
      if (!isDragging.current) {
        updateScrollInfo();
      }
    };

    const observer = new ResizeObserver(updateScrollInfo);
    observer.observe(el);
    el.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      el.removeEventListener("scroll", onScroll);
    };
  }, [containerRef, updateScrollInfo]);

  // Logic kéo thumb
  const onPointerDown = (e: React.PointerEvent) => {
    if (!railRef.current || !containerRef.current) return;
    isDragging.current = true;
    startX.current = e.clientX;
    startScrollLeft.current = containerRef.current.scrollLeft;
    
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !railRef.current || !containerRef.current) return;
    
    const railWidth = railRef.current.clientWidth;
    const { width, scrollWidth } = scrollInfo;
    const thumbWidth = Math.max(40, (width / scrollWidth) * railWidth);
    
    const deltaX = e.clientX - startX.current;
    const scrollRatio = (scrollWidth - width) / (railWidth - thumbWidth);
    
    containerRef.current.scrollLeft = startScrollLeft.current + deltaX * scrollRatio;
    updateScrollInfo();
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  };

  if (!isVisible) return null;

  const railWidth = railRef.current?.clientWidth || 0;
  const thumbWidth = Math.max(40, (scrollInfo.width / scrollInfo.scrollWidth) * railWidth);
  const thumbLeft = (scrollInfo.left / (scrollInfo.scrollWidth - scrollInfo.width)) * (railWidth - thumbWidth);

  return (
    <div 
      ref={railRef}
      className={cn(
        "sticky bottom-0 left-0 right-0 z-[60] h-3 w-full border-t bg-background/80 backdrop-blur-sm transition-opacity duration-200",
        className
      )}
      onClick={(e) => {
        // Bấm vào rail để cuộn nhanh
        if (!railRef.current || !containerRef.current || e.target !== railRef.current) return;
        const rect = railRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const ratio = clickX / railWidth;
        containerRef.current.scrollLeft = ratio * scrollInfo.scrollWidth - scrollInfo.width / 2;
      }}
    >
      <div
        role="scrollbar"
        aria-orientation="horizontal"
        aria-valuemin={0}
        aria-valuemax={scrollInfo.scrollWidth - scrollInfo.width}
        aria-valuenow={scrollInfo.left}
        className="absolute top-1 h-1.5 cursor-grab rounded-full bg-primary/40 hover:bg-primary/60 active:cursor-grabbing active:bg-primary transition-colors"
        style={{
          width: `${thumbWidth}px`,
          transform: `translateX(${thumbLeft || 0}px)`,
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
    </div>
  );
};