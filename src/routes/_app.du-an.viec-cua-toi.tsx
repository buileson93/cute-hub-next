// ============================================================================
// /du-an/viec-cua-toi — Công việc dự án được giao cho người dùng hiện tại.
// Nguồn: du_an_cong_viec (RLS theo quyền truy cập dự án can_access_du_an).
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EmptyState } from "@/components/mirats/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_app/du-an/viec-cua-toi")({
  head: () => ({
    meta: [
      { title: "Việc của tôi — MIRATS" },
      {
        name: "description",
        content: "Danh sách công việc dự án được phân công cho tài khoản đang đăng nhập.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ViecCuaToiPage,
});

const TRANG_THAI: Record<string, string> = {
  chua_bat_dau: "Chưa bắt đầu",
  dang_lam: "Đang làm",
  cho_duyet: "Chờ duyệt",
  hoan_thanh: "Hoàn thành",
  qua_han: "Quá hạn",
};

type Row = {
  id: string;
  du_an_id: string;
  ten: string;
  trang_thai: string;
  tien_do: number | null;
  ngay_ket_thuc_du_kien: string | null;
  du_an: { ten: string } | null;
};

function ViecCuaToiPage() {
  const { user, loading } = useSession();
  const [q, setQ] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["du-an", "viec-cua-toi", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("du_an_cong_viec")
        .select("id,du_an_id,ten,trang_thai,tien_do,ngay_ket_thuc_du_kien,du_an:du_an_id(ten)")
        .eq("nguoi_xu_ly_chinh", user!.id)
        .order("ngay_ket_thuc_du_kien", { ascending: true, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return data;
    return data.filter((r) => r.ten.toLowerCase().includes(k));
  }, [data, q]);

  const chuaXong = data.filter((r) => r.trang_thai !== "hoan_thanh").length;

  return (
    <PageFrame>
      <PageHeader
        title="Việc của tôi"
        icon={CheckCircle2}
        breadcrumbs={[{ label: "Dự án", to: "/du-an" }, { label: "Việc của tôi" }]}
        description="Chỉ hiển thị công việc thuộc dự án bạn có quyền truy cập."
        metadata={<Badge variant="secondary">{chuaXong} việc chưa hoàn thành</Badge>}
      />
      <PageBody>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm công việc…"
          aria-label="Tìm công việc"
          className="max-w-sm"
        />

        {loading || isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải công việc…
          </div>
        ) : error ? (
          <EmptyState
            title="Không tải được công việc"
            description={(error as Error).message}
            live="polite"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Chưa có công việc nào"
            description="Bạn chưa được phân công công việc dự án."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to="/du-an/$id"
                      params={{ id: r.du_an_id }}
                      search={{ view: "kanban", q: "" }}
                      className="font-medium text-foreground hover:underline"
                    >
                      {r.ten}
                    </Link>
                    <p className="text-muted-foreground">{r.du_an?.ten ?? "—"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {TRANG_THAI[r.trang_thai] ?? r.trang_thai}
                    </Badge>
                    <span className="text-muted-foreground">
                      {r.ngay_ket_thuc_du_kien
                        ? new Date(r.ngay_ket_thuc_du_kien).toLocaleDateString("vi-VN")
                        : "Không hạn"}
                    </span>
                  </div>
                </div>
                <Progress value={r.tien_do ?? 0} className="mt-2 h-1.5" />
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </PageFrame>
  );
}
