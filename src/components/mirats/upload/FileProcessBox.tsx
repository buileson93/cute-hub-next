// ============================================================================
// Process Box — hiển thị tiến trình xử lý từng tệp theo dạng stepper:
// chọn tệp → kiểm tra → nhận diện PDF scan → OCR trên thiết bị → tải lên →
// xác nhận lưu trữ → hoàn tất/thất bại. Dùng lại cho mọi khu vực đính kèm tệp.
// ============================================================================

import { AlertTriangle, Check, CircleSlash, Loader2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  buildSteps,
  formatBytes,
  ocrSummary,
  storageProviderLabel,
  type FileProcessState,
  type StepState,
} from "@/lib/mirats/upload/file-process";

function StepIcon({ state }: { state: StepState }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  if (state === "active") return <Loader2 className={cn(cls, "animate-spin text-primary")} aria-hidden="true" />;
  if (state === "completed") return <Check className={cn(cls, "text-success")} aria-hidden="true" />;
  if (state === "failed") return <X className={cn(cls, "text-destructive")} aria-hidden="true" />;
  if (state === "warning") return <AlertTriangle className={cn(cls, "text-warning")} aria-hidden="true" />;
  if (state === "skipped") return <CircleSlash className={cn(cls, "text-muted-foreground")} aria-hidden="true" />;
  return <span className={cn(cls, "rounded-full border border-muted-foreground/40")} aria-hidden="true" />;
}

const STATE_TEXT: Record<StepState, string> = {
  pending: "chờ",
  active: "đang chạy",
  completed: "xong",
  skipped: "bỏ qua",
  warning: "cảnh báo",
  failed: "lỗi",
};

export interface FileProcessBoxProps {
  item: FileProcessState;
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}

export function FileProcessBox({
  item,
  onRetry,
  onCancel,
  onDismiss,
  className,
}: FileProcessBoxProps) {
  const steps = buildSteps(item);
  const running = !["completed", "failed", "cancelled"].includes(item.phase);
  const showProgress = item.phase === "ocr" || item.phase === "uploading";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-3 text-left shadow-none transition-all",
        item.phase === "failed" && "border-destructive/40",
        className,
      )}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold" title={item.fileName}>
            {item.fileName}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {formatBytes(item.fileSize)} · {item.fileType || "không rõ định dạng"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {item.phase === "failed" && onRetry ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Thử lại tệp ${item.fileName}`}
              onClick={() => onRetry(item.id)}
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          {running && onCancel ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Huỷ xử lý tệp ${item.fileName}`}
              onClick={() => onCancel(item.id)}
            >
              <CircleSlash className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
          {!running && onDismiss ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Ẩn tiến trình tệp ${item.fileName}`}
              onClick={() => onDismiss(item.id)}
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </div>

      <ol className="mt-2 space-y-1" aria-live="polite" aria-atomic="false">
        {steps.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-[11px]">
            <StepIcon state={s.state} />
            <span
              className={cn(
                "min-w-0 truncate",
                s.state === "pending" && "text-muted-foreground/70",
                s.state === "active" && "font-semibold text-foreground",
                s.state === "failed" && "text-destructive",
                s.state === "warning" && "text-warning",
              )}
            >
              {s.label}
            </span>
            <span className="sr-only">{STATE_TEXT[s.state]}</span>
          </li>
        ))}
      </ol>

      {showProgress ? (
        <Progress
          value={Math.round(item.progress * 100)}
          className="mt-2 h-1.5"
          aria-label={item.phase === "ocr" ? "Tiến độ OCR" : "Tiến độ tải lên"}
        />
      ) : null}

      {item.phase === "completed" ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          {ocrSummary(item.ocr)} · {storageProviderLabel(item.storageProvider)}
        </p>
      ) : null}

      {item.errorMessage ? (
        <p className="mt-2 text-[11px] font-medium text-destructive" role="alert">
          {item.errorMessage}
        </p>
      ) : null}
    </div>
  );
}

export function FileProcessList({
  items,
  onRetry,
  onCancel,
  onDismiss,
  className,
}: {
  items: FileProcessState[];
  onRetry?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDismiss?: (id: string) => void;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn("space-y-2", className)}>
      {items.map((item) => (
        <FileProcessBox
          key={item.id}
          item={item}
          onRetry={onRetry}
          onCancel={onCancel}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
