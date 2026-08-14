import { useState } from "react";
import {
  BookOpen, KeyRound, Link2, AlertTriangle, CheckCircle2, Bot, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger,
} from "@/components/ui/sheet";
import { ALLINONE_LAYERS, layerTable } from "@/lib/mirats/allinone-template";

/**
 * Nút "Hướng dẫn" gọn: mở Drawer bên phải thay vì accordion inline
 * chiếm chỗ trên trang. Nội dung rút xuống các điểm cốt lõi.
 */
export function AllInOneGuide() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <AppTooltip noiDung="Hướng dẫn nhập liệu Excel/CSV (đọc một lần là đủ dùng)">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="sr-only">Hướng dẫn nhập</span>
          </Button>
        </AppTooltip>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-primary" /> Hướng dẫn all-in-one
          </SheetTitle>
          <SheetDescription className="text-xs">Đọc 1 lần là đủ dùng.</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-4 text-sm">
          <section className="space-y-1.5">
            <h3 className="font-semibold">3 nguyên tắc</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li className="flex gap-1.5"><KeyRound className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span><b className="text-foreground">ma</b> = khoá upsert. Giữ ma → cập nhật, trống ma → tạo mới.</span></li>
              <li className="flex gap-1.5"><Link2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span>Cha trước, con sau. Điền sheet theo thứ tự 1 → 10.</span></li>
              <li className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-primary" /><span>Idempotent — nhập lại không nhân bản.</span></li>
            </ul>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold">Thứ tự sheet</h3>
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/50 text-left">
                  <tr><th className="px-2 py-1 font-medium">Sheet</th><th className="px-2 py-1 font-medium">Bảng</th></tr>
                </thead>
                <tbody>
                  {ALLINONE_LAYERS.map((l) => (
                    <tr key={l.sheet} className="border-t" title={l.desc}>
                      <td className="whitespace-nowrap px-2 py-1">{l.sheet}</td>
                      <td className="whitespace-nowrap px-2 py-1 font-mono text-muted-foreground">{layerTable(l)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-1.5">
            <h3 className="flex items-center gap-1.5 font-semibold"><AlertTriangle className="h-3.5 w-3.5 text-amber-500" /> Lỗi hay gặp</h3>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>• Trỏ danh mục chưa tồn tại → khai ở sheet cha trước.</li>
              <li>• Đổi <code>ma</code> cũ → tạo bản trùng.</li>
              <li>• Trùng <code>ma_serial</code> → để trống nếu chưa có.</li>
              <li>• Sửa tên cột tiêu đề → sai ánh xạ.</li>
            </ul>
          </section>

          <section className="space-y-1.5 rounded-md border border-dashed border-primary/40 bg-primary/5 p-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold"><Bot className="h-3.5 w-3.5 text-primary" /> Dành cho AI agent</h3>
            <ol className="list-decimal space-y-0.5 pl-4 text-[11px] text-muted-foreground">
              <li>Xuất kèm dữ liệu để lấy đúng <code>ma</code> hợp lệ.</li>
              <li>Điền theo thứ tự 1 → 10, cột <code>ref</code> chỉ dùng giá trị đã tồn tại.</li>
              <li>Chỉ điền <code>model</code> ở dòng tài sản — không lặp NSX/Loại.</li>
              <li>Ghi sau khi Xem trước đúng kỳ vọng.</li>
            </ol>
          </section>

          <div className="flex flex-wrap gap-1">
            <Badge variant="secondary" className="gap-1 text-[10px]"><KeyRound className="h-2.5 w-2.5" />ma = khoá</Badge>
            <Badge variant="secondary" className="gap-1 text-[10px]"><Layers className="h-2.5 w-2.5" />10 lớp</Badge>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
