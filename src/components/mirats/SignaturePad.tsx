// ============================================================================
// SignaturePad.tsx — Canvas vẽ chữ ký tay (chuột + cảm ứng).
// Hỗ trợ 2 chế độ:
//   1) Controlled: truyền value (dataURL) + onChange.
//   2) Imperative: dùng ref -> SignaturePadHandle.getDataUrl() / clear().
// ============================================================================
import {
  forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Eraser, Undo2 } from "lucide-react";

type Stroke = Array<{ x: number; y: number }>;

export type SignaturePadHandle = {
  getDataUrl: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
};

type Props = {
  value?: string | null;
  onChange?: (dataUrl: string | null) => void;
  height?: number;
  disabled?: boolean;
};

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad(
  { value, onChange, height = 140, disabled = false }, ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const [empty, setEmpty] = useState(!value);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const s of strokesRef.current) {
      if (s.length < 1) continue;
      ctx.beginPath();
      ctx.moveTo(s[0].x, s[0].y);
      for (let i = 1; i < s.length; i++) ctx.lineTo(s[i].x, s[i].y);
      ctx.stroke();
    }
  }, []);

  // Ảnh có sẵn (dataURL) nạp lên canvas.
  useEffect(() => {
    if (!value) return;
    const c = canvasRef.current;
    if (!c) return;
    const img = new Image();
    img.onload = () => {
      const ctx = c.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      setEmpty(false);
    };
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement!;
    const dpr = window.devicePixelRatio || 1;
    const w = parent.clientWidth;
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    const ctx = c.getContext("2d");
    ctx?.scale(dpr, dpr);
    redraw();
  }, [height, redraw]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    currentRef.current = [pos(e)];
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!currentRef.current) return;
    currentRef.current.push(pos(e));
    redrawWithCurrent();
  };
  const onUp = () => {
    if (!currentRef.current) return;
    if (currentRef.current.length > 1) strokesRef.current.push(currentRef.current);
    currentRef.current = null;
    commit();
  };
  const redrawWithCurrent = () => {
    redraw();
    if (!currentRef.current) return;
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!ctx || currentRef.current.length < 2) return;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(currentRef.current[0].x, currentRef.current[0].y);
    for (let i = 1; i < currentRef.current.length; i++) {
      ctx.lineTo(currentRef.current[i].x, currentRef.current[i].y);
    }
    ctx.stroke();
  };
  const getDataUrl = (): string | null => {
    const c = canvasRef.current;
    if (!c) return null;
    if (strokesRef.current.length === 0) return null;
    return c.toDataURL("image/png");
  };
  const commit = () => {
    const isEmpty = strokesRef.current.length === 0;
    setEmpty(isEmpty);
    onChange?.(getDataUrl());
  };
  const clear = () => {
    strokesRef.current = [];
    currentRef.current = null;
    redraw();
    commit();
  };
  const undo = () => {
    strokesRef.current.pop();
    redraw();
    commit();
  };

  useImperativeHandle(ref, () => ({
    getDataUrl,
    clear,
    isEmpty: () => strokesRef.current.length === 0,
  }));

  return (
    <div className="rounded-md border bg-white">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none rounded-t-md"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerLeave={onUp}
        />
        {empty && (
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Ký tại đây
          </span>
        )}
      </div>
      <div className="flex items-center justify-end gap-1 border-t bg-muted/30 px-2 py-1">
        <Button type="button" variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/90 hover:bg-primary/5" onClick={undo} disabled={disabled || empty}>
          <Undo2 className="mr-1 h-3.5 w-3.5" /> Hoàn tác
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-7 text-primary hover:text-primary/90 hover:bg-primary/5" onClick={clear} disabled={disabled || empty}>
          <Eraser className="mr-1 h-3.5 w-3.5" /> Xoá
        </Button>
      </div>
    </div>
  );
});
