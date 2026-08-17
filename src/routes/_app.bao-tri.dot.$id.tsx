import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckboxInput } from "@/components/ui/checkbox-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { CalendarClock, Plus, ArrowLeft, Printer, FileText, ClipboardCheck, BarChart3, CheckCircle2, XCircle, AlertCircle, Lock, Send, Undo2, ShieldCheck, TimerReset, Clock, AlertTriangle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { PageHeader } from "@/components/mirats/PageHeader";
import { DotAuditTimeline, DotAuditTimelineHeader } from "@/components/mirats/DotAuditTimeline";

export const Route = createFileRoute("/_app/bao-tri/dot/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Đợt bảo dưỡng ${params.id.slice(0, 8)} — MIRATS` },
      { name: "description", content: "Chi tiết đợt bảo dưỡng: danh mục hệ thống, kết quả và báo cáo tổng hợp." },
    ],
  }),
  component: DotDetailPage,
});

const trangThaiHM: Record<string, { label: string; color: string }> = {
  chua_bat_dau: { label: "Chưa bắt đầu", color: "bg-slate-100 text-slate-700" },
  dang_lam: { label: "Đang làm", color: "bg-amber-100 text-amber-700" },
  hoan_thanh: { label: "Hoàn thành", color: "bg-emerald-100 text-emerald-700" },
  khong_thuc_hien: { label: "Không thực hiện", color: "bg-rose-100 text-rose-700" },
};

const duyetTT: Record<string, { label: string; color: string }> = {
  chua_gui: { label: "Chưa gửi", color: "bg-slate-100 text-slate-700" },
  cho_duyet: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700" },
  da_duyet: { label: "Đã duyệt (khoá)", color: "bg-emerald-100 text-emerald-700" },
  tu_choi: { label: "Bị trả lại", color: "bg-rose-100 text-rose-700" },
};

function deadlineTone(han: string | null | undefined, done: boolean) {
  if (!han) return { color: "text-muted-foreground", label: "—" };
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(han); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (done) return { color: "text-emerald-600", label: han };
  if (diff < 0) return { color: "text-rose-600 font-semibold", label: `${han} (quá ${-diff}d)` };
  if (diff <= 3) return { color: "text-amber-600 font-semibold", label: `${han} (còn ${diff}d)` };
  return { color: "text-foreground", label: han };
}

