// ============================================================================
// _app.admin.forms.$id.history.tsx — Lịch sử phiên bản mẫu.
// Liệt kê form_template_version, cho phép xem JSON và khôi phục.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, History, Undo2, ShieldAlert, Lock, Eye, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { persistDesigner, downloadBundleJson, type DesignerBundle } from "@/lib/mirats/form-designer-io";

export const Route = createFileRoute("/_app/admin/forms/$id/history")({
  head: () => ({ meta: [{ title: "Lịch sử phiên bản mẫu — MIRATS" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: HistoryPage,
});

type Row = {
  id: string; version: number; status: string;
  created_at: string; created_by: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  compiled_schema: any;
};

function HistoryPage() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const { hasRole, loading } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["form-versions-history", id],
    enabled: canManage,
    queryFn: async () => {
      const { data: tpl } = await supabase.from("form_template").select("ten, code").eq("id", id).maybeSingle();
      const { data, error } = await supabase
        .from("form_template_version")
        .select("id, version, status, created_at, created_by, compiled_schema")
        .eq("template_id", id)
        .order("version", { ascending: false });
      if (error) throw error;
      return { tpl, rows: (data ?? []) as Row[] };
    },
  });

  const restoreM = useMutation({
    mutationFn: async (row: Row) => {
      const bundle = row.compiled_schema as DesignerBundle;
      if (!bundle?.template || !Array.isArray(bundle?.fields)) {
        throw new Error("Phiên bản này không phải snapshot Designer (thiếu template/fields).");
      }
      await persistDesigner(id, bundle.template, bundle.fields, bundle.linked_he_thong ?? []);
    },
    onSuccess: (_r, row) => {
      toast.success(`Đã khôi phục v${row.version}`);
      qc.invalidateQueries({ queryKey: ["form-template", id] });
      qc.invalidateQueries({ queryKey: ["form-versions", id] });
      qc.invalidateQueries({ queryKey: ["form-versions-history", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!canManage) return <div className="p-16 text-center"><ShieldAlert className="mx-auto h-8 w-8 text-rose-500" /><p className="mt-3">Không có quyền.</p></div>;

  const rows = q.data?.rows ?? [];
  const preview = rows.find((r) => r.id === previewId);

  return (
    <div className="flex h-[calc(100vh-3rem)] flex-col">
      <div className="flex items-center gap-2 border-b px-4 py-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/forms/$id" params={{ id }}><ArrowLeft className="mr-1 h-4 w-4" />Về Designer</Link>
        </Button>
        <History className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Lịch sử phiên bản</span>
        {q.data?.tpl && <Badge variant="outline" className="font-mono text-[10px]">{q.data.tpl.code}</Badge>}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[420px_1fr]">
        <aside className="min-h-0 overflow-y-auto border-r">
          {q.isLoading && <div className="p-6"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></div>}
          {rows.length === 0 && !q.isLoading && (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Chưa có phiên bản nào. Nhấn "Lưu" trong Designer để tạo snapshot đầu tiên.
            </p>
          )}
          <ul className="divide-y">
            {rows.map((r) => {
              const isPreview = r.id === previewId;
              const isPublished = r.status === "published";
              return (
                <li key={r.id} className={`p-3 ${isPreview ? "bg-primary/5" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold">v{r.version}</span>
                    <Badge variant={isPublished ? "outline" : "secondary"} className="text-[10px]">
                      {isPublished && <Lock className="mr-1 h-2.5 w-2.5" />}
                      {r.status}
                    </Badge>
                    <span className="ml-auto text-[11px] text-muted-foreground">
                      {new Date(r.created_at).toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setPreviewId(r.id)}>
                      <Eye className="mr-1 h-3 w-3" />Xem
                    </Button>
                    <Button
                      size="sm" variant="ghost" className="h-7 text-xs"
                      onClick={() => {
                        const bundle = r.compiled_schema as DesignerBundle;
                        if (bundle?.template) downloadBundleJson(bundle, `${q.data?.tpl?.code ?? "template"}-v${r.version}`);
                        else toast.error("Snapshot không đúng định dạng Designer.");
                      }}
                    >
                      <Download className="mr-1 h-3 w-3" />JSON
                    </Button>
                    <Button
                      size="sm" variant="default" className="h-7 text-xs"
                      onClick={() => {
                        if (confirm(`Khôi phục toàn bộ mẫu về v${r.version}? Thao tác này ghi đè fields hiện tại.`)) {
                          restoreM.mutate(r);
                        }
                      }}
                      disabled={restoreM.isPending}
                    >
                      <Undo2 className="mr-1 h-3 w-3" />Khôi phục
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="min-h-0 overflow-y-auto p-4">
          {!preview ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">Chọn 1 phiên bản để xem snapshot.</p>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Snapshot v{preview.version}</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="max-h-[70vh] overflow-auto rounded-md bg-slate-950/95 p-3 font-mono text-[11px] leading-relaxed text-emerald-200">
{JSON.stringify(preview.compiled_schema, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
