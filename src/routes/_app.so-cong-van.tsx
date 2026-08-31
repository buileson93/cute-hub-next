// ============================================================================
// /so-cong-van — Sổ công văn đi/đến của dự án (du_an_cong_van).
// RLS theo quyền truy cập dự án; trang chỉ đọc + lọc.
// ============================================================================
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Mails, Loader2 } from "lucide-react";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { EmptyState } from "@/components/mirats/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/backend/client";

export const Route = createFileRoute("/_app/so-cong-van")({
  head: () => ({
    meta: [
      { title: "Sổ công văn — MIRATS" },
      {
        name: "description",
        content: "Sổ theo dõi công văn đi, công văn đến và hạn phúc đáp theo từng dự án.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SoCongVanPage,
});

const LOAI: Record<string, string> = {
  den: "Công văn đến",
  di: "Công văn đi",
  to_trinh: "Tờ trình",
  bao_cao: "Báo cáo",
  quyet_dinh: "Quyết định",
  khac: "Khác",
};

type Row = {
  id: string;
  du_an_id: string;
  so_cong_van: string | null;
  loai: string;
  trich_yeu: string | null;
  co_quan_ban_hanh: string | null;
  ngay_ban_hanh: string | null;
  han_phuc_dap: string | null;
  trang_thai: string;
  du_an: { ten: string } | null;
};

function SoCongVanPage() {
  const [q, setQ] = useState("");
  const [loai, setLoai] = useState("all");

  const { data = [], isLoading, error } = useQuery({
    queryKey: ["so-cong-van"],
    queryFn: async (): Promise<Row[]> => {
      const { data, error } = await supabase
        .from("du_an_cong_van")
        .select(
          "id,du_an_id,so_cong_van,loai,trich_yeu,co_quan_ban_hanh,ngay_ban_hanh,han_phuc_dap,trang_thai,du_an:du_an_id(ten)",
        )
        .order("ngay_ban_hanh", { ascending: false, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const rows = useMemo(() => {
    const k = q.trim().toLowerCase();
    return data.filter((r) => {
      if (loai !== "all" && r.loai !== loai) return false;
      if (!k) return true;
      return (
        (r.so_cong_van ?? "").toLowerCase().includes(k) ||
        (r.trich_yeu ?? "").toLowerCase().includes(k)
      );
    });
  }, [data, q, loai]);

  return (
    <PageFrame>
      <PageHeader
        title="Sổ công văn"
        icon={Mails}
        breadcrumbs={[{ label: "Hồ sơ" }, { label: "Sổ công văn" }]}
        description="Theo dõi công văn đi/đến của các dự án bạn có quyền truy cập."
        metadata={<Badge variant="secondary">{data.length} văn bản</Badge>}
      />
      <PageBody>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm số công văn hoặc trích yếu…"
            aria-label="Tìm công văn"
            className="max-w-sm"
          />
          <Select value={loai} onValueChange={setLoai}>
            <SelectTrigger className="w-48" aria-label="Lọc theo loại công văn">
              <SelectValue placeholder="Tất cả loại" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {Object.entries(LOAI).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  {v}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải sổ công văn…
          </div>
        ) : error ? (
          <EmptyState
            title="Không tải được sổ công văn"
            description={(error as Error).message}
            live="polite"
          />
        ) : rows.length === 0 ? (
          <EmptyState title="Chưa có công văn" description="Không có văn bản phù hợp bộ lọc." />
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((r) => (
              <li key={r.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {r.so_cong_van ?? "(chưa có số)"} — {r.trich_yeu ?? "Không có trích yếu"}
                    </p>
                    <Link
                      to="/du-an/$id"
                      params={{ id: r.du_an_id }}
                      className="text-primary hover:underline"
                    >
                      {r.du_an?.ten ?? "Dự án"}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{LOAI[r.loai] ?? r.loai}</Badge>
                    <span className="text-muted-foreground">
                      {r.ngay_ban_hanh
                        ? new Date(r.ngay_ban_hanh).toLocaleDateString("vi-VN")
                        : "—"}
                    </span>
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
