import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Plus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StandardTable } from "@/components/mirats/StandardTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/_app/forms/")({
  head: () => ({ meta: [{ title: "Biên bản — MIRATS" }] }),
  component: FormsPage,
});

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Nháp", cls: "bg-slate-100 text-slate-700" },
  submitted: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Đã duyệt", cls: "bg-success/10 text-success border-success/20" },
  returned: { label: "Trả lại", cls: "bg-rose-100 text-rose-700" },
};

function FormsPage() {
  const { session, loading } = useSession();
  const [q, setQ] = useState("");

  const { data: templates } = useQuery({
    queryKey: ["forms-catalog"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template")
        .select("id,code,ten,mo_ta,thiet_bi_mode")
        .eq("active", true)
        .order("code");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: subs, isLoading: subsLoading } = useQuery({
    queryKey: ["my-submissions"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_submission")
        .select("id,template_code,tieu_de,ky_bao_cao,status,created_at,updated_at,he_thong_id,he_thong:dm_he_thong(id,ma,ten)")
        .order("updated_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: heThongOpts } = useQuery({
    queryKey: ["forms-hethong-opts"],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dm_he_thong")
        .select("id,ma,ten")
        .order("ma");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [subQ, setSubQ] = useState("");
  const [heThongFilter, setHeThongFilter] = useState<string>("all");
  const filteredSubs = (subs ?? []).filter((s) => {
    if (heThongFilter === "__none__" && s.he_thong_id) return false;
    if (heThongFilter !== "all" && heThongFilter !== "__none__" && s.he_thong_id !== heThongFilter) return false;
    if (subQ) {
      const q = subQ.toLowerCase();
      const hay = `${s.tieu_de ?? ""} ${s.template_code ?? ""} ${s.ky_bao_cao ?? ""} ${s.he_thong?.ma ?? ""} ${s.he_thong?.ten ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (loading) return <><div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div></>;

  const filteredTpl = (templates ?? []).filter((t) =>
    !q || t.code.toLowerCase().includes(q.toLowerCase()) || t.ten.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="mx-auto max-w-6xl px-6 py-8 lg:px-12">
        <div className="mb-6">
          <PageHeader
            icon={FileText}
            title="Biên bản"
            help="Chọn mẫu để lập biên bản mới hoặc xem lại biên bản đã lập."
          />
        </div>

        <Tabs defaultValue="catalog">
          <TabsList>
            <TabsTrigger value="catalog">Chọn mẫu ({filteredTpl.length})</TabsTrigger>
            <TabsTrigger value="mine">Biên bản của tôi ({subs?.length ?? 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="catalog" className="mt-4">
            <Input placeholder="Tìm theo mã hoặc tên mẫu…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-4 max-w-md" />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredTpl.map((t) => (
                <Card key={t.id} className="transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono text-[10px] text-muted-foreground">{t.code}</div>
                        <CardTitle className="text-base leading-tight">{t.ten}</CardTitle>
                      </div>
                      <FileText className="h-5 w-5 shrink-0 text-primary/70" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 text-xs text-muted-foreground line-clamp-2 min-h-[2.5rem]">{t.mo_ta ?? "—"}</p>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{t.thiet_bi_mode === "none" ? "Không TB" : t.thiet_bi_mode === "single" ? "1 TB" : "Nhiều TB"}</Badge>
                      <Button asChild size="sm">
                        <Link to="/forms/new/$code" params={{ code: t.code }}><Plus className="mr-1 h-3.5 w-3.5" />Lập</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <Input
                placeholder="Tìm tiêu đề, mã mẫu, kỳ, hệ thống…"
                value={subQ}
                onChange={(e) => setSubQ(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={heThongFilter}
                onChange={(e) => setHeThongFilter(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="all">Tất cả hệ thống</option>
                <option value="__none__">— Chưa gán hệ thống —</option>
                {(heThongOpts ?? []).map((h) => (
                  <option key={h.id} value={h.id}>{h.ma ? `${h.ma} — ` : ""}{h.ten}</option>
                ))}
              </select>
              {(subQ || heThongFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setSubQ(""); setHeThongFilter("all"); }}>Xoá lọc</Button>
              )}
              <span className="text-xs text-muted-foreground ml-auto">{filteredSubs.length}/{subs?.length ?? 0}</span>
            </div>
            <StandardTable<NonNullable<typeof subs>[number]>
              tableKey="forms_my_submissions"
              trangThai={{ dangTai: subsLoading }}
              rows={filteredSubs}
              getRowId={(s) => s.id}
              requireFilterToShow={false}
              emptyContent={<div className="py-8 text-center text-muted-foreground">Chưa có biên bản nào.</div>}
              columns={[
                { key: "template_code", label: "Mã mẫu", filter: "text", value: (s) => s.template_code ?? "", cell: (s) => <span className="font-mono text-xs">{s.template_code}</span> },
                { key: "tieu_de", label: "Tiêu đề", filter: "text", value: (s) => s.tieu_de ?? "", cell: (s) => <span className="font-medium">{s.tieu_de ?? "—"}</span> },
                {
                  key: "he_thong", label: "Hệ thống", filter: "cat",
                  value: (s) => s.he_thong ? `${s.he_thong.ma ?? ""} ${s.he_thong.ten ?? ""}`.trim() : "—",
                  cell: (s) => s.he_thong ? (
                    <Link to="/he-thong/$id" params={{ id: s.he_thong.id }} className="text-xs text-primary hover:underline">
                      {s.he_thong.ma ? <span className="font-mono">{s.he_thong.ma}</span> : null} {s.he_thong.ten}
                    </Link>
                  ) : <span className="text-xs text-muted-foreground">—</span>,
                },
                { key: "ky_bao_cao", label: "Kỳ", filter: "cat", value: (s) => s.ky_bao_cao ?? "", cell: (s) => <span>{s.ky_bao_cao ?? "—"}</span> },
                {
                  key: "status", label: "Trạng thái", filter: "cat",
                  value: (s) => (STATUS_LABEL[s.status]?.label ?? s.status),
                  cell: (s) => {
                    const st = STATUS_LABEL[s.status] ?? { label: s.status, cls: "" };
                    return <Badge className={st.cls} variant="outline">{st.label}</Badge>;
                  },
                },
                { key: "updated_at", label: "Cập nhật", sortable: true, value: (s) => s.updated_at ?? "", cell: (s) => <span className="text-xs text-muted-foreground">{new Date(s.updated_at).toLocaleString("vi-VN")}</span> },
                {
                  key: "actions", label: "", align: "right",
                  cell: (s) => (
                    <Button asChild size="sm" variant="ghost">
                      <Link to="/forms/submissions/$id" params={{ id: s.id }}>Mở<ChevronRight className="ml-1 h-3.5 w-3.5" /></Link>
                    </Button>
                  ),
                },
              ]}
            />
          </TabsContent>

        </Tabs>
      </div>
    </>
  );
}
