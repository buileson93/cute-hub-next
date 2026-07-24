import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Loader2, RefreshCw, CheckCircle2, XCircle, Search, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/hooks/use-session";
import {
  usePmCongViec, useSinhPmCongViec, useHoanThanhPm, useBoQuaPm,
  PM_STATUS_META, type PmCongViecRow, type PmTrangThai,
} from "@/lib/mirats/pm";
import { EmptyState } from "@/components/mirats/EmptyState";

export const Route = createFileRoute("/_app/bao-tri/pm")({
  head: () => ({
    meta: [
      { title: "Bảo dưỡng định kỳ (PM) — MIRATS 2.0" },
      { name: "description", content: "Hàng đợi công việc bảo dưỡng định kỳ đến hạn theo chính sách PM: sắp đến hạn, đến hạn, quá hạn và hoàn thành." },
      { property: "og:title", content: "Bảo dưỡng định kỳ (PM) — MIRATS 2.0" },
      { property: "og:description", content: "Sinh và theo dõi công việc PM tự động theo chu kỳ chính sách." },
    ],
  }),
  component: PmPage,
});

const TABS: { value: string; label: string; states: PmTrangThai[] }[] = [
  { value: "tuan",    label: "Đến hạn 7 ngày",   states: ["sap_den_han", "den_han"] },
  { value: "qua_han", label: "Quá hạn",          states: ["qua_han"] },
  { value: "hoan_thanh", label: "Đã hoàn thành", states: ["hoan_thanh"] },
  { value: "all",     label: "Tất cả",           states: [] },
];

