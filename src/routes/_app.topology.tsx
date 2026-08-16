import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Waypoints, Plus, Trash2, Building2, Loader2, Cable, Import, ArrowRight, AlertTriangle,
} from "lucide-react";
import { InfoHint } from "@/components/mirats/InfoHint";
import { PageHeader } from "@/components/mirats/PageHeader";
import { useSession } from "@/hooks/use-session";
import { Combobox } from "@/components/mirats/Combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  useKetNoiData, useDevicePickList, useDiagramPickList, useAddKetNoi, useDeleteKetNoi,
  useImportTuSoDo, LOAI_KET_NOI_LABEL, type LoaiKetNoi, type ImportReport,
} from "@/lib/mirats/topology";
import { SoDoTabs } from "@/components/mirats/SoDoTabs";

export const Route = createFileRoute("/_app/topology")({
  head: () => ({
    meta: [
      { title: "Sơ đồ đấu nối — Tài sản MIRATS" },
      { name: "description", content: "Quản lý kết nối vật lý/logic giữa tài sản: cổng, cáp, mạch — nguồn dữ liệu chuẩn." },
    ],
  }),
  component: TopologyPage,
});

function TopologyPage() {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");

  const { ketNoi, isLoading } = useKetNoiData();
  const { devices } = useDevicePickList();
  const { diagrams } = useDiagramPickList();
  const addMut = useAddKetNoi();
  const delMut = useDeleteKetNoi();
  const importMut = useImportTuSoDo();

  const [addOpen, setAddOpen] = useState(false);
  const [tuId, setTuId] = useState("");
  const [denId, setDenId] = useState("");
  const [tuCong, setTuCong] = useState("");
  const [denCong, setDenCong] = useState("");
  const [loai, setLoai] = useState<LoaiKetNoi>("CAP");
  const [tenMach, setTenMach] = useState("");
  const [moTa, setMoTa] = useState("");

  const [impOpen, setImpOpen] = useState(false);
  const [impDiagram, setImpDiagram] = useState("");
  const [impReport, setImpReport] = useState<ImportReport | null>(null);

  const deviceOptions = useMemo(
    () =>
      devices.map((d) => ({
        value: d.id,
        label: d.ten_thiet_bi ? `${d.ten_thiet_bi}` : d.ma_thiet_bi,
        hint: d.ma_thiet_bi,
      })),
    [devices],
  );

  function resetAdd() {
    setTuId(""); setDenId(""); setTuCong(""); setDenCong("");
    setLoai("CAP"); setTenMach(""); setMoTa("");
  }

  async function handleAdd() {
    if (!tuId || !denId) { toast.error("Chọn đủ tài sản nguồn và đích"); return; }
    if (tuId === denId) { toast.error("Hai đầu kết nối phải khác nhau"); return; }
    try {
      await addMut.mutateAsync({
        tu_thiet_bi_id: tuId, den_thiet_bi_id: denId,
        tu_cong: tuCong, den_cong: denCong, loai, ten_mach: tenMach, mo_ta: moTa,
      });
      toast.success("Đã thêm kết nối");
      resetAdd(); setAddOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không thêm được kết nối");
    }
  }

  async function handleImport() {
    if (!impDiagram) { toast.error("Chọn sơ đồ nguồn"); return; }
    try {
      const rep = await importMut.mutateAsync(impDiagram);
      setImpReport(rep);
      toast.success(`Nhập xong: tạo mới ${rep.created}, khớp ${rep.mapped}, chưa khớp ${rep.unmapped}`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Không nhập được từ sơ đồ");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          icon={Waypoints}
          title="Sơ đồ đấu nối"
          help="Bảng kết nối vật lý/logic giữa các tài sản là nguồn dữ liệu chuẩn (cổng, cáp, mạch). Sơ đồ vẽ tay chỉ là lớp trình bày và có thể nhập vào đây."
        />
        {canManage && (
          <div className="flex gap-2">
            <Dialog open={impOpen} onOpenChange={(o) => { setImpOpen(o); if (!o) setImpReport(null); }}>
              <DialogTrigger asChild>
                <Button variant="outline"><Import className="mr-2 h-4 w-4" />Nhập từ sơ đồ</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nhập đấu nối từ sơ đồ</DialogTitle>
                  <DialogDescription>
                    Hệ thống đọc các đường nối trong sơ đồ đã chọn và tạo kết nối chuẩn cho những đầu
                    nối trỏ đúng tới tài sản trong CSDL. Chạy lại nhiều lần an toàn (không tạo trùng).
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Sơ đồ nguồn</Label>
                    <Select value={impDiagram} onValueChange={setImpDiagram}>
                      <SelectTrigger><SelectValue placeholder="Chọn sơ đồ…" /></SelectTrigger>
                      <SelectContent>
                        {diagrams.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.ten}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {impReport && (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      <div className="flex flex-wrap gap-3">
                        <span>Tạo mới: <b>{impReport.created}</b></span>
                        <span>Đã khớp sẵn: <b>{impReport.mapped}</b></span>
                        <span className="text-amber-600 dark:text-amber-400">
                          Chưa khớp: <b>{impReport.unmapped}</b>
                        </span>
                      </div>
                      {impReport.details?.length > 0 && (
                        <div className="mt-2 max-h-40 space-y-1 overflow-auto">
                          {impReport.details.map((d, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                              <span>{d.source} → {d.target}: {d.ly_do}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleImport} disabled={importMut.isPending}>
                    {importMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Nhập
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) resetAdd(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" />Thêm kết nối</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm kết nối tài sản</DialogTitle>
                  <DialogDescription>Chọn tài sản hai đầu và mô tả cổng/mạch.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Tài sản nguồn</Label>
                      <Combobox options={deviceOptions} value={tuId} onChange={setTuId} placeholder="Chọn tài sản…" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Tài sản đích</Label>
                      <Combobox options={deviceOptions} value={denId} onChange={setDenId} placeholder="Chọn tài sản…" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cổng nguồn</Label>
                      <Input value={tuCong} onChange={(e) => setTuCong(e.target.value)} placeholder="VD: Port 1" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cổng đích</Label>
                      <Input value={denCong} onChange={(e) => setDenCong(e.target.value)} placeholder="VD: eth0" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Loại kết nối</Label>
                    <Select value={loai} onValueChange={(v) => setLoai(v as LoaiKetNoi)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(LOAI_KET_NOI_LABEL) as LoaiKetNoi[]).map((k) => (
                          <SelectItem key={k} value={k}>{LOAI_KET_NOI_LABEL[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tên mạch / tuyến (tuỳ chọn)</Label>
                    <Input value={tenMach} onChange={(e) => setTenMach(e.target.value)} placeholder="VD: Mạch VHF-01" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ghi chú (tuỳ chọn)</Label>
                    <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAdd} disabled={addMut.isPending}>
                    {addMut.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Lưu kết nối
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <SoDoTabs />



      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Tổng kết nối" value={ketNoi.length} icon={Cable} />
        <StatCard label="Cáp vật lý" value={ketNoi.filter((k) => k.loai === "CAP").length} icon={Cable} />
        <StatCard label="Mạch/Circuit" value={ketNoi.filter((k) => k.loai === "MACH").length} icon={Waypoints} />
        <StatCard label="Đơn vị liên quan" value={new Set(ketNoi.map((k) => k.don_vi_ma).filter(Boolean)).size} icon={Building2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách kết nối</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : ketNoi.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Chưa có kết nối nào. {canManage ? "Thêm thủ công hoặc nhập từ sơ đồ." : ""}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3 font-medium">Kết nối</th>
                    <th className="py-2 pr-3 font-medium">Loại</th>
                    <th className="py-2 pr-3 font-medium">Mạch/tuyến</th>
                    <th className="py-2 pr-3 font-medium">Đơn vị</th>
                    {canManage && <th className="py-2 font-medium" />}
                  </tr>
                </thead>
                <tbody>
                  {ketNoi.map((k) => (
                    <tr key={k.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-medium">{k.tu_ten ?? k.tu_ma}</span>
                          {k.tu_cong && <Badge variant="secondary" className="text-[10px]">{k.tu_cong}</Badge>}
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">{k.den_ten ?? k.den_ma}</span>
                          {k.den_cong && <Badge variant="secondary" className="text-[10px]">{k.den_cong}</Badge>}
                        </div>
                        {k.mo_ta && <p className="mt-0.5 text-xs text-muted-foreground">{k.mo_ta}</p>}
                      </td>
                      <td className="py-2 pr-3">
                        <Badge variant="outline">{LOAI_KET_NOI_LABEL[k.loai] ?? k.loai}</Badge>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">{k.ten_mach ?? "—"}</td>
                      <td className="py-2 pr-3 text-muted-foreground">{k.don_vi_ten ?? k.don_vi_ma ?? "—"}</td>
                      {canManage && (
                        <td className="py-2 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" aria-label="Xoá">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xoá kết nối?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Thao tác này xoá kết nối khỏi CSDL và không thể hoàn tác.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Huỷ</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await delMut.mutateAsync(k.id);
                                      toast.success("Đã xoá kết nối");
                                    } catch (e: unknown) {
                                      toast.error(e instanceof Error ? e.message : "Không xoá được");
                                    }
                                  }}
                                >
                                  Xoá
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Cable }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="rounded-lg bg-primary/10 p-2 text-primary"><Icon className="h-5 w-5" /></div>
        <div>
          <p className="text-2xl font-semibold leading-none">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
