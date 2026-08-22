import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompletenessRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
  showText?: boolean;
}

export function CompletenessRing({
  value,
  size = 40,
  strokeWidth = 4,
  className,
  showText = false,
}: CompletenessRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const getTone = (v: number) => {
    if (v >= 90) return "text-emerald-500 stroke-emerald-500";
    if (v >= 60) return "text-amber-500 stroke-amber-500";
    return "text-red-500 stroke-red-500";
  };

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-500", getTone(value))}
        />
      </svg>
      {showText && <span className="absolute text-[10px] font-bold">{Math.round(value)}%</span>}
    </div>
  );
}
