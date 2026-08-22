// ============================================================================
// UndoToast — thông báo thành công kèm nút "Hoàn tác" có ĐẾM NGƯỢC thời hạn.
//
// Dùng ngay sau khi áp dụng gán / chuyển / gỡ tài sản (đơn lẻ hoặc hàng loạt).
// Trong thời hạn (mặc định 12s), người dùng bấm "Hoàn tác" để đảo ngược thay
// đổi vừa áp dụng. Hết thời hạn, toast tự đóng và không còn hoàn tác nhanh
// (vẫn có thể hoàn tác thủ công ở hàng đợi thay đổi của admin).
// ============================================================================
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function UndoToastBody({
  toastId,
  message,
  seconds,
  onUndo,
}: {
  toastId: string | number;
  message: string;
  seconds: number;
  onUndo: () => void | Promise<void>;
}) {
  const [left, setLeft] = useState(seconds);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      const elapsed = (Date.now() - startedAt.current) / 1000;
      const remaining = Math.max(0, Math.ceil(seconds - elapsed));
      setLeft(remaining);
      if (remaining <= 0) clearInterval(t);
    }, 250);
    return () => clearInterval(t);
  }, [seconds]);

  const pct = Math.max(0, Math.min(100, (left / seconds) * 100));

  return (
    <div className="flex w-[356px] max-w-[92vw] items-center gap-3 rounded-lg border bg-background p-3 shadow-lg">
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{message}</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-[var(--duration-base)] ease-linear"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
            {left}s để hoàn tác
          </span>
        </div>
      </div>
      <Button
        size="sm"
        variant="outline"
        className={cn("h-8 shrink-0 gap-1.5")}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            await onUndo();
            toast.dismiss(toastId);
          } catch {
            setBusy(false);
          }
        }}
      >
        <Undo2 className="h-3.5 w-3.5" /> Hoàn tác
      </Button>
    </div>
  );
}

/** Hiển thị toast thành công có nút Hoàn tác đếm ngược. */
export function showUndoToast(opts: {
  message: string;
  onUndo: () => void | Promise<void>;
  seconds?: number;
}) {
  const seconds = opts.seconds ?? 12;
  toast.custom(
    (id) => (
      <UndoToastBody toastId={id} message={opts.message} seconds={seconds} onUndo={opts.onUndo} />
    ),
    { duration: seconds * 1000 },
  );
}
