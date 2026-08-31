// ============================================================================
// /kho-ho-so — Kho hồ sơ dự án: project_dossiers + dossier_documents.
// RLS đã siết theo quyền truy cập dự án (can_access_du_an) nên chỉ hiển thị
// những hồ sơ thuộc dự án người dùng được phép xem.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FolderArchive, Loader2 } from "lucide-react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EmptyState } from "@/components/mirats/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/_app/kho-ho-so")({
  head: () => ({
    meta: [
      { title: "Kho hồ sơ dự án — MIRATS" },
      {
        name: "description",
        content: "Tra cứu bộ hồ sơ và tài liệu theo từng dự án, kèm trạng thái trình ký.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: KhoHoSoPage,
});

type Row = {
  id: string;
  name: string;
  description: string | null;
  project_id: string;
  du_an: { ten: string } | null;
  dossier_documents: { id: string; status: string | null }[];
};

function KhoHoSoPage() {
  const [q, setQ] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["kho-ho-so"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("project_dossiers")
        .select("id,name,description,project_id,du_an:project_id(ten),dossier_documents(id,status)")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return data;
    return data.filter(
      (r) =>
        r.name.toLowerCase().includes(k) || (r.du_an?.ten ?? "").toLowerCase().includes(k),
    );
  }, [data, q]);

  return (
    <PageFrame>
      <PageHeader
        title="Kho hồ sơ dự án"
        icon={FolderArchive}
        breadcrumbs={[{ label: "Hồ sơ" }, { label: "Kho hồ sơ dự án" }]}
        description="Danh sách bộ hồ sơ theo dự án bạn có quyền truy cập."
        metadata={<Badge variant="secondary">{data.length} bộ hồ sơ</Badge>}
      />
      <PageBody>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên hồ sơ hoặc dự án…"
          aria-label="Tìm hồ sơ"
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải kho hồ sơ…
          </div>
        ) : error ? (
          <EmptyState
            title="Không tải được kho hồ sơ"
            description={(error as Error).message}
            live="polite"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            title="Chưa có hồ sơ"
            description="Chưa có bộ hồ sơ nào trong các dự án bạn tham gia."
          />
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {rows.map((r) => {
              const total = r.dossier_documents?.length ?? 0;
              const signed =
                r.dossier_documents?.filter((d) => d.status === "complete").length ?? 0;
              return (
                <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{r.name}</p>
                      <Link
                        to="/du-an/$id"
                        params={{ id: r.project_id }}
                      search={{ view: "kanban", q: "" }}
                        className="text-primary hover:underline"
                      >
                        {r.du_an?.ten ?? "Dự án"}
                      </Link>
                      {r.description ? (
                        <p className="mt-1 text-muted-foreground">{r.description}</p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {signed}/{total} đã ký
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PageBody>
    </PageFrame>
  );
}
