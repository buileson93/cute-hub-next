import { useEffect, useState } from "react";
import { Minimize2, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const KEY = "mirats.density";
type Density = "comfortable" | "compact";

function apply(d: Density) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.density = d;
}

export function useDensity(): [Density, (d: Density) => void] {
  const [d, setD] = useState<Density>(() => {
    if (typeof window === "undefined") return "comfortable";
    return (localStorage.getItem(KEY) as Density) || "comfortable";
  });
  useEffect(() => {
    apply(d);
    try { localStorage.setItem(KEY, d); } catch {}
  }, [d]);
  return [d, setD];
}

/** Áp dụng mật độ ngay khi app khởi động — đặt gần root. */
export function DensityBoot() {
  useDensity();
  return null;
}

export function DensityToggle() {
  const [d, setD] = useDensity();
  const compact = d === "compact";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 px-2"
          onClick={() => setD(compact ? "comfortable" : "compact")}
          aria-label="Chế độ giao diện gọn"
        >
          {compact ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          <span className="hidden text-xs md:inline">{compact ? "Thường" : "Gọn"}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {compact ? "Chuyển về mật độ thường" : "Chế độ gọn: thu nhỏ nút/icon/bảng để xem nhiều dữ liệu hơn"}
      </TooltipContent>
    </Tooltip>
  );
}
