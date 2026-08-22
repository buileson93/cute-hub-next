import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { validateKhai, previewKhai, type KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";

interface Props {
  open: boolean;
  input: KhaiNghiepVuInput | null;
  dangGhi?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Dialog dùng chung cho các form khai (sự cố / bảo dưỡng / hỏng hóc).
 * Hiển thị PREVIEW: validate + danh sách tác động sẽ phát sinh khi ghi.
 * Nút Xác nhận chỉ bật khi không còn lỗi.
 */
export function PreviewKhaiDialog({ open, input, dangGhi, onCancel, onConfirm }: Props) {
  if (!input) return null;
  const kq = validateKhai(input);
  const pv = previewKhai(input);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Xác nhận ghi nhận nghiệp vụ</DialogTitle>
          <DialogDescription>{pv.tomTat}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {kq.loi.length > 0 && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-destructive">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <XCircle className="h-4 w-4" /> Lỗi cần sửa
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {kq.loi.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}
          {kq.canhBao.length > 0 && (
            <div className="rounded-md border border-yellow-500/50 bg-yellow-500/10 p-3">
              <div className="flex items-center gap-2 text-sm font-medium mb-1">
                <AlertTriangle className="h-4 w-4" /> Cảnh báo
              </div>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {kq.canhBao.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-md border p-3 bg-muted/30">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Sẽ phát sinh
            </div>
            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
              {pv.sePhatSinh.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={dangGhi}>
            Huỷ
          </Button>
          <Button onClick={onConfirm} disabled={!kq.hopLe || dangGhi}>
            {dangGhi ? "Đang ghi..." : "Xác nhận ghi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
