import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { NHAN } from "@/lib/mirats/tu-vung";
import { toast } from "sonner";

// Task 26 — Hộp thoại xác nhận dùng chung.
// Mọi hành động Xoá / Đóng / Hoàn thành phải đi qua đây để mô tả hậu quả rõ ràng.
export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Mô tả hậu quả rõ ràng — bắt buộc; đừng để trống. */
  description: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  /**
   * Handler thực thi. Có thể async. Nếu throw, dialog vẫn mở và toast lỗi hiện ra.
   * Trả về (hoặc resolve) bình thường → toast thành công (nếu truyền successMessage).
   */
  onConfirm: () => void | Promise<void>;
  successMessage?: string;
  /** Ẩn toast tự động khi caller muốn tự xử lý thông báo. */
  silent?: boolean;
}

export function ConfirmDialog({
  open, onOpenChange, title, description,
  confirmLabel, cancelLabel = NHAN.huy,
  danger = false, onConfirm, successMessage, silent = false,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  async function handle() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
      if (!silent && successMessage) toast.success(successMessage);
      onOpenChange(false);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : "Không thực hiện được thao tác");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-sm text-muted-foreground">{description}</div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); void handle(); }}
            disabled={busy}
            className={cn(
              danger &&
              "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive",
            )}
          >
            {busy ? "Đang xử lý…" : (confirmLabel ?? NHAN.xacNhan)}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
