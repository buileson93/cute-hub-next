// ============================================================================
// /trinh-ky/da-ky — Văn bản đã ký (dossier_documents.status = 'complete').
// RLS: chỉ thấy tài liệu thuộc dự án người dùng được truy cập.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EmptyState } from "@/components/mirats/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/_app/trinh-ky/da-ky")({
  head: () => ({
    meta: [
      { title: "Văn bản đã ký — MIRATS" },
      {
        name: "description",
        content: "Lưu trữ văn bản đã ký số theo dự án, kèm ngày ký và cơ quan ban hành.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DaKyPage,
});

type Row = {
  id: string;
  title: string;
  abstract: string | null;
  sign_date: string | null;
  issuing_body: string | null;
  dossier: { name: string | null; project_id: string | null } | null;
};

function DaKyPage() {
  const [q, setQ] = useState("");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["trinh-ky", "da-ky"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("dossier_documents")
        .select("id,title,abstract,sign_date,issuing_body,dossier:dossier_id(name,project_id)")
        .eq("status", "complete")
        .order("sign_date", { ascending: false, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    if (!k) return data;
    return data.filter(
      (r) => r.title.toLowerCase().includes(k) || (r.abstract ?? "").toLowerCase().includes(k),
    );
  }, [data, q]);

  return (
    <PageFrame>
      <PageHeader
        title="Văn bản đã ký"
        icon={FileText}
        breadcrumbs={[{ label: "Trình ký", to: "/trinh-ky" }, { label: "Văn bản đã ký" }]}
        description="Kho lưu văn bản đã hoàn tất ký duyệt."
        metadata={<Badge variant="secondary">{data.length} văn bản</Badge>}
        actions={
          <Button asChild size="sm" variant="outline">
            <Link to="/trinh-ky">Về hàng đợi trình ký</Link>
          </Button>
        }
      />
      <PageBody>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm văn bản đã ký…"
          aria-label="Tìm văn bản đã ký"
          className="max-w-sm"
        />

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải văn bản…
          </div>
        ) : error ? (
          <EmptyState
            title="Không tải được văn bản"
            description={(error as Error).message}
            live="polite"
          />
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có văn bản đã ký" description="Hàng đợi ký chưa hoàn tất." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{r.title}</p>
                    <p className="text-muted-foreground">
                      {r.dossier?.name ?? "—"}
                      {r.issuing_body ? ` · ${r.issuing_body}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {r.sign_date
                        ? new Date(r.sign_date).toLocaleDateString("vi-VN")
                        : "Chưa rõ ngày ký"}
                    </Badge>
                    {r.dossier?.project_id ? (
                      <Link
                        to="/du-an/$id"
                        params={{ id: r.dossier.project_id }}
                        className="text-primary hover:underline"
                      >
                        Mở dự án
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </PageFrame>
  );
}
