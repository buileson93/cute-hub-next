import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Clock, Stamp, MoreHorizontal, User, History, Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";
import { RowActionBar, RowActionButton } from "@/components/mirats/table/RowActions";

export const Route = createFileRoute("/_app/trinh-ky/")({
  head: () => ({
    meta: [
      { title: "Trung tâm Trình ký — MIRATS" },
      {
        name: "description",
        content: "Hàng đợi văn bản chờ phê duyệt và ký số theo từng dự án trong hệ thống MIRATS.",
      },
      { property: "og:title", content: "Trung tâm Trình ký — MIRATS" },
      {
        property: "og:description",
        content: "Theo dõi và ký số hàng loạt các văn bản đang chờ phê duyệt.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ApprovalHubPage,
});

type DocRow = {
  id: string;
  title: string | null;
  issuing_body: string | null;
  submit_date: string | null;
  dossier?: { project?: { ten?: string | null } | null } | null;
};

function ApprovalHubPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const {
    data: queue = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["approval-queue"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("dossier_documents")
        .select(
          `
          *,
          dossier:project_dossiers(
            project:du_an(ten)
          )
        `,
        )
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (err) throw err;
      return (data ?? []) as unknown as DocRow[];
    },
  });

  const signBatchMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error: err } = await supabase
        .from("dossier_documents")
        .update({
          status: "complete",
          sign_date: new Date().toISOString().split("T")[0],
        })
        .in("id", ids);

      if (err) throw err;
    },
    onSuccess: (_d, ids) => {
      toast.success(`Đã ký số thành công ${ids.length} văn bản`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["approval-queue"] });
    },
    onError: (err: Error) => toast.error("Ký số thất bại: " + err.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queue;
    return queue.filter((d) =>
      `${d.title ?? ""} ${d.issuing_body ?? ""} ${d.dossier?.project?.ten ?? ""}`
        .toLowerCase()
        .includes(q),
    );
  }, [queue, search]);

  const columns: StdColumn<DocRow>[] = [
    {
      key: "title",
      label: "Văn bản & Dự án",
      sortable: true,
      value: (r) => r.title ?? "",
      cell: (r) => (
        <div className="min-w-0">
          <div className="truncate font-medium text-foreground">{r.title ?? "Không tiêu đề"}</div>
          <div className="mt-0.5 flex items-center gap-1 text-mini text-muted-foreground">
            <History className="h-3 w-3" />
            <span className="truncate">{r.dossier?.project?.ten || "Dự án chung"}</span>
          </div>
        </div>
      ),
    },
    {
      key: "issuing_body",
      label: "Người trình",
      hideBelow: "md",
      value: (r) => r.issuing_body ?? "",
      cell: (r) => (
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-muted">
            <User className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="truncate text-xs">{r.issuing_body || "Cán bộ chuyên môn"}</span>
        </div>
      ),
    },
    {
      key: "submit_date",
      label: "Ngày trình",
      sortable: true,
      hideBelow: "lg",
      value: (r) => r.submit_date ?? "",
      cell: (r) => (
        <span className="text-xs text-muted-foreground">{r.submit_date || "Hôm nay"}</span>
      ),
    },
    {
      key: "trang_thai",
      label: "Trạng thái",
      value: () => "Chờ phê duyệt",
      cell: () => (
        <Badge variant="outline" className="flex w-fit items-center gap-1.5 text-mini font-bold">
          <Clock className="h-3 w-3" /> Chờ phê duyệt
        </Badge>
      ),
    },
    {
      key: "thao_tac",
      label: "Thao tác",
      align: "right",
      value: () => "",
      cell: (r) => (
        <RowActionBar>
          <RowActionButton
            icon={Stamp}
            label="Ký số văn bản"
            disabled={signBatchMutation.isPending}
            onClick={() => signBatchMutation.mutate([r.id])}
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Thao tác khác" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Xem tài liệu</DropdownMenuItem>
              <DropdownMenuItem>Lịch sử trình ký</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Trả lại hồ sơ</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </RowActionBar>
      ),
    },
  ];

  const selectedIds = Array.from(selected);

  return (
    <PageFrame>
      <PageHeader
        icon={FileCheck}
        title="Trung tâm Trình ký"
        description="Hàng đợi văn bản đang chờ phê duyệt và ký số."
        breadcrumbs={[{ label: "Quản lý dự án" }, { label: "Trung tâm Trình ký" }]}
        actions={
          selectedIds.length > 0 ? (
            <Button
              className="font-bold"
              onClick={() => signBatchMutation.mutate(selectedIds)}
              disabled={signBatchMutation.isPending}
            >
              {signBatchMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Stamp className="mr-2 h-4 w-4" />
              )}
              Ký hàng loạt ({selectedIds.length})
            </Button>
          ) : undefined
        }
      />

      <PageBody>
        <StandardTable<DocRow>
          ten="Văn bản chờ ký"
          tableKey="approval-queue"
          rows={rows}
          columns={columns}
          getRowId={(r) => r.id}
          selectable
          selected={selected}
          onSelect={setSelected}
          trangThai={{ dangTai: isLoading, loi: error }}
          emptyText="Hàng đợi trống. Không có văn bản nào đang chờ duyệt."
          toolbarLeft={
            <Input
              placeholder="Tìm văn bản, mã hồ sơ..."
              className="h-9 w-full max-w-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Tìm văn bản chờ ký"
            />
          }
        />
      </PageBody>
    </PageFrame>
  );
}
