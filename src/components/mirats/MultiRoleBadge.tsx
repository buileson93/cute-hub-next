// ============================================================================
// MultiRoleBadge — chip màu + HoverCard cho TÀI SẢN đảm nhận ≥ 2 vai trò
// (một "thiết bị vật lý" duy nhất được lắp vào nhiều "thành phần hệ thống"
// thuộc các hệ thống khác nhau). Trả về `null` khi tài sản chỉ có 1 vai trò
// hoặc chưa lắp — callers luôn có thể render vô điều kiện.
// ============================================================================
import { Link } from "@tanstack/react-router";
import { HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { colorForThietBi } from "@/lib/mirats/multi-role-color";
import type { MultiRoleInfo } from "@/lib/mirats/he-thong-thanh-phan";

export function MultiRoleBadge({
  info,
  currentThanhPhanId,
  compact,
  side = "left",
}: {
  info: MultiRoleInfo | undefined;
  /** Vai trò đang xem — sẽ được highlight trong popover. */
  currentThanhPhanId?: string;
  /** Chỉ hiện chấm màu + ×N (không kèm mã tài sản). */
  compact?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}) {
  if (!info || info.count < 2) return null;
  const col = colorForThietBi(info.thiet_bi_id);
  return (
    <HoverCard openDelay={100}>
      <HoverCardTrigger asChild>
        <Badge
          variant="outline"
          className="gap-1 font-normal cursor-help"
          style={{ backgroundColor: col.bg, borderColor: col.border, color: col.text }}
          title={`Tài sản đa vai trò (${info.count} vai trò)`}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: col.dot }}
            aria-hidden
          />
          {!compact && (
            <>
              <HardDrive className="h-3 w-3" />
              <span className="font-mono text-meta">{info.ma_thiet_bi}</span>
            </>
          )}
          <span
            className="ml-0.5 rounded px-1 text-meta font-semibold"
            style={{ backgroundColor: col.border, color: "white" }}
          >
            ×{info.count}
          </span>
        </Badge>
      </HoverCardTrigger>
      <HoverCardContent className="w-80 p-3 text-xs" side={side}>
        <div className="mb-2 flex items-center gap-2 font-medium">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.dot }} />
          Tài sản đa vai trò ({info.count} vai trò)
        </div>
        <div className="mb-2 font-mono text-meta text-muted-foreground">
          {info.ma_thiet_bi}{info.ma_serial ? ` · SN ${info.ma_serial}` : ""}
        </div>
        <div className="mb-2 rounded border border-amber-400/50 bg-amber-50 px-2 py-1 text-meta leading-snug text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Cùng một thiết bị vật lý đang giữ đồng thời {info.count} vai trò
          "thành phần hệ thống" ở các hệ thống khác nhau.
        </div>
        <ul className="space-y-1.5">
          {info.roles.map((r) => {
            const here = r.thanh_phan_id === currentThanhPhanId;
            return (
              <li key={r.thanh_phan_id} className={here ? "rounded bg-muted/60 px-1.5 py-1" : ""}>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-medium">{r.ten_thanh_phan}</span>
                  {here && <span className="text-meta text-primary">(vai trò này)</span>}
                </div>
                <div className="text-meta text-muted-foreground">
                  <span className="font-mono">{r.ma_thanh_phan}</span>
                  {r.ten_he_thong && (
                    <> · <Link
                      to="/he-thong/$id"
                      params={{ id: r.he_thong_id }}
                      className="text-primary hover:underline"
                    >{r.ten_he_thong}</Link></>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}