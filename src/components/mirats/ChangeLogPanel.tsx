// Bảng hiển thị nhật ký thay đổi dữ liệu từng trường cho Sổ lý lịch (tài sản / hệ thống).
import { useState } from "react";
import { Loader2, PencilLine, PlusCircle, Trash2, ArrowRight, Columns2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChangeLog, formatVal, type ChangeAction, type ChangeEvent } from "@/lib/mirats/change-log";
import { ChangeDiffDialog } from "./ChangeDiffDialog";

const actionMeta: Record<ChangeAction, { name: string; icon: React.ComponentType<{ className?: string }>; dot: string; chip: string }> = {
  update: { name: "Chỉnh sửa dữ liệu", icon: PencilLine, dot: "bg-primary", chip: "bg-primary/10 text-primary border-primary/20" },
  insert: { name: "Tạo mới", icon: PlusCircle, dot: "bg-success", chip: "bg-success/10 text-success border-success/20" },
  delete: { name: "Xoá", icon: Trash2, dot: "bg-destructive", chip: "bg-destructive/10 text-destructive border-destructive/20" },
};

export function ChangeLogPanel({ entity, entityId }: { entity: string; entityId: string | null | undefined }) {
  const { data: events = [], isLoading, error } = useChangeLog(entity, entityId);
  const [diffEvent, setDiffEvent] = useState<ChangeEvent | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải nhật ký thay đổi…
      </div>
    );
  }
  if (error) {
    return <p className="text-sm text-muted-foreground">Chỉ tài khoản Quản trị / Phòng Kỹ thuật mới xem được nhật ký thay đổi dữ liệu.</p>;
  }
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">Chưa có thay đổi dữ liệu nào được ghi nhận.</p>;
  }

  return (
    <ol className="relative ml-2 border-l border-border pl-6">
      {events.map((ev) => {
        const m = actionMeta[ev.action];
        const Icon = m.icon;
        return (
          <li key={ev.id} className="relative mb-5 last:mb-0">
            <span className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background ${m.dot}`}>
              <Icon className="h-3.5 w-3.5 text-primary-foreground" />
            </span>
            <div className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {new Date(ev.at).toLocaleString("vi-VN")}
                </span>
                <Badge variant="outline" className={m.chip}>{m.name}</Badge>
                {ev.action === "update" && ev.changes.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-2 text-xs text-primary hover:text-primary/90 hover:bg-primary/5"
                    onClick={() => setDiffEvent(ev)}
                  >
                    <Columns2 className="h-3.5 w-3.5" /> So sánh
                  </Button>
                )}
                <span className="ml-auto text-xs text-muted-foreground">bởi {ev.userName}</span>
              </div>
              {ev.action === "update" && (
                <ul className="mt-2 space-y-1.5">
                  {ev.changes.map((c, i) => (
                    <li key={i} className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium">{c.label}:</span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground line-through">{formatVal(c.from)}</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-foreground">{formatVal(c.to)}</span>
                    </li>
                  ))}
                </ul>
              )}
              {ev.action === "insert" && <div className="mt-1 text-muted-foreground">Bản ghi được tạo mới.</div>}
              {ev.action === "delete" && <div className="mt-1 text-muted-foreground">Bản ghi đã bị xoá.</div>}
            </div>
          </li>
        );
      })}
      <ChangeDiffDialog
        open={!!diffEvent}
        onOpenChange={(v) => { if (!v) setDiffEvent(null); }}
        event={diffEvent}
      />
    </ol>
  );
}
