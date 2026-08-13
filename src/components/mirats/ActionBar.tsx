import { Plus, Pencil, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/hooks/use-session";
import { canWrite, type Domain } from "@/lib/mirats/quyen";
import { NHAN } from "@/lib/mirats/tu-vung";
import { ReadOnlyBadge } from "@/components/mirats/ReadOnlyBadge";

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
        <ReadOnlyBadge />
        {extra}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {onTao && (
        <Button size="sm" onClick={onTao}>
          <Plus className="h-4 w-4 mr-1" aria-hidden /> {NHAN.tao}
        </Button>
      )}
      {onSua && (
        <Button size="sm" variant="secondary" onClick={onSua}>
          <Pencil className="h-4 w-4 mr-1" aria-hidden /> {NHAN.sua}
        </Button>
      )}
      {onHoanThanh && (
        <Button size="sm" variant="default" onClick={onHoanThanh}>
          <CheckCircle2 className="h-4 w-4 mr-1" aria-hidden /> {NHAN.hoanThanh}
        </Button>
      )}
      {onDong && (
        <Button size="sm" variant="outline" onClick={onDong}>
          <XCircle className="h-4 w-4 mr-1" aria-hidden /> {NHAN.dong}
        </Button>
      )}
      {onXoa && (
        <Button size="sm" variant="destructive" onClick={onXoa}>
          <Trash2 className="h-4 w-4 mr-1" aria-hidden /> {NHAN.xoa}
        </Button>
      )}
      {extra}
    </div>
  );
}
