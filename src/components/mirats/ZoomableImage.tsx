import { useCallback, useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const STEP = 0.35;

type Transform = { scale: number; x: number; y: number };
const RESET: Transform = { scale: 1, x: 0, y: 0 };

/**
 * Trình xem ảnh có zoom & kéo (pan) — hiển thị ảnh gốc độ phân giải cao.
 * - Lăn chuột: phóng to/thu nhỏ quanh con trỏ
 * - Kéo (chuột / chạm): di chuyển ảnh khi đã phóng to
 * - Bấm đúp: phóng nhanh / trả về ban đầu
 * - Nút +/− /vừa khung để điều khiển
 */
export function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState<Transform>(RESET);
  const drag = useRef<{ startX: number; startY: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  // Trả ảnh về ban đầu mỗi khi đổi ảnh.
  useEffect(() => setT(RESET), [src]);

  const clamp = useCallback((next: Transform): Transform => {
    const el = containerRef.current;
    if (!el) return next;
    const { width, height } = el.getBoundingClientRect();
    // Giới hạn kéo để ảnh không trôi ra khỏi khung quá nửa.
    const maxX = (width * (next.scale - 1)) / 2;
    const maxY = (height * (next.scale - 1)) / 2;
    return {
      scale: next.scale,
      x: Math.max(-maxX, Math.min(maxX, next.x)),
      y: Math.max(-maxY, Math.min(maxY, next.y)),
    };
  }, []);

  const zoomAt = useCallback(
    (delta: number, cx?: number, cy?: number) => {
      setT((prev) => {
        const el = containerRef.current;
        const rect = el?.getBoundingClientRect();
        const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale + delta));
        if (nextScale === prev.scale) return prev;
        if (nextScale === 1) return RESET;
        if (!rect || cx == null || cy == null) return clamp({ ...prev, scale: nextScale });
        // Zoom quanh điểm con trỏ.
        const px = cx - rect.left - rect.width / 2;
        const py = cy - rect.top - rect.height / 2;
        const ratio = nextScale / prev.scale;
        return clamp({
          scale: nextScale,
          x: px - (px - prev.x) * ratio,
          y: py - (py - prev.y) * ratio,
        });
      });
    },
    [clamp],
  );

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      zoomAt(e.deltaY < 0 ? STEP : -STEP, e.clientX, e.clientY);
    },
    [zoomAt],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (t.scale <= 1) return;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      drag.current = { startX: e.clientX, startY: e.clientY, ox: t.x, oy: t.y };
      setDragging(true);
    },
    [t],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.startX;
      const dy = e.clientY - drag.current.startY;
      setT((prev) => clamp({ ...prev, x: drag.current!.ox + dx, y: drag.current!.oy + dy }));
    },
    [clamp],
  );

  const endDrag = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);

  const onDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (t.scale > 1) setT(RESET);
      else zoomAt(1.5, e.clientX, e.clientY);
    },
    [t.scale, zoomAt],
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <div
        ref={containerRef}
        className={cn(
          "flex h-full w-full items-center justify-center touch-none select-none",
          t.scale > 1 ? (dragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in",
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onDoubleClick={onDoubleClick}
      >
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain will-change-transform"
          style={{
            transform: `translate3d(${t.x}px, ${t.y}px, 0) scale(${t.scale})`,
            transition: dragging ? "none" : "transform 120ms ease-out",
          }}
        />
      </div>

      {/* Điều khiển zoom */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/15 bg-black/60 p-1 backdrop-blur">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => zoomAt(-STEP)}
          disabled={t.scale <= MIN_SCALE}
          title="Thu nhỏ"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <span className="min-w-[3rem] text-center text-xs font-medium tabular-nums text-white/90">
          {Math.round(t.scale * 100)}%
        </span>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => zoomAt(STEP)}
          disabled={t.scale >= MAX_SCALE}
          title="Phóng to"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <div className="mx-0.5 h-5 w-px bg-white/15" />
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-white hover:bg-white/15 hover:text-white"
          onClick={() => setT(RESET)}
          disabled={t.scale === 1 && t.x === 0 && t.y === 0}
          title="Về ban đầu"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      <span className="pointer-events-none absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-meta text-white/80">
        <Maximize2 className="h-3 w-3" /> Lăn chuột / bấm đúp để zoom
      </span>
    </div>
  );
}
