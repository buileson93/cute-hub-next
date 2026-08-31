// ============================================================================
// /inbox — Hộp thư hoạt động: thông báo cá nhân (bảng notifications, RLS theo user_id).
// Archetype chuẩn: PageFrame → PageHeader → PageBody.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Inbox as InboxIcon, CheckCheck, Loader2 } from "lucide-react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EmptyState } from "@/components/mirats/EmptyState";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/inbox")({
  head: () => ({
    meta: [
      { title: "Hộp thư hoạt động — MIRATS" },
      {
        name: "description",
        content: "Tổng hợp thông báo hoạt động: công việc, sự cố, trình ký và trao đổi nội bộ.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: InboxPage,
});

type Row = {
  id: string;
  loai: string;
  tieu_de: string;
  noi_dung: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

function InboxPage() {
  const { user, loading } = useSession();
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["inbox", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id,loai,tieu_de,noi_dung,link,read_at,created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .is("read_at", null);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Đã đánh dấu tất cả là đã đọc");
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return data;
    return data.filter(
      (r) =>
        r.tieu_de.toLowerCase().includes(k) || (r.noi_dung ?? "").toLowerCase().includes(k),
    );
  }, [data, q]);

  const unread = data.filter((r) => !r.read_at).length;

  return (
    <PageFrame>
      <PageHeader
        title="Hộp thư hoạt động"
        icon={InboxIcon}
        breadcrumbs={[{ label: "Trao đổi" }, { label: "Hộp thư hoạt động" }]}
        description="Thông báo cá nhân được lọc theo tài khoản đang đăng nhập."
        metadata={<Badge variant="secondary">{unread} chưa đọc</Badge>}
        actions={
          <Button
            size="sm"
            variant="outline"
            disabled={markAll.isPending || unread === 0}
            onClick={() => markAll.mutate()}
          >
            {markAll.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCheck className="mr-2 h-4 w-4" />
            )}
            Đánh dấu đã đọc
          </Button>
        }
      />
      <PageBody>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tiêu đề hoặc nội dung…"
          aria-label="Tìm thông báo"
          className="max-w-sm"
        />

        {loading || isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải thông báo…
          </div>
        ) : error ? (
          <EmptyState
            title="Không tải được thông báo"
            description={(error as Error).message}
            live="polite"
          />
        ) : rows.length === 0 ? (
          <EmptyState title="Không có thông báo" description="Hộp thư của bạn đang trống." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-3",
                  !r.read_at && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.tieu_de}</p>
                    {r.noi_dung ? (
                      <p className="mt-1 text-muted-foreground">{r.noi_dung}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("vi-VN")}
                  </span>
                </div>
                {r.link ? (
                  <Link to={r.link} className="mt-2 inline-block text-primary underline">
                    Mở chi tiết
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </PageFrame>
  );
}
