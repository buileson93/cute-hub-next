// So sánh song song (side-by-side diff) một lần chỉnh sửa: cột "Trước" và cột "Sau".
// Dùng trong Nhật ký thay đổi (ChangeLogPanel) để xem chính xác từng trường đã đổi giữa hai phiên bản.
import { ArrowRight, Columns2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatVal, type ChangeEvent } from "@/lib/mirats/change-log";

function DiffCell({ value, tone }: { value: unknown; tone: "before" | "after" }) {
  const empty = value === null || value === undefined || value === "";
  const base =
    tone === "before"
      ? "border-destructive/20 bg-destructive/10 text-destructive"
      : "border-primary/20 bg-primary/10 text-primary";
  return (
    <div
      className={`min-h-[2rem] whitespace-pre-wrap break-words rounded-md border px-2.5 py-1.5 text-xs ${base} ${empty ? "italic opacity-70" : ""}`}
    >
      {formatVal(value)}
    </div>
  );
}

export function ChangeDiffDialog({
  open,
  onOpenChange,
  event,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: ChangeEvent | null;
  title?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Columns2 className="h-4 w-4" /> So sánh song song
          </DialogTitle>
          <DialogDescription>
            {event ? (
              <>
                {new Date(event.at).toLocaleString("vi-VN")} · bởi {event.userName}
                {title ? ` · ${title}` : ""}
              </>
            ) : (
              "—"
            )}
          </DialogDescription>
        </DialogHeader>

        {event && event.changes.length > 0 ? (
          <ScrollArea className="max-h-[65vh] pr-3">
            {/* Header hàng cột */}
            <div className="mb-2 grid grid-cols-[minmax(120px,1fr)_1fr_auto_1fr] items-center gap-2 px-0.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Trường</span>
              <span className="flex items-center gap-1">
                <Badge
                  variant="outline"
                  className="border-destructive/30 bg-destructive/10 text-destructive"
                >
                  Trước
                </Badge>
              </span>
              <span aria-hidden />
              <span className="flex items-center gap-1">
                <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                  Sau
                </Badge>
              </span>
            </div>
            <div className="space-y-1.5">
              {event.changes.map((c, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[minmax(120px,1fr)_1fr_auto_1fr] items-center gap-2 rounded-md odd:bg-muted/40 px-1.5 py-1"
                >
                  <span className="text-xs font-medium">{c.label}</span>
                  <DiffCell value={c.from} tone="before" />
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <DiffCell value={c.to} tone="after" />
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            {event?.action === "insert"
              ? "Bản ghi được tạo mới — không có phiên bản trước để so sánh."
              : event?.action === "delete"
                ? "Bản ghi đã bị xoá."
                : "Không có trường nào thay đổi."}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