function PmPage() {
  const { hasRole } = useSession();
  const canSkip = hasRole("admin") || hasRole("phong_kt");
  const [tab, setTab] = useState("tuan");
  const [q, setQ] = useState("");
  const sinh = useSinhPmCongViec();
  const activeTab = TABS.find((t) => t.value === tab)!;
  const { data: rows, isLoading } = usePmCongViec(
    activeTab.states.length ? { trang_thai: activeTab.states } : undefined,
  );
  const [done, setDone] = useState<PmCongViecRow | null>(null);
  const [skip, setSkip] = useState<PmCongViecRow | null>(null);

  const list = useMemo(() => {
    const arr = rows ?? [];
    const ql = q.trim().toLowerCase();
    if (!ql) return arr;
    return arr.filter((r) =>
      [r.chinh_sach?.ten, r.don_vi?.ten_don_vi, r.phu_trach?.ho_ten, r.ky_hieu_han]
        .filter(Boolean).some((s) => (s as string).toLowerCase().includes(ql)),
    );
  }, [rows, q]);

  const stats = useMemo(() => {
    const arr = rows ?? [];
    return {
      total: arr.length,
      due: arr.filter((r) => r.trang_thai === "den_han" || r.trang_thai === "sap_den_han").length,
      overdue: arr.filter((r) => r.trang_thai === "qua_han").length,
      done: arr.filter((r) => r.trang_thai === "hoan_thanh").length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <CardTitle>Bảo dưỡng định kỳ (PM)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => sinh.mutate()} disabled={sinh.isPending}>
              {sinh.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="ml-2">Sinh công việc</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <StatCard label="Tổng theo tab" value={stats.total} />
            <StatCard label="Đến/sắp hạn" value={stats.due} tone="amber" />
            <StatCard label="Quá hạn" value={stats.overdue} tone="red" />
            <StatCard label="Hoàn thành" value={stats.done} tone="green" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                {TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value}>{t.label}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm chính sách/đơn vị/phụ trách…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          <div className="border rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chính sách</TableHead>
                  <TableHead>Đối tượng</TableHead>
                  <TableHead>Chu kỳ</TableHead>
                  <TableHead>Hạn</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Phụ trách</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin inline-block" /> Đang tải…
                  </TableCell></TableRow>
                )}
                {!isLoading && list.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-6">
                    <EmptyState
                      icon={CalendarClock}
                      title="Chưa có công việc PM"
                      description='Bấm "Sinh công việc" để tạo hàng đợi từ các chính sách bảo dưỡng định kỳ hiện có.'
                      action={
                        <Button size="sm" variant="outline" onClick={() => sinh.mutate()} disabled={sinh.isPending}>
                          <RefreshCw className="mr-1 h-4 w-4" /> Sinh công việc
                        </Button>
                      }
                    />
                  </TableCell></TableRow>
                )}
                {list.map((r) => {
                  const st = PM_STATUS_META[r.trang_thai];
                  const terminal = r.trang_thai === "hoan_thanh" || r.trang_thai === "bo_qua";
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        {r.chinh_sach?.ten ?? "—"}
                        {r.chinh_sach?.noi_dung && (
                          <div className="text-xs text-muted-foreground line-clamp-1">{r.chinh_sach.noi_dung}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline">{r.doi_tuong_type === "thiet_bi" ? "Tài sản" : "Hệ thống"}</Badge>
                        <div className="font-mono text-[10px] text-muted-foreground mt-1">{r.doi_tuong_id.slice(0, 8)}…</div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.chinh_sach?.chu_ky_loai === "metric" ? "Chỉ số" : "Ngày"} · {r.chinh_sach?.chu_ky_gia_tri ?? "—"}
                        {r.estimated && <div className="text-[10px] text-amber-600 flex items-center gap-1 mt-1"><AlertTriangle className="h-3 w-3" />ước lượng</div>}
                      </TableCell>
                      <TableCell>{r.han}</TableCell>
                      <TableCell><Badge className={st.color} variant="outline">{st.label}</Badge></TableCell>
                      <TableCell className="text-xs">{r.don_vi?.ten_don_vi ?? "—"}</TableCell>
                      <TableCell className="text-xs">{r.phu_trach?.ho_ten ?? "—"}</TableCell>
                      <TableCell className="text-right space-x-1">
                        {!terminal && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setDone(r)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span className="ml-1">Hoàn thành</span>
                            </Button>
                            {canSkip && (
                              <Button size="sm" variant="ghost" onClick={() => setSkip(r)}>
                                <XCircle className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <HoanThanhDialog task={done} onClose={() => setDone(null)} />
      <BoQuaDialog task={skip} onClose={() => setSkip(null)} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "amber" | "red" | "green" }) {
  const c = tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : tone === "green" ? "text-emerald-600" : "text-foreground";
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-semibold ${c}`}>{value}</div>
    </div>
  );
}

function HoanThanhDialog({ task, onClose }: { task: PmCongViecRow | null; onClose: () => void }) {
  const mut = useHoanThanhPm();
  const [ket_qua, setKq] = useState("");
  const [ghi_chu, setGhiChu] = useState("");
  const [thuc_hien_at, setNgay] = useState(() => new Date().toISOString().slice(0, 10));
  if (!task) return null;
  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hoàn thành công việc PM</DialogTitle>
          <DialogDescription>{task.chinh_sach?.ten} · hạn {task.han}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Ngày thực hiện</Label>
            <Input type="date" value={thuc_hien_at} onChange={(e) => setNgay(e.target.value)} />
          </div>
          <div>
            <Label>Kết quả *</Label>
            <Textarea rows={3} value={ket_qua} onChange={(e) => setKq(e.target.value)} placeholder="Mô tả kết quả thực hiện" />
          </div>
          <div>
            <Label>Ghi chú</Label>
            <Textarea rows={2} value={ghi_chu} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            disabled={!ket_qua.trim() || mut.isPending}
            onClick={async () => {
              await mut.mutateAsync({ taskId: task.id, thuc_hien_at, ket_qua, ghi_chu });
              onClose(); setKq(""); setGhiChu("");
            }}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Hoàn thành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BoQuaDialog({ task, onClose }: { task: PmCongViecRow | null; onClose: () => void }) {
  const mut = useBoQuaPm();
  const [ly_do, setLyDo] = useState("");
  if (!task) return null;
  return (
    <Dialog open={!!task} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bỏ qua công việc PM</DialogTitle>
          <DialogDescription>Ghi lý do — chỉ admin/phòng kỹ thuật mới được bỏ qua.</DialogDescription>
        </DialogHeader>
        <Textarea rows={3} value={ly_do} onChange={(e) => setLyDo(e.target.value)} placeholder="Lý do bỏ qua…" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Huỷ</Button>
          <Button
            variant="destructive"
            disabled={!ly_do.trim() || mut.isPending}
            onClick={async () => {
              await mut.mutateAsync({ taskId: task.id, ly_do });
              onClose(); setLyDo("");
            }}
          >
            {mut.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Bỏ qua
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