function DotDetailPage() {
  const { id } = Route.useParams();
  const { roles, profile } = useSession();
  const isKt = roles.includes("admin") || roles.includes("phong_kt");
  const isAdmin = roles.includes("admin");
  const qc = useQueryClient();
  const [selHM, setSelHM] = useState<string | null>(null);
  const [addOpenForDvId, setAddOpenForDvId] = useState<string | null>(null);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);

  const { data: dot } = useQuery({
    queryKey: ["dot-bao-duong", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("dot_bao_duong").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: donViList } = useQuery({
    queryKey: ["dm-don-vi-all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_don_vi").select("id,ma,ten").eq("active", true).order("ma");
      if (error) throw error;
      return data;
    },
  });

  const { data: hangMuc, refetch: refetchHM } = useQuery({
    queryKey: ["dot-bao-duong-hm", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dot_bao_duong_hang_muc")
        .select("*, dm_he_thong(id,ma,ten), dm_don_vi(id,ma,ten)")
        .eq("dot_id", id)
        .order("don_vi_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ["dot-alerts", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dot_bao_duong_canh_bao", { p_dot_id: id, p_sap_han_ngay: 3 });
      if (error) throw error;
      return data;
    },
  });

  const { data: hans } = useQuery({
    queryKey: ["dot-hans", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("dot_bao_duong_han").select("*").eq("dot_id", id);
      if (error) throw error;
      return data;
    },
  });

  const hanByDv = useMemo(() => {
    const m = new Map<string, string>();
    for (const h of hans ?? []) m.set(h.don_vi_id, h.han_ngay);
    return m;
  }, [hans]);

  const groupedByDv = useMemo(() => {
    const m = new Map<string, { donVi: { id: string; ma: string; ten: string } | null; items: NonNullable<typeof hangMuc>[number][] }>();
    for (const h of hangMuc ?? []) {
      const dv = h.dm_don_vi;
      const key = dv?.id ?? "unknown";
      const rec = m.get(key) ?? { donVi: dv, items: [] };
      rec.items.push(h);
      m.set(key, rec);
    }
    return Array.from(m.values()).sort((a, b) => (a.donVi?.ma ?? "").localeCompare(b.donVi?.ma ?? ""));
  }, [hangMuc]);

  const kpi = useMemo(() => {
    const total = hangMuc?.length ?? 0;
    const done = hangMuc?.filter((h) => h.trang_thai === "hoan_thanh").length ?? 0;
    const dat = hangMuc?.filter((h) => h.ket_qua === "dat").length ?? 0;
    const kd = hangMuc?.filter((h) => h.ket_qua === "khong_dat").length ?? 0;
    return { total, done, dat, kd, pct: total ? Math.round((done / total) * 100) : 0 };
  }, [hangMuc]);

  const updateDotMut = useMutation({
    mutationFn: async (patch: Partial<typeof dot>) => {
      const { error } = await supabase.from("dot_bao_duong").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dot-bao-duong", id] }),
  });

  const selectedHM = hangMuc?.find((h) => h.id === selHM) ?? null;

  const workflowMut = useMutation({
    mutationFn: async (args: { fn: "dot_hm_submit" | "dot_hm_approve" | "dot_hm_reject" | "dot_hm_unlock"; id: string; note?: string }) => {
      if (args.fn === "dot_hm_submit" || args.fn === "dot_hm_unlock") {
        const { error } = await supabase.rpc(args.fn, { p_hang_muc_id: args.id });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc(args.fn, { p_hang_muc_id: args.id, p_note: args.note });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Đã cập nhật quy trình duyệt");
      qc.invalidateQueries({ queryKey: ["dot-bao-duong-hm", id] });
      qc.invalidateQueries({ queryKey: ["dot-alerts", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [noteDialog, setNoteDialog] = useState<{ open: boolean; action: "dot_hm_approve" | "dot_hm_reject"; id: string } | null>(null);
  const [noteText, setNoteText] = useState("");
  function openNoteDialog(action: "dot_hm_approve" | "dot_hm_reject", hmId: string) {
    setNoteText("");
    setNoteDialog({ open: true, action, id: hmId });
  }
  function submitNoteDialog() {
    if (!noteDialog) return;
    if (noteDialog.action === "dot_hm_reject" && !noteText.trim()) {
      toast.error("Vui lòng nhập lý do trả lại"); return;
    }
    workflowMut.mutate({ fn: noteDialog.action, id: noteDialog.id, note: noteText.trim() || undefined });
    setNoteDialog(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/bao-tri/dot"><ArrowLeft className="mr-1 h-4 w-4" />Danh sách đợt</Link>
        </Button>
      </div>

      <PageHeader
        icon={CalendarClock}
        title={dot?.ten ?? "Đợt bảo dưỡng"}
        description={dot ? `Kỳ ${dot.ky}/${dot.nam}${dot.tu_ngay ? ` · ${dot.tu_ngay} → ${dot.den_ngay ?? ""}` : ""}` : ""}
        actions={
          isKt && dot && (
            <div className="flex items-center gap-2">
              <Select value={dot.trang_thai} onValueChange={(v) => updateDotMut.mutate({ trang_thai: v as never })}>
                <SelectTrigger className="h-9 w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nhap">Nháp</SelectItem>
                  <SelectItem value="mo">Đã mở</SelectItem>
                  <SelectItem value="dang_thuc_hien">Đang thực hiện</SelectItem>
                  <SelectItem value="dong">Đã đóng</SelectItem>
                  <SelectItem value="huy">Đã huỷ</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => setDeadlineDialogOpen(true)}><TimerReset className="mr-1 h-4 w-4" />Mốc tiến độ</Button>
              <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />In</Button>
            </div>
          )
        }
      />

      {/* Alerts card */}
      {(alerts?.length ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" />Cảnh báo tiến độ theo đơn vị</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {alerts!.map((a) => {
              const tone =
                a.muc_do === "qua_han" ? "border-rose-300 bg-rose-50" :
                a.muc_do === "sap_han" ? "border-amber-300 bg-amber-50" :
                a.muc_do === "hoan_tat" ? "border-emerald-300 bg-emerald-50" :
                "border-slate-200 bg-white";
              const label =
                a.muc_do === "qua_han" ? "Quá hạn" :
                a.muc_do === "sap_han" ? "Sắp hết hạn" :
                a.muc_do === "hoan_tat" ? "Hoàn tất" : "Đúng tiến độ";
              return (
                <div key={a.don_vi_id} className={`rounded border p-2 text-xs ${tone}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{a.don_vi_ma} — {a.don_vi_ten}</div>
                    <Badge variant="outline" className="text-[10px]">{label}</Badge>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    Hạn: {a.han_ngay ?? "—"} · Tổng {a.tong} · HT {a.hoan_thanh} · Duyệt {a.da_duyet}
                  </div>
                  {(a.qua_han > 0 || a.sap_han > 0) && (
                    <div className="mt-1 flex gap-2 text-[11px]">
                      {a.qua_han > 0 && <span className="text-rose-600">● Quá hạn: {a.qua_han}</span>}
                      {a.sap_han > 0 && <span className="text-amber-600">● Sắp hạn: {a.sap_han}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Tổng hạng mục" value={kpi.total} />
        <KpiCard label="Hoàn thành" value={`${kpi.done} (${kpi.pct}%)`} tone="emerald" />
        <KpiCard label="Đạt" value={kpi.dat} tone="emerald" />
        <KpiCard label="Không đạt" value={kpi.kd} tone="rose" />
      </div>

      <Tabs defaultValue="danh-muc" className="space-y-3">
        <TabsList>
          <TabsTrigger value="danh-muc"><ClipboardCheck className="mr-1 h-4 w-4" />Danh mục & Kết quả</TabsTrigger>
          <TabsTrigger value="bao-cao"><BarChart3 className="mr-1 h-4 w-4" />Báo cáo</TabsTrigger>
          <TabsTrigger value="nhat-ky"><FileText className="mr-1 h-4 w-4" />Nhật ký</TabsTrigger>
        </TabsList>

        <TabsContent value="danh-muc" className="space-y-3">
          {groupedByDv.length === 0 && (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">
              Chưa có hệ thống nào. {isKt ? "Bấm \"Thêm hệ thống\" trong mỗi đơn vị." : "Đơn vị của bạn có thể thêm hệ thống dưới đây."}
            </CardContent></Card>
          )}
          {isKt && donViList && groupedByDv.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {donViList.map((dv) => (
                <Button key={dv.id} size="sm" variant="outline" onClick={() => setAddOpenForDvId(dv.id)}>
                  <Plus className="mr-1 h-3.5 w-3.5" />Thêm cho {dv.ma}
                </Button>
              ))}
            </div>
          )}
          {groupedByDv.map((g) => (
            <Card key={g.donVi?.id ?? "unknown"}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {g.donVi ? `${g.donVi.ma} — ${g.donVi.ten}` : "Không xác định đơn vị"}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">({g.items.length} hệ thống)</span>
                  </CardTitle>
                  {g.donVi && (isKt || profile?.don_vi === g.donVi.ma) && (
                    <Button size="sm" variant="outline" onClick={() => setAddOpenForDvId(g.donVi!.id)}>
                      <Plus className="mr-1 h-3.5 w-3.5" />Thêm hệ thống
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Hệ thống</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                      <th className="px-3 py-2 text-left">Duyệt</th>
                      <th className="px-3 py-2 text-left">Kết quả</th>
                      <th className="px-3 py-2 text-left">Hạn</th>
                      <th className="px-3 py-2 text-left">Tồn tại</th>
                      <th className="px-3 py-2 w-32" />
                    </tr>
                  </thead>
                  <tbody>
                    {g.items.map((h) => {
                      const tt = trangThaiHM[h.trang_thai] ?? trangThaiHM.chua_bat_dau;
                      const dt = duyetTT[h.duyet_trang_thai ?? "chua_gui"] ?? duyetTT.chua_gui;
                      const eff = h.han_hoan_thanh ?? hanByDv.get(h.don_vi_id) ?? undefined;
                      const dl = deadlineTone(eff, h.trang_thai === "hoan_thanh" || h.duyet_trang_thai === "da_duyet");
                      const locked = h.duyet_trang_thai === "da_duyet";
                      const isMine = profile?.don_vi === g.donVi?.ma;
                      return (
                        <tr key={h.id} className="border-t hover:bg-muted/30">
                          <td className="px-3 py-2">
                            <div className="font-medium flex items-center gap-1">
                              {locked && <Lock className="h-3 w-3 text-emerald-600" />}
                              {h.dm_he_thong?.ten}
                            </div>
                            <div className="text-xs text-muted-foreground">{h.dm_he_thong?.ma}</div>
                          </td>
                          <td className="px-3 py-2"><Badge className={tt.color} variant="secondary">{tt.label}</Badge></td>
                          <td className="px-3 py-2"><Badge className={dt.color} variant="secondary">{dt.label}</Badge></td>
                          <td className="px-3 py-2">
                            {h.ket_qua === "dat" && <span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Đạt</span>}
                            {h.ket_qua === "khong_dat" && <span className="inline-flex items-center gap-1 text-rose-600"><XCircle className="h-3.5 w-3.5" />Không đạt</span>}
                            {!h.ket_qua && <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className={`px-3 py-2 text-xs ${dl.color}`}>{dl.label}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground line-clamp-1 max-w-[240px]">{h.ton_tai || "—"}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => setSelHM(h.id)} disabled={locked && !isAdmin}>
                                {locked ? "Xem" : "Cập nhật"}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="ghost">⋯</Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  {(isMine || isKt) && !locked && h.duyet_trang_thai !== "cho_duyet" && (
                                    <DropdownMenuItem onClick={() => workflowMut.mutate({ fn: "dot_hm_submit", id: h.id })}>
                                      <Send className="mr-2 h-3.5 w-3.5" />Gửi phê duyệt
                                    </DropdownMenuItem>
                                  )}
                                  {isKt && h.duyet_trang_thai === "cho_duyet" && (
                                    <>
                                      <DropdownMenuItem onClick={() => openNoteDialog("dot_hm_approve", h.id)}>
                                        <ShieldCheck className="mr-2 h-3.5 w-3.5" />Duyệt & khoá
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openNoteDialog("dot_hm_reject", h.id)}>
                                        <Undo2 className="mr-2 h-3.5 w-3.5" />Trả lại đơn vị
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {isAdmin && locked && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => {
                                        if (window.confirm("Mở khoá hạng mục đã duyệt?")) workflowMut.mutate({ fn: "dot_hm_unlock", id: h.id });
                                      }}>
                                        <Lock className="mr-2 h-3.5 w-3.5" />Mở khoá (Admin)
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}

          {/* Add for kt buttons above list when empty; also render inline "add for other units" for KT */}
          {isKt && groupedByDv.length > 0 && donViList && (
            <div className="flex flex-wrap gap-2">
              {donViList
                .filter((dv) => !groupedByDv.find((g) => g.donVi?.id === dv.id))
                .map((dv) => (
                  <Button key={dv.id} size="sm" variant="outline" onClick={() => setAddOpenForDvId(dv.id)}>
                    <Plus className="mr-1 h-3.5 w-3.5" />Thêm cho {dv.ma}
                  </Button>
                ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bao-cao">
          <BaoCaoTab dotId={id} dotName={dot?.ten ?? ""} kpi={kpi} grouped={groupedByDv} />
        </TabsContent>

        <TabsContent value="nhat-ky">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base"><DotAuditTimelineHeader /></CardTitle></CardHeader>
            <CardContent><DotAuditTimeline dotId={id} limit={200} /></CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add he_thong dialog */}
      <AddHeThongDialog
        open={!!addOpenForDvId}
        onOpenChange={(o) => !o && setAddOpenForDvId(null)}
        dotId={id}
        donViId={addOpenForDvId}
        existingHeThongIds={(hangMuc ?? []).map((h) => h.he_thong_id)}
        onDone={() => { setAddOpenForDvId(null); refetchHM(); }}
      />

      {/* Update sheet */}
      <Sheet open={!!selHM} onOpenChange={(o) => !o && setSelHM(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader><SheetTitle>Cập nhật kết quả</SheetTitle></SheetHeader>
          {selectedHM && (
            <UpdateHangMucPanel
              hangMuc={selectedHM}
              readonly={selectedHM.duyet_trang_thai === "da_duyet" && !isAdmin}
              onSaved={() => { setSelHM(null); refetchHM(); }}
            />
          )}
        </SheetContent>
      </Sheet>

      <DeadlinesDialog
        open={deadlineDialogOpen}
        onOpenChange={setDeadlineDialogOpen}
        dotId={id}
        donViList={donViList ?? []}
        existingHans={hans ?? []}
        onDone={() => { qc.invalidateQueries({ queryKey: ["dot-hans", id] }); refetchAlerts(); }}
      />

      <Dialog open={!!noteDialog?.open} onOpenChange={(o) => { if (!o) setNoteDialog(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {noteDialog?.action === "dot_hm_approve" ? "Duyệt & khoá hạng mục" : "Trả lại hạng mục cho đơn vị"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>
              {noteDialog?.action === "dot_hm_approve" ? "Ý kiến phê duyệt (tuỳ chọn)" : "Lý do trả lại"}
              {noteDialog?.action === "dot_hm_reject" && <span className="text-rose-600"> *</span>}
            </Label>
            <Textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={noteDialog?.action === "dot_hm_approve" ? "Nhận xét thêm cho hồ sơ…" : "Nêu rõ nội dung cần đơn vị chỉnh sửa/bổ sung"}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">Ghi chú sẽ hiển thị cho đơn vị và lưu vào nhật ký thao tác.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialog(null)}>Huỷ</Button>
            <Button
              onClick={submitNoteDialog}
              disabled={workflowMut.isPending || (noteDialog?.action === "dot_hm_reject" && !noteText.trim())}
              variant={noteDialog?.action === "dot_hm_reject" ? "destructive" : "default"}
            >
              {noteDialog?.action === "dot_hm_approve" ? "Duyệt & khoá" : "Trả lại đơn vị"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KpiCard({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "emerald" | "rose" }) {
  const color = tone === "emerald" ? "text-emerald-600" : tone === "rose" ? "text-rose-600" : "text-foreground";
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-xl font-semibold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function AddHeThongDialog({ open, onOpenChange, dotId, donViId, existingHeThongIds, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; dotId: string; donViId: string | null;
  existingHeThongIds: string[]; onDone: () => void;
}) {
  const { data: he_thongs } = useQuery({
    queryKey: ["dm-he-thong-by-dv", donViId],
    queryFn: async () => {
      if (!donViId) return [];
      const { data, error } = await supabase.from("dm_he_thong").select("id,ma,ten").eq("don_vi_id", donViId).order("ma");
      if (error) throw error;
      return data;
    },
    enabled: !!donViId && open,
  });
  const [sel, setSel] = useState<Set<string>>(new Set());
  const bulkAdd = useMutation({
    mutationFn: async () => {
      if (!donViId) return;
      const { error } = await supabase.rpc("dot_them_hang_muc_hang_loat", {
        p_dot_id: dotId, p_don_vi_id: donViId, p_he_thong_ids: Array.from(sel),
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã thêm hạng mục"); setSel(new Set()); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const available = (he_thongs ?? []).filter((h) => !existingHeThongIds.includes(h.id));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Thêm hệ thống vào đợt</DialogTitle></DialogHeader>
        <div className="max-h-80 space-y-1 overflow-auto rounded border p-2">
          {available.length === 0 && <div className="p-4 text-center text-sm text-muted-foreground">Không có hệ thống khả dụng.</div>}
          {available.map((h) => (
            <label key={h.id} className="flex cursor-pointer items-start gap-2 rounded p-2 hover:bg-muted">
              <Checkbox
                checked={sel.has(h.id)}
                onCheckedChange={(checked) => {
                  const s = new Set(sel);
                  if (checked) s.add(h.id); else s.delete(h.id);
                  setSel(s);
                }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{h.ten}</div>
                <div className="text-xs text-muted-foreground">{h.ma}</div>
              </div>
            </label>
          ))}
        </div>
        <DialogFooter>
          <div className="flex-1 text-sm text-muted-foreground">Đã chọn {sel.size}</div>
          <Button disabled={sel.size === 0 || bulkAdd.isPending} onClick={() => bulkAdd.mutate()}>
            {bulkAdd.isPending ? "Đang thêm…" : "Thêm vào đợt"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UpdateHangMucPanel({ hangMuc, onSaved, readonly = false }: { hangMuc: { id: string; trang_thai: string; duyet_trang_thai?: string | null; ket_qua: string | null; ton_tai: string | null; kien_nghi: string | null; han_hoan_thanh?: string | null; he_thong_id: string; dm_he_thong: { id: string; ma: string; ten: string } | null; approval_note?: string | null }; onSaved: () => void; readonly?: boolean }) {
  const [trangThai, setTrangThai] = useState(hangMuc.trang_thai);
  const [ketQua, setKetQua] = useState<string>(hangMuc.ket_qua ?? "");
  const [tonTai, setTonTai] = useState(hangMuc.ton_tai ?? "");
  const [kienNghi, setKienNghi] = useState(hangMuc.kien_nghi ?? "");
  const [han, setHan] = useState<string>(hangMuc.han_hoan_thanh ?? "");

  const { data: bienBans } = useQuery({
    queryKey: ["hm-bien-ban", hangMuc.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("dot_bao_duong_bien_ban").select("id, form_submission:form_submission_id(id, tieu_de, template_code, created_at)").eq("hang_muc_id", hangMuc.id);
      if (error) throw error;
      return data as Array<{ id: string; form_submission: { id: string; tieu_de: string | null; template_code: string; created_at: string } | null }>;
    },
  });

  const { data: candidates } = useQuery({
    queryKey: ["hm-candidate-forms", hangMuc.he_thong_id],
    queryFn: async () => {
      const { data, error } = await supabase.from("form_submission").select("id, tieu_de, template_code, created_at").eq("he_thong_id", hangMuc.he_thong_id).order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const base = {
        trang_thai: trangThai as "chua_bat_dau" | "dang_lam" | "hoan_thanh" | "khong_thuc_hien",
        ket_qua: (ketQua || null) as never,
        ton_tai: tonTai || null,
        kien_nghi: kienNghi || null,
        han_hoan_thanh: han || null,
      };
      let ngay_hoan_thanh: string | undefined;
      let nguoi_thuc_hien: string | undefined;
      if (trangThai === "hoan_thanh") {
        ngay_hoan_thanh = new Date().toISOString();
        const { data: u } = await supabase.auth.getUser();
        if (u.user) nguoi_thuc_hien = u.user.id;
      }
      const { error } = await supabase.from("dot_bao_duong_hang_muc")
        .update({ ...base, ...(ngay_hoan_thanh ? { ngay_hoan_thanh } : {}), ...(nguoi_thuc_hien ? { nguoi_thuc_hien } : {}) })
        .eq("id", hangMuc.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã lưu"); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const linkBb = useMutation({
    mutationFn: async (fsId: string) => {
      const { error } = await supabase.from("dot_bao_duong_bien_ban").insert({ hang_muc_id: hangMuc.id, form_submission_id: fsId });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã gắn biên bản"); },
  });

  return (
    <div className="mt-4 space-y-4">
      {readonly && (
        <div className="rounded border border-emerald-300 bg-emerald-50 p-2 text-xs text-emerald-800 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5" />Hạng mục đã được duyệt và khoá. Cần Admin mở khoá để chỉnh sửa.
        </div>
      )}
      {hangMuc.approval_note && (
        <div className="rounded border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
          <span className="font-medium">Ghi chú duyệt:</span> {hangMuc.approval_note}
        </div>
      )}
      <div className="rounded bg-muted p-3 text-sm">
        <div className="font-medium">{hangMuc.dm_he_thong?.ten}</div>
        <div className="text-xs text-muted-foreground">{hangMuc.dm_he_thong?.ma}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Trạng thái</Label>
          <Select value={trangThai} onValueChange={setTrangThai} disabled={readonly}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="chua_bat_dau">Chưa bắt đầu</SelectItem>
              <SelectItem value="dang_lam">Đang làm</SelectItem>
              <SelectItem value="hoan_thanh">Hoàn thành</SelectItem>
              <SelectItem value="khong_thuc_hien">Không thực hiện</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Kết quả</Label>
          <Select value={ketQua || "none"} onValueChange={(v) => setKetQua(v === "none" ? "" : v)} disabled={readonly}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— Chưa đánh giá</SelectItem>
              <SelectItem value="dat">Đạt</SelectItem>
              <SelectItem value="khong_dat">Không đạt</SelectItem>
              <SelectItem value="khac">Khác</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Hạn hoàn thành</Label>
          <Input type="date" value={han} onChange={(e) => setHan(e.target.value)} disabled={readonly} />
        </div>
      </div>
      <div><Label>Tồn tại</Label><Textarea rows={2} value={tonTai} onChange={(e) => setTonTai(e.target.value)} disabled={readonly} /></div>
      <div><Label>Kiến nghị</Label><Textarea rows={2} value={kienNghi} onChange={(e) => setKienNghi(e.target.value)} disabled={readonly} /></div>

      <div className="space-y-2 rounded border p-3">
        <div className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4" />Biên bản đã gắn</div>
        {(bienBans ?? []).length === 0 && <div className="text-xs text-muted-foreground">Chưa có biên bản.</div>}
        {(bienBans ?? []).map((b) => (
          <div key={b.id} className="flex items-center justify-between text-xs">
            <span>{b.form_submission?.tieu_de ?? b.form_submission?.template_code ?? b.form_submission?.id?.slice(0, 8)}</span>
            {b.form_submission?.id && (
              <Link to="/forms/submissions/$id" params={{ id: b.form_submission.id }} className="text-primary">Mở</Link>
            )}
          </div>
        ))}
        {(candidates ?? []).length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground">Gắn biên bản có sẵn</summary>
            <div className="mt-2 space-y-1">
              {(candidates ?? []).map((f) => (
                <div key={f.id} className="flex items-center justify-between rounded p-1 hover:bg-muted">
                  <span>{f.tieu_de ?? f.template_code ?? f.id.slice(0, 8)}</span>
                  <Button size="sm" variant="ghost" onClick={() => linkBb.mutate(f.id)}>Gắn</Button>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={() => save.mutate()} disabled={save.isPending || readonly}>{save.isPending ? "Đang lưu…" : "Lưu"}</Button>
      </div>

      <div className="space-y-2 rounded border p-3">
        <DotAuditTimelineHeader />
        <DotAuditTimeline hangMucId={hangMuc.id} limit={50} />
      </div>
    </div>
  );
}

function DeadlinesDialog({ open, onOpenChange, dotId, donViList, existingHans, onDone }: {
  open: boolean; onOpenChange: (o: boolean) => void; dotId: string;
  donViList: Array<{ id: string; ma: string; ten: string }>;
  existingHans: Array<{ id: string; don_vi_id: string; han_ngay: string; mo_ta: string | null }>;
  onDone: () => void;
}) {
  const [rows, setRows] = useState<Record<string, string>>({});
  useMemo(() => {
    const initial: Record<string, string> = {};
    for (const h of existingHans) initial[h.don_vi_id] = h.han_ngay;
    setRows(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = useMutation({
    mutationFn: async () => {
      const upserts = Object.entries(rows).filter(([, v]) => v).map(([don_vi_id, han_ngay]) => ({ dot_id: dotId, don_vi_id, han_ngay }));
      if (upserts.length === 0) return;
      const { error } = await supabase.from("dot_bao_duong_han").upsert(upserts, { onConflict: "dot_id,don_vi_id" });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã lưu mốc tiến độ"); onDone(); onOpenChange(false); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Mốc tiến độ theo đơn vị</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-96 overflow-auto">
          {donViList.map((dv) => (
            <div key={dv.id} className="grid grid-cols-[1fr_180px] items-center gap-2">
              <div className="text-sm"><span className="font-medium">{dv.ma}</span> <span className="text-muted-foreground">{dv.ten}</span></div>
              <Input type="date" value={rows[dv.id] ?? ""} onChange={(e) => setRows({ ...rows, [dv.id]: e.target.value })} />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Đang lưu…" : "Lưu"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BaoCaoTab({ dotId, dotName, kpi, grouped }: {
  dotId: string; dotName: string;
  kpi: { total: number; done: number; dat: number; kd: number; pct: number };
  grouped: Array<{ donVi: { id: string; ma: string; ten: string } | null; items: Array<{ id: string; trang_thai: string; ket_qua: string | null; ton_tai: string | null; kien_nghi: string | null; dm_he_thong: { ma: string; ten: string } | null }> }>;
}) {
  const perDv = grouped.map((g) => {
    const total = g.items.length;
    const done = g.items.filter((h) => h.trang_thai === "hoan_thanh").length;
    const dat = g.items.filter((h) => h.ket_qua === "dat").length;
    const kd = g.items.filter((h) => h.ket_qua === "khong_dat").length;
    return { dv: g.donVi, total, done, dat, kd, pct: total ? Math.round((done / total) * 100) : 0 };
  });
  const [exporting, setExporting] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 print:hidden">
        <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />In / Lưu PDF</Button>
        <Button size="sm" disabled={exporting} onClick={async () => {
          setExporting(true);
          try { await exportWord({ dotId, dotName, kpi, perDv, grouped }); } finally { setExporting(false); }
        }}>
          <FileText className="mr-1 h-4 w-4" />{exporting ? "Đang xuất…" : "Xuất Word"}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Tiến độ theo đơn vị</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Đơn vị</th>
                <th className="px-3 py-2 text-right">Tổng</th>
                <th className="px-3 py-2 text-right">Hoàn thành</th>
                <th className="px-3 py-2 text-right">Đạt</th>
                <th className="px-3 py-2 text-right">Không đạt</th>
                <th className="px-3 py-2 text-left w-40">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {perDv.map((r) => (
                <tr key={r.dv?.id ?? "?"} className="border-t">
                  <td className="px-3 py-2 font-medium">{r.dv?.ma} — {r.dv?.ten}</td>
                  <td className="px-3 py-2 text-right">{r.total}</td>
                  <td className="px-3 py-2 text-right">{r.done}</td>
                  <td className="px-3 py-2 text-right text-emerald-600">{r.dat}</td>
                  <td className="px-3 py-2 text-right text-rose-600">{r.kd}</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-2 flex-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${r.pct}%` }} /></div><span className="w-10 text-xs">{r.pct}%</span></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4" />Tồn tại & Kiến nghị</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {grouped.flatMap((g) => g.items.filter((h) => h.ton_tai || h.kien_nghi).map((h) => (
            <div key={h.id} className="rounded border p-2 text-sm">
              <div className="font-medium">{h.dm_he_thong?.ten} <span className="text-xs text-muted-foreground">({g.donVi?.ma})</span></div>
              {h.ton_tai && <div className="text-xs"><span className="font-medium">Tồn tại:</span> {h.ton_tai}</div>}
              {h.kien_nghi && <div className="text-xs"><span className="font-medium">Kiến nghị:</span> {h.kien_nghi}</div>}
            </div>
          )))}
          {grouped.every((g) => g.items.every((h) => !h.ton_tai && !h.kien_nghi)) && (
            <div className="text-sm text-muted-foreground">Không có tồn tại nào được ghi nhận.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function exportWord(args: {
  dotId: string; dotName: string;
  kpi: { total: number; done: number; dat: number; kd: number; pct: number };
  perDv: Array<{ dv: { ma: string; ten: string } | null; total: number; done: number; dat: number; kd: number; pct: number }>;
  grouped: Array<{ donVi: { ma: string; ten: string } | null; items: Array<{ trang_thai: string; ket_qua: string | null; ton_tai: string | null; kien_nghi: string | null; dm_he_thong: { ma: string; ten: string } | null }> }>;
}) {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = await import("docx");
  const cell = (t: string, opts: { bold?: boolean; width?: number } = {}) => new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text: t, bold: opts.bold })] })],
  });
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: "BÁO CÁO KẾT QUẢ ĐỢT BẢO DƯỠNG LỚN", bold: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: args.dotName, italics: true })] }),
        new Paragraph({ children: [new TextRun({ text: "" })] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("I. Tổng quan")] }),
        new Paragraph({ children: [new TextRun(`Tổng số hạng mục: ${args.kpi.total} — Hoàn thành: ${args.kpi.done} (${args.kpi.pct}%) — Đạt: ${args.kpi.dat} — Không đạt: ${args.kpi.kd}`)] }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("II. Kết quả theo đơn vị")] }),
        new Table({
          width: { size: 9360, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell("Đơn vị", { bold: true }), cell("Tổng", { bold: true }), cell("HT", { bold: true }), cell("Đạt", { bold: true }), cell("K.Đạt", { bold: true }), cell("%", { bold: true })] }),
            ...args.perDv.map((r) => new TableRow({ children: [
              cell(`${r.dv?.ma ?? ""} — ${r.dv?.ten ?? ""}`),
              cell(String(r.total)), cell(String(r.done)), cell(String(r.dat)), cell(String(r.kd)), cell(`${r.pct}%`),
            ] })),
          ],
        }),
        new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("III. Chi tiết hạng mục")] }),
        ...args.grouped.flatMap((g) => [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(g.donVi ? `${g.donVi.ma} — ${g.donVi.ten}` : "Không xác định")] }),
          new Table({
            width: { size: 9360, type: WidthType.DXA },
            rows: [
              new TableRow({ children: [cell("Hệ thống", { bold: true }), cell("Trạng thái", { bold: true }), cell("Kết quả", { bold: true }), cell("Tồn tại / Kiến nghị", { bold: true })] }),
              ...g.items.map((h) => new TableRow({ children: [
                cell(`${h.dm_he_thong?.ma ?? ""} — ${h.dm_he_thong?.ten ?? ""}`),
                cell(h.trang_thai),
                cell(h.ket_qua ?? ""),
                cell([h.ton_tai, h.kien_nghi].filter(Boolean).join(" — ")),
              ] })),
            ],
          }),
        ]),
      ],
    }],
  });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `bao-cao-dot-${args.dotId.slice(0, 8)}.docx`; a.click();
  URL.revokeObjectURL(url);
  toast.success("Đã xuất Word");
}