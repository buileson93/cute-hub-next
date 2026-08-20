import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/hooks/use-session";
import { canWrite, type Domain } from "@/lib/mirats/quyen";
import { NHAN } from "@/lib/mirats/tu-vung";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

// Task 26 — Thanh hành động dùng chung.
// - Chỉ render nút khi user có quyền GHI ở miền tương ứng (canWrite khớp RLS/RPC).
// - Nếu không có quyền: hiển thị ReadOnlyBadge "Chỉ tra cứu" (đồng bộ Task 9).
export interface ActionBarProps {
  domain: Domain;
  roles: readonly AppRole[] | null | undefined;
  onTao?: () => void;
  onSua?: () => void;
  onXoa?: () => void;
  onHoanThanh?: () => void;
  onDong?: () => void;
  /** Nút phụ tuỳ biến — hiển thị sau các nút chuẩn. */
  extra?: React.ReactNode;
  className?: string;
  /** Ép chế độ chỉ đọc dù có quyền (ví dụ trang lịch sử). */
  forceReadOnly?: boolean;
}

export function ActionBar({
  domain, roles, onTao, onSua, onXoa, onHoanThanh, onDong,
  extra, className, forceReadOnly = false,
}: ActionBarProps) {
  const allowed = !forceReadOnly && canWrite(domain, roles);

  if (!allowed) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
          <Badge variant="outline" className="gap-1.5 py-0.5 text-muted-foreground font-medium">
            <Lock className="h-3 w-3" />
            Chế độ chỉ đọc
          </Badge>
        {extra}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {onTao && (
        <AppTooltip noiDung={NHAN.tao}>
          <Button size="sm" className="h-8 w-8 p-0" onClick={onTao}>
            <Plus className="h-4 w-4" aria-hidden />
            <span className="sr-only">{NHAN.tao}</span>
          </Button>
        </AppTooltip>
      )}
      {onSua && (
        <AppTooltip noiDung={NHAN.sua}>
          <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={onSua}>
            <Pencil className="h-4 w-4" aria-hidden />
            <span className="sr-only">{NHAN.sua}</span>
          </Button>
        </AppTooltip>
      )}
      {onHoanThanh && (
        <AppTooltip noiDung={NHAN.hoanThanh}>
          <Button size="sm" variant="default" className="h-8 w-8 p-0" onClick={onHoanThanh}>
            <CheckCircle2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">{NHAN.hoanThanh}</span>
          </Button>
        </AppTooltip>
      )}
      {onDong && (
        <AppTooltip noiDung={NHAN.dong}>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={onDong}>
            <XCircle className="h-4 w-4" aria-hidden />
            <span className="sr-only">{NHAN.dong}</span>
          </Button>
        </AppTooltip>
      )}
      {onXoa && (
        <AppTooltip noiDung={NHAN.xoa}>
          <Button size="sm" variant="destructive" className="h-8 w-8 p-0" onClick={onXoa}>
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="sr-only">{NHAN.xoa}</span>
          </Button>
        </AppTooltip>
      )}
      {extra}
    </div>
  );
}
