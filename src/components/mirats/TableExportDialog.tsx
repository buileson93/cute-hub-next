// ============================================================================
// TableExportDialog — hộp thoại xuất CSV dùng chung cho mọi bảng.
//  • Chọn phạm vi: dòng đã chọn / toàn bộ sau lọc / trang đang xem.
//  • Chọn cột: theo cột đang hiển thị hoặc tự tick từng cột.
//  • Xem trước số dòng/số cột trước khi tải — tránh xuất nhầm.
// ============================================================================

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  buildCsv, exportableCols, slugTen, taiFileCsv, SCOPE_LABEL,
  type ExportCol, type ExportScope,
} from "@/lib/mirats/ui/table-export";

type Props<T> = {
  /** Tên gợi ý cho file (không cần đuôi .csv). */
  ten: string;
  /** Cột đang hiển thị (đúng thứ tự người dùng đã sắp). */
  visibleColumns: readonly ExportCol<T>[];
  /** Toàn bộ cột khai báo của bảng (kể cả cột đang ẩn). */
  allColumns: readonly ExportCol<T>[];
  rowsByScope: Record<ExportScope, readonly T[]>;
  /** Phạm vi mặc định khi mở hộp thoại. */
  defaultScope?: ExportScope;
  countUnit?: string;
  trigger?: React.ReactNode;
};

export function TableExportDialog<T>({
  ten, visibleColumns, allColumns, rowsByScope,
  defaultScope, countUnit = "dòng", trigger,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const coChon = rowsByScope.selected.length > 0;
  const [scope, setScope] = useState<ExportScope>(defaultScope ?? (coChon ? "selected" : "filtered"));
  const [cheDoCot, setCheDoCot] = useState<"visible" | "all" | "custom">("all");
  const [cotChon, setCotChon] = useState<string[]>(() => allColumns.map((c) => c.key));
  const [sep, setSep] = useState(";");
  const [tenFile, setTenFile] = useState(
    () => `${slugTen(ten)}-${new Date().toISOString().slice(0, 10)}`,
  );

  const cotKhaDung = useMemo(() => exportableCols(allColumns), [allColumns]);
  const cols = useMemo(() => {
    if (cheDoCot === "visible") return exportableCols(visibleColumns);
    if (cheDoCot === "all") return exportableCols(allColumns);
    const set = new Set(cotChon);
    return cotKhaDung.filter((c) => set.has(c.key));
  }, [cheDoCot, visibleColumns, allColumns, cotChon, cotKhaDung]);

  const rows = rowsByScope[scope] ?? [];
  const sanSang = rows.length > 0 && cols.length > 0;

  const xuat = () => {
    if (!sanSang) return;
    taiFileCsv(`${slugTen(tenFile)}.csv`, buildCsv(rows, cols, sep));
    toast.success(`Đã xuất ${rows.length.toLocaleString("vi-VN")} ${countUnit} × ${cols.length} cột ra CSV.`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      if (v) setScope(defaultScope ?? (rowsByScope.selected.length > 0 ? "selected" : "filtered"));
    }}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="h-8 gap-1.5">
            <Download className="h-3.5 w-3.5" /> Xuất CSV
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Xuất dữ liệu ra CSV</DialogTitle>
          <DialogDescription>
            Chọn phạm vi dòng và cột cần xuất. File dùng mã UTF-8 (mở được bằng Excel).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Phạm vi dòng</Label>
            <RadioGroup value={scope} onValueChange={(v) => setScope(v as ExportScope)} className="gap-2">
              {(["selected", "filtered", "page"] as ExportScope[]).map((s) => {
                const n = rowsByScope[s]?.length ?? 0;
                return (
                  <div key={s} className="flex items-center gap-2">
                    <RadioGroupItem value={s} id={`scope-${s}`} disabled={n === 0} />
                    <Label htmlFor={`scope-${s}`} className={n === 0 ? "text-muted-foreground" : ""}>
                      {SCOPE_LABEL[s]}{" "}
                      <span className="text-xs text-muted-foreground">
                        ({n.toLocaleString("vi-VN")} {countUnit})
                      </span>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Cột xuất</Label>
            <RadioGroup
              value={cheDoCot}
              onValueChange={(v) => {
                const val = v as "visible" | "all" | "custom";
                setCheDoCot(val);
                if (val === "custom") {
                  setCotChon(exportableCols(visibleColumns).map((c) => c.key));
                }
              }}
              className="gap-2"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="visible" id="cols-visible" />
                <Label htmlFor="cols-visible">
                  Theo cột đang hiển thị ({exportableCols(visibleColumns).length} cột)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="all" id="cols-all" />
                <Label htmlFor="cols-all">
                  Toàn bộ cột hệ thống ({exportableCols(allColumns).length} cột)
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="custom" id="cols-custom" />
                <Label htmlFor="cols-custom">Tùy chọn từng cột...</Label>
              </div>
            </RadioGroup>

            {cheDoCot === "custom" && (
              <div className="max-h-52 space-y-1 overflow-auto rounded-md border p-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex gap-3 pb-1 text-xs">
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setCotChon(cotKhaDung.map((c) => c.key))}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setCotChon([])}
                  >
                    Bỏ chọn
                  </button>
                </div>
                {cotKhaDung.map((c) => (
                  <div key={c.key} className="flex items-center gap-2">
                    <Checkbox
                      id={`col-${c.key}`}
                      checked={cotChon.includes(c.key)}
                      onCheckedChange={(v) =>
                        setCotChon((prev) =>
                          v === true ? [...prev, c.key] : prev.filter((k) => k !== c.key)
                        )
                      }
                    />
                    <Label htmlFor={`col-${c.key}`} className="font-normal">
                      {c.header || c.label}
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ten-file" className="text-xs uppercase tracking-wide text-muted-foreground">Tên file</Label>
              <Input id="ten-file" value={tenFile} onChange={(e) => setTenFile(e.target.value)} className="h-8" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dau-phan-cach" className="text-xs uppercase tracking-wide text-muted-foreground">Dấu phân cách</Label>
              <select
                id="dau-phan-cach"
                value={sep}
                onChange={(e) => setSep(e.target.value)}
                className="h-8 w-full rounded-md border border-input bg-background px-2 text-sm"
              >
                <option value=";">Chấm phẩy ( ; ) — Excel VN</option>
                <option value=",">Dấu phẩy ( , )</option>
                <option value={"\t"}>Tab</option>
              </select>
            </div>
          </div>

          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Sẽ xuất <b>{rows.length.toLocaleString("vi-VN")}</b> {countUnit} × <b>{cols.length}</b> cột.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Huỷ</Button>
          <Button onClick={xuat} disabled={!sanSang} className="gap-1.5">
            <Download className="h-4 w-4" /> Tải file CSV
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
