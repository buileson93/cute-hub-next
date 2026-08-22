// ============================================================================
// AssignSystemDialog — chọn hệ thống đích để GÁN tài sản vào (từ Danh mục › Tài sản).
//
// Dùng chung cho gán 1 tài sản hoặc gán hàng loạt. Có ô tìm kiếm nhanh theo
// tên / mã hệ thống. Ghi vào CSDL qua RPC cay_submit_change (move_device) — admin
// áp dụng ngay, phòng KT chờ duyệt, đều có thể hoàn tác.
// ============================================================================
import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalize } from "@/lib/mirats/global-search";
import { cn } from "@/lib/utils";

export interface AssignSystemOption {
  id: string;
  ma: string;
  ten: string;
}

export function AssignSystemDialog({
  open,
  onOpenChange,
  systems,
  systemName,
  count,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  systems: AssignSystemOption[];
  /** Tra tên hiển thị (có thể có override) theo id hệ thống. */
  systemName?: (id: string, fallback: string) => string;
  /** Số tài sản sắp gán (để hiển thị). */
  count: number;
  onConfirm: (systemId: string, systemLabel: string) => void;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const nq = normalize(q).trim();
    const list = systems.map((s) => ({
      ...s,
      _label: systemName ? systemName(s.id, s.ten) : s.ten,
    }));
    if (!nq) return list;
    return list.filter((s) => normalize(s._label).includes(nq) || normalize(s.ma).includes(nq));
  }, [systems, systemName, q]);

  const handleOpenChange = (o: boolean) => {
    if (!o) {
      setQ("");
      setSelected(null);
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gán vào hệ thống</DialogTitle>
          <DialogDescription>
            Chọn hệ thống đích cho <b>{count}</b> tài sản. Tài sản sẽ nhận phân loại/lĩnh vực của hệ
            thống đích.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm hệ thống theo tên hoặc mã…"
            className="h-9 pl-8"
          />
        </div>

        <div className="max-h-[46vh] overflow-y-auto rounded-md border">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Không tìm thấy hệ thống phù hợp.
            </div>
          ) : (
            filtered.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelected(s.id)}
                className={cn(
                  "flex w-full items-center gap-2 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60",
                  selected === s.id && "bg-primary/10",
                )}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0 text-primary",
                    selected === s.id ? "opacity-100" : "opacity-0",
                  )}
                />
                <div className="min-w-0">
                  <div className="truncate font-medium">{s._label}</div>
                  {s.ma && (
                    <div className="truncate font-mono text-[11px] text-muted-foreground">
                      {s.ma}
                    </div>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              const s = filtered.find((x) => x.id === selected);
              if (s) onConfirm(s.id, s._label);
              handleOpenChange(false);
            }}
          >
            Xác nhận gán
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
