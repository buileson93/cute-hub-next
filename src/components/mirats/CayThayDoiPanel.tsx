// Bảng "Thay đổi & Hoàn tác" — theo dõi các thay đổi sơ đồ hệ thống
// (di chuyển hệ thống, khai báo trường), duyệt/từ chối và hoàn tác về dữ liệu cũ.

import { useMemo } from "react";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check, X, Undo2, Loader2, MoveRight, ListPlus, History, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCayThayDoi, useCayRpc, type CayThayDoi } from "@/lib/mirats/cay-reorg";

const LOAI_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }> }> = {
  move_system: { label: "Di chuyển hệ thống", Icon: MoveRight },
  custom_fields: { label: "Khai báo trường dữ liệu", Icon: ListPlus },
};

const TRANG_THAI: Record<string, { label: string; badge: string }> = {
  cho_duyet: { label: "Chờ duyệt", badge: "border-amber-500/30 bg-amber-500/10 text-amber-600" },
  da_duyet: { label: "Đã áp dụng", badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" },
  tu_choi: { label: "Đã từ chối", badge: "border-muted-foreground/30 bg-muted text-muted-foreground" },
  da_hoan_tac: { label: "Đã hoàn tác", badge: "border-sky-500/30 bg-sky-500/10 text-sky-600" },
};

function describe(c: CayThayDoi): string {
  if (c.mo_ta) return c.mo_ta;
  if (c.loai === "custom_fields") {
    const n = Array.isArray((c.payload as { fields?: unknown[] }).fields)
      ? ((c.payload as { fields: unknown[] }).fields).length
      : 0;
    return `Cập nhật ${n} trường dữ liệu`;
  }
  return "Thay đổi phân lớp hệ thống";
}

export function CayThayDoiPanel({
  open, onClose, isAdmin, htNameMap,
}: {
  open: boolean;
  onClose: () => void;
  isAdmin: boolean;
  htNameMap?: Map<string, string>;
}) {
  const { data, isLoading } = useCayThayDoi();
  const { duyet, hoanTac } = useCayRpc();

  const rows = useMemo(() => data ?? [], [data]);
  const busy = duyet.isPending || hoanTac.isPending;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" /> Thay đổi &amp; Hoàn tác
          </SheetTitle>
          <SheetDescription>
            Nhật ký chỉnh sửa sơ đồ hệ thống. {isAdmin ? "Duyệt, từ chối hoặc hoàn tác về dữ liệu cũ." : "Admin sẽ duyệt các thay đổi bạn gửi."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-3 flex-1 overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : rows.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
              <ClipboardList className="h-8 w-8 opacity-40" />
              Chưa có thay đổi nào.
            </div>
          ) : (
            <ul className="space-y-2">
              {rows.map((c) => {
                const meta = LOAI_META[c.loai] ?? { label: c.loai, Icon: History };
                const st = TRANG_THAI[c.trang_thai] ?? { label: c.trang_thai, badge: "border-border bg-muted" };
                const Icon = meta.Icon;
                const htTen = c.he_thong_id ? htNameMap?.get(c.he_thong_id) : undefined;
                const canUndo = isAdmin && c.da_ap_dung && !c.da_hoan_tac;
                const canApprove = isAdmin && c.trang_thai === "cho_duyet";
                return (
                  <li key={c.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <Icon className="h-4 w-4 text-primary" /> {meta.label}
                      </div>
                      <span className={cn("rounded border px-1.5 py-0.5 text-meta", st.badge)}>{st.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{describe(c)}</div>
                    {htTen && <div className="mt-0.5 text-xs">Hệ thống: <span className="font-medium">{htTen}</span></div>}
                    <div className="mt-1 text-meta text-muted-foreground">
                      {new Date(c.created_at).toLocaleString("vi-VN")}
                    </div>

                    {(canApprove || canUndo) && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {canApprove && (
                          <>
                            <Button size="sm" className="h-7 px-2 text-xs" disabled={busy}
                              onClick={() => duyet.mutate({ id: c.id, approve: true })}>
                              <Check className="mr-1 h-3.5 w-3.5" /> Duyệt
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={busy}
                              onClick={() => duyet.mutate({ id: c.id, approve: false })}>
                              <X className="mr-1 h-3.5 w-3.5" /> Từ chối
                            </Button>
                          </>
                        )}
                        {canUndo && (
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" disabled={busy}
                            onClick={() => hoanTac.mutate(c.id)}>
                            <Undo2 className="mr-1 h-3.5 w-3.5" /> Hoàn tác
                          </Button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
