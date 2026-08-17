import { PageHeader } from "@/components/mirats/PageHeader";
import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Bell, Check, CheckCheck, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/lib/realtime/useNotifications";
import { useSession } from "@/hooks/use-session";
import { formatDT } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useState } from "react";

/**
 * Task 40 — Trang Thông báo đầy đủ (đã đọc / chưa đọc).
 * Nguồn dữ liệu: bảng `notifications` — cập nhật realtime qua `useNotifications`.
 */
export const Route = createFileRoute("/_app/thong-bao")({
  head: () => ({
    meta: [
      { title: "Thông báo — MIRATS" },
      {
        name: "description",
        content: "Hộp thư thông báo hệ thống: cảnh báo hết hạn, sự cố, tin nhắn.",
      },
      { property: "og:title", content: "Thông báo — MIRATS" },
      {
        property: "og:description",
        content: "Danh sách thông báo đã đọc và chưa đọc của tài khoản.",
      },
    ],
  }),
  component: ThongBaoPage,
});

type Loc = "all" | "unread" | "read";

function ThongBaoPage() {
  const { user } = useSession();
  const { items, unread, loading, markRead, markAllRead } = useNotifications(
    user?.id ?? null,
  );
  const [loc, setLoc] = useState<Loc>("all");

  const filtered = items.filter((n) =>
    loc === "all" ? true : loc === "unread" ? !n.read_at : !!n.read_at,
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 md:p-6">
      <PageHeader
        icon={Bell}
        title="Thông báo"
        actions={
          unread > 0 ? (
            <Badge variant="secondary">{unread} chưa đọc</Badge>
          ) : null
        }
      />


      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <div className="flex gap-1">
            {(
              [
                ["all", "Tất cả"],
                ["unread", "Chưa đọc"],
                ["read", "Đã đọc"],
              ] as const
            ).map(([k, label]) => (
              <Button
                key={k}
                size="sm"
                variant={loc === k ? "default" : "ghost"}
                onClick={() => setLoc(k)}
              >
                {label}
              </Button>
            ))}
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" onClick={markAllRead} className="gap-1">
              <CheckCheck className="h-4 w-4" /> Đánh dấu tất cả đã đọc
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Đang tải…
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8 opacity-50" />
              <div>Không có thông báo nào</div>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/60",
                    !n.read_at && "bg-primary/5",
                  )}
                >
                  <div
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.read_at ? "bg-muted-foreground/30" : "bg-primary",
                    )}
                    aria-label={n.read_at ? "đã đọc" : "chưa đọc"}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {n.link ? (
                        <Link
                          to={n.link as never}
                          onClick={() => !n.read_at && markRead(n.id)}
                          className="text-sm font-medium text-foreground hover:text-primary"
                        >
                          {n.tieu_de}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium">{n.tieu_de}</span>
                      )}
                      <Badge variant="outline" className="text-[10px]">
                        {n.loai}
                      </Badge>
                    </div>
                    {n.noi_dung && (
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {n.noi_dung}
                      </div>
                    )}
                    <div className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatDT(n.created_at)}
                    </div>
                  </div>
                  {!n.read_at && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => markRead(n.id)}
                      className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                      aria-label="Đánh dấu đã đọc"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
