import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/mirats/PageHeader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { CalendarClock, Plus, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/bao-tri/dot/")({
  head: () => ({
    meta: [
      { title: "Đợt bảo dưỡng lớn — MIRATS" },
      { name: "description", content: "Quản lý các đợt bảo dưỡng lớn định kỳ trong năm." },
      { property: "og:title", content: "Đợt bảo dưỡng lớn — MIRATS" },
      { property: "og:description", content: "Lập danh mục hệ thống, thu thập kết quả và tổng hợp báo cáo bảo dưỡng theo đợt." },
    ],
  }),
  component: DotListPage,
});

const trangThaiLabel: Record<string, { label: string; color: string }> = {
  nhap: { label: "Nháp", color: "bg-slate-100 text-slate-700" },
  mo: { label: "Đã mở", color: "bg-sky-100 text-sky-700" },
  dang_thuc_hien: { label: "Đang thực hiện", color: "bg-amber-100 text-amber-700" },
  dong: { label: "Đã đóng", color: "bg-emerald-100 text-emerald-700" },
  huy: { label: "Đã huỷ", color: "bg-rose-100 text-rose-700" },
};

function DotListPage() {
  const { roles } = useSession();
  const isKt = roles.includes("admin") || roles.includes("phong_kt");
  const qc = useQueryClient();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  const { data: dots, isLoading } = useQuery({
    queryKey: ["dot-bao-duong"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dot_bao_duong")
        .select("*")
        .order("nam", { ascending: false })
        .order("ky", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: tienDoMap } = useQuery({
    queryKey: ["dot-bao-duong-tien-do", dots?.map((d) => d.id).join(",")],
    queryFn: async () => {
      if (!dots || dots.length === 0) return {} as Record<string, { tong: number; done: number }>;
      const { data, error } = await supabase
        .from("dot_bao_duong_hang_muc")
        .select("dot_id, trang_thai")
        .in("dot_id", dots.map((d) => d.id));
      if (error) throw error;
      const m: Record<string, { tong: number; done: number }> = {};
      for (const r of data ?? []) {
        const rec = (m[r.dot_id] ??= { tong: 0, done: 0 });
        rec.tong += 1;
        if (r.trang_thai === "hoan_thanh") rec.done += 1;
      }
      return m;
    },
    enabled: !!dots && dots.length > 0,
  });

  const createMut = useMutation({
    mutationFn: async (payload: { ten: string; nam: number; ky: number; tu_ngay?: string; den_ngay?: string; mo_ta?: string }) => {
      const { data, error } = await supabase.from("dot_bao_duong").insert(payload).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success("Đã tạo đợt bảo dưỡng");
      qc.invalidateQueries({ queryKey: ["dot-bao-duong"] });
      setOpen(false);
      nav({ to: "/bao-tri/dot/$id", params: { id: d.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CalendarClock}
        title="Đợt bảo dưỡng lớn"
        description="Quản lý các đợt bảo dưỡng lớn (2 đợt/năm): lập danh mục hệ thống cho từng đơn vị, thu thập kết quả và xuất báo cáo tổng hợp."
        actions={
          isKt && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-1 h-4 w-4" />Tạo đợt mới</Button>
              </DialogTrigger>
              <NewDotDialog onSubmit={(p) => createMut.mutate(p)} loading={createMut.isPending} />
            </Dialog>
          )
        }
      />

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Đang tải…</div>
      ) : !dots || dots.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa có đợt bảo dưỡng nào. {isKt && "Bấm \"Tạo đợt mới\" để bắt đầu."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {dots.map((d) => {
            const p = tienDoMap?.[d.id];
            const pct = p && p.tong > 0 ? Math.round((p.done / p.tong) * 100) : 0;
            const tt = trangThaiLabel[d.trang_thai] ?? trangThaiLabel.nhap;
            return (
              <Link key={d.id} to="/bao-tri/dot/$id" params={{ id: d.id }} className="block">
                <Card className="transition hover:border-primary hover:shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-base leading-snug">{d.ten}</CardTitle>
                      <Badge className={tt.color} variant="secondary">{tt.label}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Kỳ {d.ky}/{d.nam}
                      {d.tu_ngay && d.den_ngay ? ` · ${d.tu_ngay} → ${d.den_ngay}` : ""}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Tiến độ hoàn thành</span>
                      <span className="font-medium">{p?.done ?? 0}/{p?.tong ?? 0} · {pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-end pt-1 text-xs text-primary">
                      Chi tiết <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewDotDialog({ onSubmit, loading }: { onSubmit: (p: { ten: string; nam: number; ky: number; tu_ngay?: string; den_ngay?: string; mo_ta?: string }) => void; loading: boolean }) {
  const y = new Date().getFullYear();
  const [ten, setTen] = useState(`Đợt bảo dưỡng lớn kỳ 1/${y}`);
  const [nam, setNam] = useState(y);
  const [ky, setKy] = useState(1);
  const [tu, setTu] = useState("");
  const [den, setDen] = useState("");
  const [moTa, setMoTa] = useState("");
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>Tạo đợt bảo dưỡng lớn</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div>
          <Label>Tên đợt</Label>
          <Input value={ten} onChange={(e) => setTen(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Năm</Label>
            <Input type="number" value={nam} onChange={(e) => setNam(Number(e.target.value))} />
          </div>
          <div>
            <Label>Kỳ</Label>
            <Select value={String(ky)} onValueChange={(v) => { setKy(Number(v)); setTen(`Đợt bảo dưỡng lớn kỳ ${v}/${nam}`); }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Kỳ 1</SelectItem>
                <SelectItem value="2">Kỳ 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Từ ngày</Label><Input type="date" value={tu} onChange={(e) => setTu(e.target.value)} /></div>
          <div><Label>Đến ngày</Label><Input type="date" value={den} onChange={(e) => setDen(e.target.value)} /></div>
        </div>
        <div>
          <Label>Mô tả</Label>
          <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={3} />
        </div>
      </div>
      <DialogFooter>
        <Button
          disabled={loading || !ten.trim()}
          onClick={() => onSubmit({ ten: ten.trim(), nam, ky, tu_ngay: tu || undefined, den_ngay: den || undefined, mo_ta: moTa || undefined })}
        >
          {loading ? "Đang tạo…" : "Tạo đợt"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}