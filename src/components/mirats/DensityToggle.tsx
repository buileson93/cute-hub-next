import { useEffect, useState } from "react";
import { Minimize2, Maximize2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const KEY = "mirats.density";
export type Density = "compact" | "comfortable" | "spacious";

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
  const nextDensity = (current: Density): Density => {
    if (current === "compact") return "comfortable";
    if (current === "comfortable") return "spacious";
    return "compact";
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 px-2"
          onClick={() => setD(nextDensity(d))}
          aria-label="Thay đổi mật độ hiển thị"
        >
          {d === "compact" ? <Minimize2 className="h-4 w-4" /> : d === "comfortable" ? <LayoutGrid className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden text-xs md:inline">
            {d === "compact" ? "Gọn" : d === "comfortable" ? "Vừa" : "Thoáng"}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {d === "compact" ? "Chế độ Gọn: Tối đa hóa dữ liệu hiển thị" : d === "comfortable" ? "Chế độ Vừa: Cân bằng giữa dữ liệu và khoảng trống" : "Chế độ Thoáng: Dễ nhìn, khoảng cách rộng rãi"}
      </TooltipContent>
    </Tooltip>
  );
}
