import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Task 25 — Trạng thái lỗi dùng chung.
interface Props {
  title?: string;
  message?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = "Đã xảy ra lỗi", message, onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-10 px-4 text-center",
        className,
      )}
    >
      <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
      <div className="text-sm font-medium text-destructive">{title}</div>
      {message && (
        <div className="text-xs text-destructive/80 max-w-md whitespace-pre-wrap">{message}</div>
      )}
      {onRetry && (
        <Button size="sm" variant="outline" className="mt-2" onClick={onRetry}>
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
          Thử lại
        </Button>
      )}
    </div>
  );
}
