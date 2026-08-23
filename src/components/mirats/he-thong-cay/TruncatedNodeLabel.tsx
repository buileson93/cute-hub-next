import { useState, useMemo, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * TruncatedNodeLabel - Sửa đổi Phase 10L:
 * Render tên người dùng đọc được, hiển thị Tooltip chứa cả Tên và Mã nếu có mã nghiệp vụ.
 */
import { type NodeDisplayIdentity } from "@/lib/mirats/db-taxonomy";

export function TruncatedNodeLabel({ 
  label, 
  code,
  identity 
}: { 
  label: string; 
  code?: string;
  identity?: NodeDisplayIdentity;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [truncated, setTruncated] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    let frameId: number;
    const update = () => {
      frameId = requestAnimationFrame(() => {
        if (!el) return;
        const isTruncated = el.scrollWidth > el.clientWidth + 1;
        setTruncated((prev) => (prev !== isTruncated ? isTruncated : prev));
      });
    };

    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", update);
    };
  }, [label]);

  const text = (
    <span
      ref={ref}
      className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-medium"
    >
      {label}
    </span>
  );

  // If we have identity, we use its structured data for the tooltip
  if (identity) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>{text}</TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-80 border-primary/20 bg-card p-2 shadow-md">
            <div className="flex flex-col gap-1">
              <div className="font-semibold text-[11px] text-foreground">{identity.primaryLabel}</div>
              
              {identity.assetName && identity.assetName !== identity.primaryLabel && (
                <div className="text-[10px] text-muted-foreground italic">
                  Tên tài sản: {identity.assetName}
                </div>
              )}

              <div className="flex flex-col gap-0.5 border-t border-border/40 mt-1 pt-1">
                {identity.componentCode && (
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    <span className="opacity-60">Mã TP:</span>
                    <span>{identity.componentCode}</span>
                  </div>
                )}
                {identity.assetCode && (
                  <div className="flex items-center gap-1.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                    <span className="opacity-60">Mã TS:</span>
                    <span>{identity.assetCode}</span>
                  </div>
                )}
              </div>
              
              {identity.source === "missing" && (
                <div className="text-[10px] italic text-amber-500 mt-1">Chưa có tên</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback to legacy behavior if no identity
  if (!truncated && !code) return text;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>{text}</TooltipTrigger>
        <TooltipContent side="top" align="center" className="max-w-80 border-primary/20 bg-card p-2 shadow-md">
          <div className="flex flex-col gap-0.5">
            <div className="font-semibold text-[11px] text-foreground">{label}</div>
            {code && (
              <div className="flex items-center gap-1.5 border-t border-border/40 mt-1 pt-1 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
                <span className="opacity-60">Mã:</span>
                <span>{code}</span>
              </div>
            )}
            {!label || label === code && !code && (
               <div className="text-[10px] italic text-amber-500 mt-1">Chưa có tên</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
