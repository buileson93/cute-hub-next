import { Link } from "@tanstack/react-router";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Hiển thị khi người dùng cố mở bản ghi ngoài phạm vi đơn vị của mình. */
export function AccessDenied({ backTo, backLabel }: { backTo: string; backLabel: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldOff className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <h1 className="text-lg font-semibold">Không có quyền truy cập</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Bản ghi này thuộc đơn vị khác. Bạn chỉ có thể xem dữ liệu của đơn vị mình.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link to={backTo}>
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
