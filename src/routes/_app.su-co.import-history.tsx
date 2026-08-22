import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText, ArrowLeft, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_app/su-co/import-history")({
  head: () => ({
    meta: [
      { title: "Lịch sử nhập báo cáo tuần · Sự cố" },
      {
        name: "description",
        content:
          "Xem lại các lần nhập báo cáo tuần sự cố: số văn bản, đơn vị, số dòng tạo được, trạng thái xử lý và lỗi nếu có.",
      },
      { property: "og:title", content: "Lịch sử nhập báo cáo tuần · Sự cố" },
      { property: "og:description", content: "Nhật ký batch import báo cáo tuần từ DOCX." },
    ],
  }),
  component: ImportHistoryPage,
});

function formatDT(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Row {
  id: string;
  don_vi: string | null;
  so_van_ban: string | null;
  tuan_tu_ngay: string | null;
  tuan_den_ngay: string | null;
  tieu_de: string | null;
  file_name: string | null;
  file_size: number | null;
  n_incidents_detected: number;
  n_hong_hoc_detected: number;
  n_incidents_created: number;
  n_hong_hoc_created: number;
  status: string;
  error_message: string | null;
  created_by_name: string | null;
  created_at: string;
}

function ImportHistoryPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["weekly_report_import", "history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_report_import")
        .select(
          "id, don_vi, so_van_ban, tuan_tu_ngay, tuan_den_ngay, tieu_de, file_name, file_size, n_incidents_detected, n_hong_hoc_detected, n_incidents_created, n_hong_hoc_created, status, error_message, created_by_name, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-6xl space-y-4 p-4">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link to="/su-co">
            <ArrowLeft className="mr-1 h-4 w-4" /> Nhật ký sự cố
          </Link>
        </Button>
        <h1 className="text-lg font-semibold">Lịch sử nhập báo cáo tuần</h1>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
            <FileText className="h-4 w-4" /> Các phiên đã xử lý
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Đang tải…
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-destructive">Lỗi: {(error as Error).message}</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Chưa có phiên nhập nào. Mở{" "}
              <Link to="/su-co" className="text-primary underline">
                Nhật ký sự cố
              </Link>{" "}
              và bấm "Nhập báo cáo tuần" để bắt đầu.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thời điểm</TableHead>
                    <TableHead>Số VB</TableHead>
                    <TableHead>Đơn vị</TableHead>
                    <TableHead>Tuần</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="text-right">Sự cố</TableHead>
                    <TableHead className="text-right">Hỏng tồn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Người nhập</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => {
                    const ok = r.status === "success";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDT(r.created_at)}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{r.so_van_ban ?? "—"}</TableCell>
                        <TableCell className="text-xs">{r.don_vi ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {r.tuan_tu_ngay && r.tuan_den_ngay
                            ? `${r.tuan_tu_ngay} → ${r.tuan_den_ngay}`
                            : "—"}
                        </TableCell>
                        <TableCell
                          className="max-w-[220px] truncate text-xs"
                          title={r.file_name ?? ""}
                        >
                          {r.file_name ?? "(dán text)"}
                          {r.file_size ? (
                            <span className="ml-1 text-muted-foreground">
                              · {(r.file_size / 1024).toFixed(0)}KB
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          <span className="font-semibold">{r.n_incidents_created}</span>
                          <span className="text-muted-foreground">/{r.n_incidents_detected}</span>
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          <span className="font-semibold">{r.n_hong_hoc_created}</span>
                          <span className="text-muted-foreground">/{r.n_hong_hoc_detected}</span>
                        </TableCell>
                        <TableCell>
                          {ok ? (
                            <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Thành công
                            </Badge>
                          ) : (
                            <Badge
                              variant="destructive"
                              className="gap-1"
                              title={r.error_message ?? ""}
                            >
                              <AlertTriangle className="h-3 w-3" /> {r.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{r.created_by_name ?? "—"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
