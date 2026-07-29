// ============================================================================
// BulkActionButton — nút hành động hàng loạt có:
//  • Kiểm tra quyền: không đủ quyền thì vô hiệu hoá, hiện ổ khoá + lý do rõ ràng.
//  • Hộp thoại xác nhận trước khi chạy (tránh thao tác nhầm trên nhiều dòng).
// ============================================================================

import { useState, type ReactNode } from "react";
import { Lock } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  label: string;
  icon?: ReactNode;
  /** false ⇒ nút bị khoá; kèm `lyDoKhoa` để giải thích. */
  duocPhep?: boolean;
  lyDoKhoa?: string;
  busy?: boolean;
  /** Tiêu đề & nội dung hộp thoại xác nhận. Bỏ trống ⇒ chạy ngay. */
  xacNhan?: { tieuDe: string; moTa: ReactNode; nutXacNhan?: string; nguyHiem?: boolean };
  onRun: () => void | Promise<void>;
  variant?: "outline" | "destructive" | "default" | "ghost";
};

export function BulkActionButton({
  label, icon, duocPhep = true, lyDoKhoa, busy = false, xacNhan, onRun, variant = "outline",
}: Props) {
  const [open, setOpen] = useState(false);

  const nut = (
    <Button
      size="sm"
      variant={duocPhep ? variant : "outline"}
      className="h-7 gap-1.5 text-xs"
      disabled={!duocPhep || busy}
      aria-disabled={!duocPhep || busy}
      onClick={() => {
        if (!duocPhep) {
          toast.error(lyDoKhoa ?? "Bạn không có quyền thực hiện thao tác này.");
          return;
        }
        if (xacNhan) setOpen(true);
        else void onRun();
      }}
    >
      {duocPhep ? icon : <Lock className="h-3.5 w-3.5" />} {label}
    </Button>
  );

  return (
    <>
      {duocPhep ? nut : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex cursor-not-allowed">{nut}</span>
            </TooltipTrigger>
            <TooltipContent>{lyDoKhoa ?? "Bạn không có quyền thực hiện thao tác này."}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {xacNhan && (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{xacNhan.tieuDe}</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">{xacNhan.moTa}</div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                className={xacNhan.nguyHiem ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : undefined}
                onClick={() => void onRun()}
              >
                {xacNhan.nutXacNhan ?? "Xác nhận"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
