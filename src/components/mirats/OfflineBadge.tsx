import { Wifi, WifiOff, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useOfflineStatus } from "@/hooks/use-offline-queue";
import { cn } from "@/lib/utils";

/**
 * N11 — Badge chỉ báo trạng thái mạng + số thao tác chờ đồng bộ.
 * Đặt ở header để user thấy ngay khi mạng ngắt và có mutation đang xếp hàng.
 */
export function OfflineBadge({ className }: { className?: string }) {
  const s = useOfflineStatus();
  const pendingLike = s.pending + s.in_flight;

  // Trường hợp lý tưởng: online + queue rỗng → không hiển thị gì (giảm nhiễu).
  if (s.online && s.total === 0) return null;

  if (!s.online) {
    return (
      <Badge variant="warning" className={cn("gap-1", className)}>
        <WifiOff className="h-3 w-3 opacity-80" />
        Offline{pendingLike > 0 && ` • ${pendingLike} chờ`}
      </Badge>
    );
  }

  if (s.conflict > 0 || s.failed > 0) {
    return (
      <Badge variant="destructive" className={cn("gap-1", className)}>
        <Clock className="h-3 w-3" />
        {s.conflict + s.failed} cần xử lý
      </Badge>
    );
  }

  if (pendingLike > 0) {
    return (
      <Badge variant="outline" className={cn("gap-1", className)}>
        <Clock className="h-3 w-3" />
        Đang đồng bộ ({pendingLike})
      </Badge>
    );
  }

  return (
    <Badge variant="success" className={cn("gap-1", className)}>
      <Wifi className="h-3 w-3 opacity-80" />
      Online
    </Badge>
  );
}
