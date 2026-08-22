// ============================================================================
// Hiển thị LỊCH SỬ gán / chuyển / gỡ tài sản (ai làm, lúc nào, trước → sau).
//
//   <DeviceMovementHistoryList/>   — danh sách timeline (dùng trong ngăn chi tiết)
//   <DeviceMovementHistoryDialog/> — hộp thoại lịch sử tổng (mở từ thanh công cụ)
//
// Cả hai nhận resolver tên hệ thống & tên tài sản để hiển thị nhãn dễ đọc thay
// vì UUID. Dữ liệu lấy từ hook useDeviceMovementHistory (bảng cay_thay_doi).
// ============================================================================
import { useMemo, useState } from "react";
import {
  History,
  PackagePlus,
  PackageMinus,
  ArrowRightLeft,
  ArrowRight,
  Loader2,
  PackageOpen,
  Undo2,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDT, timeAgo } from "@/lib/time";
import { normalize } from "@/lib/mirats/global-search";
import {
  useDeviceMovementHistory,
  type MovementEvent,
  type MovementAction,
} from "@/lib/mirats/device-movement-history";
import { cn } from "@/lib/utils";

const ACTION_META: Record<
  MovementAction,
  { label: string; icon: typeof PackagePlus; tone: string }
> = {
  gan: { label: "Gán vào hệ thống", icon: PackagePlus, tone: "bg-emerald-100 text-emerald-700" },
  chuyen: { label: "Chuyển hệ thống", icon: ArrowRightLeft, tone: "bg-sky-100 text-sky-700" },
  go: { label: "Gỡ khỏi hệ thống", icon: PackageMinus, tone: "bg-amber-100 text-amber-700" },
};

const STANDALONE = "Độc lập";

type Resolvers = {
  /** UUID hệ thống → nhãn hiển thị. */
  systemName: (id: string | null) => string;
  /** Mã tài sản → tên hiển thị (tuỳ chọn, chỉ cần khi hiển thị tổng). */
  deviceName?: (ma: string) => string;
};

function SystemChip({ label, muted }: { label: string; muted?: boolean }) {
  if (muted) {
    return (
      <span className="inline-flex items-center gap-1 rounded border border-amber-500/40 bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-600">
        <PackageOpen className="h-3 w-3" /> {label}
      </span>
    );
  }
  return (
    <span className="rounded border bg-muted/40 px-1.5 py-0.5 text-xs font-medium">{label}</span>
  );
}

function EventRow({
  ev,
  systemName,
  deviceName,
  showDevice,
}: {
  ev: MovementEvent;
  systemName: Resolvers["systemName"];
  deviceName?: Resolvers["deviceName"];
  showDevice?: boolean;
}) {
  const meta = ACTION_META[ev.action];
  const Icon = meta.icon;
  const fromLabel = ev.fromHtId ? systemName(ev.fromHtId) : STANDALONE;
  const toLabel = ev.toHtId ? systemName(ev.toHtId) : STANDALONE;

  return (
    <div className={cn("rounded-lg border p-3", ev.daHoanTac && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium",
            meta.tone,
          )}
        >
          <Icon className="h-3 w-3" /> {meta.label}
        </span>
        {showDevice && deviceName && (
          <span className="text-sm font-medium">{deviceName(ev.deviceMa)}</span>
        )}
        {ev.daHoanTac && (
          <Badge variant="outline" className="gap-1 text-[11px]">
            <Undo2 className="h-3 w-3" /> Đã hoàn tác
          </Badge>
        )}
        {!ev.daApDung && (
          <Badge variant="outline" className="text-[11px] text-muted-foreground">
            Chờ duyệt
          </Badge>
        )}
      </div>

      {/* Trước → sau */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
        <SystemChip label={fromLabel} muted={!ev.fromHtId} />
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <SystemChip label={toLabel} muted={!ev.toHtId} />
      </div>

      {/* Ai làm, lúc nào */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        <span>👤 {ev.actorName}</span>
        <span title={formatDT(ev.createdAt)}>
          🕒 {formatDT(ev.createdAt)} · {timeAgo(ev.createdAt)}
        </span>
      </div>
    </div>
  );
}

/** Timeline gọn cho một tài sản (dùng trong ngăn chi tiết). */
export function DeviceMovementHistoryList({
  deviceMa,
  systemName,
  className,
}: {
  deviceMa: string;
  systemName: Resolvers["systemName"];
  className?: string;
}) {
  const { data, isLoading } = useDeviceMovementHistory(deviceMa);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lịch sử…
      </div>
    );
  }
  const events = data ?? [];
  if (events.length === 0) {
    return (
      <p className="py-4 text-sm text-muted-foreground">
        Chưa có lịch sử gán / chuyển / gỡ hệ thống.
      </p>
    );
  }
  return (
    <div className={cn("space-y-2", className)}>
      {events.map((ev) => (
        <EventRow key={ev.id} ev={ev} systemName={systemName} />
      ))}
    </div>
  );
}

/** Hộp thoại lịch sử tổng của toàn bộ tài sản. */
export function DeviceMovementHistoryDialog({
  open,
  onOpenChange,
  systemName,
  deviceName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  systemName: Resolvers["systemName"];
  deviceName: (ma: string) => string;
}) {
  const { data, isLoading } = useDeviceMovementHistory();
  const [q, setQ] = useState("");

  const events = useMemo(() => {
    const all = data ?? [];
    const nq = normalize(q.trim());
    if (!nq) return all;
    return all.filter((ev) => {
      const hay = [
        deviceName(ev.deviceMa),
        ev.deviceMa,
        ev.actorName,
        ACTION_META[ev.action].label,
        ev.fromHtId ? systemName(ev.fromHtId) : STANDALONE,
        ev.toHtId ? systemName(ev.toHtId) : STANDALONE,
      ].join(" ");
      return normalize(hay).includes(nq);
    });
  }, [data, q, deviceName, systemName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" /> Lịch sử gán / chuyển / gỡ tài sản
          </DialogTitle>
          <DialogDescription>
            Ai đã gán, chuyển hoặc gỡ tài sản khỏi hệ thống — kèm thời điểm và trạng thái trước →
            sau.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tài sản, người thực hiện, hệ thống…"
            className="h-9 pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải lịch sử…
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {q.trim() ? "Không có kết quả phù hợp." : "Chưa có lịch sử gán / chuyển / gỡ tài sản."}
          </p>
        ) : (
          <ScrollArea className="-mx-1 flex-1 px-1">
            <div className="space-y-2 pr-2">
              {events.map((ev) => (
                <EventRow
                  key={ev.id}
                  ev={ev}
                  systemName={systemName}
                  deviceName={deviceName}
                  showDevice
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
