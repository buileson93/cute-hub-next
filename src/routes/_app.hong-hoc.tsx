import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { PageFrame } from "@/components/mirats/layout/PageFrame";
import { createFileRoute, Link } from "@tanstack/react-router";
import { InfoHint } from "@/components/mirats/InfoHint";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Replace, AlertTriangle, DollarSign, ArrowRight, Plus, Pencil, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/mirats/StatusBadge";
import { statuses, normalizeLegacy } from "@/lib/mirats/trang-thai";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { fmtVND } from "@/lib/mirats/format";
import { useScope } from "@/lib/mirats/scope";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { canManageHongHoc, canCompleteHongHoc, isHongHocOpen, normalizePhuongAn } from "@/lib/mirats/hong-hoc-state";
import type { HongHocThayThe } from "@/lib/mirats/types";
import { VatTuTieuHaoInline } from "@/components/mirats/VatTuTieuHaoInline";
import { StandardTable, type StdColumn } from "@/components/mirats/StandardTable";



export const Route = createFileRoute("/_app/hong-hoc")({
  head: () => ({
    meta: [
      { title: "Hỏng hóc & Thay thế — MIRATS 2.0" },
      { name: "description", content: "M6 — Phiếu hỏng hóc–thay thế, truy vết tài sản cũ → mới, xuất kho vật tư sửa chữa." },
      { property: "og:title", content: "Hỏng hóc & Thay thế — MIRATS 2.0" },
      { property: "og:description", content: "Số hoá phiếu hỏng hóc và liên kết chuỗi truy vết linh kiện." },
    ],
  }),
  component: HongHocPage,
});

import { getPhuongAnHongHocToken } from "@/lib/mirats/ui/status-tokens";




function HongHocPage() {
  const { hongHoc, donVi, thietBi } = useScope();
  const { roles } = useSession();
  const canManage = canManageHongHoc(roles);
  const qc = useQueryClient();
  const [editing, setEditing] = useState<HongHocThayThe | null>(null);
  const [tab, setTab] = useState("phieu");
  const [query, setQuery] = useState("");
  const [dv, setDv] = useState("all");
  const [pa, setPa] = useState("all");
  const [tt, setTt] = useState("all");

  const thietBiMap = useMemo(() => new Map(thietBi.map((t) => [t.ma_thiet_bi, t])), [thietBi]);
  const donViMap = useMemo(() => new Map(donVi.map((d) => [d.ma, d])), [donVi]);


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hongHoc.filter((h) => {
      const tb = thietBiMap.get(h.thiet_bi_hong);
      if (dv !== "all" && tb?.don_vi !== dv) return false;
      if (pa !== "all" && h.phuong_an !== pa) return false;
      if (tt !== "all" && normalizeLegacy("hong_hoc", h.trang_thai) !== tt) return false;
      if (!q) return true;
      return (
        h.ma_hong_hoc.toLowerCase().includes(q) ||
        h.thiet_bi_hong.toLowerCase().includes(q) ||
        h.bo_phan_hong.toLowerCase().includes(q) ||
        (tb?.ten.toLowerCase().includes(q) ?? false)
      );
    }).sort((a, b) => b.ngay_hong.localeCompare(a.ngay_hong));
  }, [query, dv, pa, tt, hongHoc, thietBiMap]);

  const stats = useMemo(() => {
    let mo = 0, thay = 0, chi_phi = 0;
    for (const h of filtered) {
      if (h.trang_thai !== "Hoàn thành") mo++;
      if (h.phuong_an === "Thay thế") thay++;
      if (h.trang_thai === "Hoàn thành") chi_phi += h.chi_phi;
    }
    return { total: filtered.length, mo, thay, chi_phi };
  }, [filtered]);

  const columns: StdColumn<HongHocThayThe>[] = useMemo(() => {
    const base: StdColumn<HongHocThayThe>[] = [
      {
        key: "ma_hong_hoc", label: "Mã HH", filter: "text", sortable: true,
        value: (h) => h.ma_hong_hoc,
        cell: (h) => (
          <Link to="/hong-hoc/$maHongHoc" params={{ maHongHoc: h.ma_hong_hoc }} className="font-mono text-xs text-primary hover:underline">
            {h.ma_hong_hoc}
          </Link>
        ),
      },
      {
        key: "ngay_hong", label: "Ngày", sortable: true, hideBelow: "xl",
        value: (h) => h.ngay_hong,
        cell: (h) => <span className="whitespace-nowrap text-xs text-muted-foreground">{h.ngay_hong}</span>,
      },
      {
        key: "thiet_bi_hong", label: "Tài sản hỏng", filter: "text",
        value: (h) => thietBiMap.get(h.thiet_bi_hong)?.ten ?? h.thiet_bi_hong,
        cell: (h) => {
          const tb = thietBiMap.get(h.thiet_bi_hong);
          const dvo = tb ? donViMap.get(tb.don_vi) : null;
          return tb ? (
            <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tb.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="text-primary hover:underline">
              <div className="font-medium">{tb.ten}</div>
              <div className="text-xs font-mono text-muted-foreground">{tb.ma_thiet_bi} · {dvo?.ma}</div>
            </Link>
          ) : <span className="text-xs text-muted-foreground">{h.thiet_bi_hong}</span>;
        },
      },
      {
        key: "bo_phan_hong", label: "Bộ phận", filter: "text",
        value: (h) => h.bo_phan_hong,
        cell: (h) => <span className="text-sm">{h.bo_phan_hong}</span>,
      },
      {
        key: "phuong_an", label: "Phương án", filter: "cat", hideBelow: "sm",
        value: (h) => h.phuong_an,
        cell: (h) => <Badge variant="secondary" className={getPhuongAnHongHocToken(h.phuong_an)?.class}>{h.phuong_an}</Badge>,
      },
      {
        key: "thay_the", label: "Thay bằng", hideBelow: "2xl",
        value: (h) => (h.thiet_bi_thay_the ? thietBiMap.get(h.thiet_bi_thay_the)?.ma_thiet_bi ?? "" : ""),
        cell: (h) => {
          const tbT = h.thiet_bi_thay_the ? thietBiMap.get(h.thiet_bi_thay_the) : null;
          return tbT ? (
            <Link to="/thiet-bi/$maThietBi" params={{ maThietBi: tbT.ma_thiet_bi }} search={{ tab: "tong-quan", doc: undefined, q: undefined }} className="flex items-center gap-1 text-primary hover:underline">
              <ArrowRight className="h-3 w-3" /><span className="font-mono text-xs">{tbT.ma_thiet_bi}</span>
            </Link>
          ) : <span className="text-xs text-muted-foreground">—</span>;
        },
      },
      {
        key: "chi_phi", label: "Chi phí", align: "right", sortable: true, hideBelow: "2xl",
        value: (h) => h.chi_phi,
        sortValue: (h) => h.chi_phi,
        cell: (h) => <span className="text-right text-sm tabular-nums">{fmtVND(h.chi_phi)}</span>,
      },
      {
        key: "trang_thai", label: "Trạng thái", filter: "cat", hideBelow: "sm",
        value: (h) => h.trang_thai,
        cell: (h) => <StatusBadge domain="hong_hoc" code={h.trang_thai} />,
      },
    ];
    if (canManage) {
      base.push({
        key: "actions", label: "", align: "right",
        cell: (h) => isHongHocOpen(h.trang_thai) ? (
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setEditing(h); }}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Sửa
          </Button>
        ) : null,
      });
    }
    return base;
  }, [thietBiMap, donViMap, canManage]);


  return (
    <PageFrame density="compact">
      <PageHeader
        icon={Replace}
        title="Hỏng hóc & Thay thế"
        help="Lập phiếu hỏng hóc–thay thế, truy vết tài sản cũ sang mới và xuất kho vật tư kèm theo."
        actions={
          canManage ? (
            <Button asChild size="sm" className="h-8">
              <Link to="/hong-hoc/moi"><Plus className="mr-1 h-4 w-4" /> Tạo phiếu</Link>
            </Button>
          ) : null
        }
      />

      <PageBody className="space-y-4">



      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Replace} label="Phiếu hỏng hóc" value={stats.total} tone="text-foreground/70" />
        <Kpi icon={AlertTriangle} label="Đang xử lý" value={stats.mo} tone="text-amber-600 dark:text-amber-400" />
        <Kpi icon={Replace} label="Thay thế linh kiện" value={stats.thay} tone="text-sky-600 dark:text-sky-400" />
        <Kpi icon={DollarSign} label="Chi phí sửa/thay" value={`${fmtVND(stats.chi_phi)} đ`} tone="text-emerald-600 dark:text-emerald-400" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="phieu">Phiếu hỏng hóc</TabsTrigger>
        </TabsList>


        <TabsContent value="phieu" className="mt-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Danh sách phiếu</CardTitle>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <div className="relative col-span-2 lg:col-span-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mã HH, TB, bộ phận..." className="pl-9 lg:w-56" />
                  </div>
                  <Combobox
                    className="w-[180px]"
                    value={dv}
                    onChange={(v) => setDv(v)}
                    placeholder="Đơn vị"
                    searchPlaceholder="Tìm đơn vị…"
                    options={[{ value: "all", label: "Tất cả đơn vị" }, ...donVi.filter((d) => d.ma !== "CTY").map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))]}
                  />
                  <Select value={pa} onValueChange={(v) => setPa(v)}>
                    <SelectTrigger><SelectValue placeholder="Phương án" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi phương án</SelectItem>
                      {["Sửa chữa", "Thay thế", "Thanh lý"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={tt} onValueChange={(v) => setTt(v)}>
                    <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Mọi trạng thái</SelectItem>
                      {statuses("hong_hoc").map((s) => <SelectItem key={s.code} value={s.code}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <StandardTable
                tableKey="hong_hoc_phieu_list"
                columns={columns}
                rows={filtered}
                getRowId={(h) => h.ma_hong_hoc}
                emptyContent={<div className="py-10 text-center text-muted-foreground">Không có phiếu phù hợp.</div>}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      <EditDialog row={editing} onClose={() => setEditing(null)} onDone={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["operations_data"] }); }} />
      </PageBody>
    </PageFrame>
  );
}

function EditDialog({ row, onClose, onDone }: { row: HongHocThayThe | null; onClose: () => void; onDone: () => void }) {
  const [phuongAn, setPhuongAn] = useState<string>(row?.phuong_an ?? "");
  const [thayTheId, setThayTheId] = useState<string>(row?.thiet_bi_thay_the_id ?? "");
  const [moTa, setMoTa] = useState<string>(row?.mo_ta_hong_hoc ?? "");

  useMemo(() => {
    setPhuongAn(row?.phuong_an ?? "");
    setThayTheId(row?.thiet_bi_thay_the_id ?? "");
    setMoTa(row?.mo_ta_hong_hoc ?? "");
    return null;
  }, [row]);

  const saveEdit = useMutation({
    mutationFn: async () => {
      if (!row) return;
      const { error } = await supabase.from("hong_hoc").update({
        phuong_an: phuongAn || null,
        thiet_bi_thay_the_id: thayTheId || null,
        mo_ta_hong_hoc: moTa,
      }).eq("id", row.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã cập nhật phiếu"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const complete = useMutation({
    mutationFn: async () => {
      if (!row) return;
      // Đảm bảo phần sửa nháp đã ghi trước khi RPC hoàn thành đọc lại phiếu.
      if (phuongAn !== row.phuong_an || thayTheId !== (row.thiet_bi_thay_the_id ?? "")) {
        const { error: upErr } = await supabase.from("hong_hoc").update({
          phuong_an: phuongAn || null,
          thiet_bi_thay_the_id: thayTheId || null,
          mo_ta_hong_hoc: moTa,
        }).eq("id", row.id);
        if (upErr) throw upErr;
      }
      const { error } = await supabase.rpc("hoan_thanh_hong_hoc", { _id: row.id });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã hoàn thành phiếu hỏng hóc"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const canComplete = canCompleteHongHoc({ phuong_an: phuongAn, thiet_bi_thay_the_id: thayTheId || null });
  const paNorm = normalizePhuongAn(phuongAn);

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Sửa phiếu {row?.ma_hong_hoc}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Phương án</Label>
            <Select value={phuongAn} onValueChange={setPhuongAn}>
              <SelectTrigger><SelectValue placeholder="Chọn phương án" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Sửa chữa">Sửa chữa</SelectItem>
                <SelectItem value="Thay thế">Thay thế</SelectItem>
                <SelectItem value="Thanh lý">Thanh lý</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {paNorm === "thay_the" && (
            <div>
              <Label>Tài sản thay thế (UUID/Mã)</Label>
              <Input value={thayTheId} onChange={(e) => setThayTheId(e.target.value)} placeholder="Nhập mã tài sản hoặc UUID" />
              <p className="mt-1 text-xs text-muted-foreground">Cần chọn tài sản thay thế trước khi hoàn thành phiếu.</p>
              {row?.vat_tu_su_dung && row.vat_tu_su_dung.length > 0 && (
                <div className="mt-2 rounded bg-muted/50 p-2 text-[10px] text-muted-foreground">
                  <div className="font-semibold uppercase">Dữ liệu cũ (Legacy):</div>
                  <ul className="list-inside list-disc">
                    {row.vat_tu_su_dung.map((v, i) => <li key={i}>{v}</li>)}
                  </ul>
                </div>
              )}

            </div>
          )}
          <div>
            <Label>Mô tả</Label>
            <Textarea rows={3} value={moTa} onChange={(e) => setMoTa(e.target.value)} />
          </div>
          {row && (
            <div className="rounded-md border p-3">
              <VatTuTieuHaoInline lienKet={{ hongHocId: row.id }} />
              <p className="mt-1 text-[11px] text-muted-foreground">Ghi xuất trước khi bấm Hoàn thành để tồn kho phản ánh đúng.</p>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button variant="secondary" onClick={() => saveEdit.mutate()} disabled={saveEdit.isPending}>
            {saveEdit.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Lưu
          </Button>
          <Button onClick={() => complete.mutate()} disabled={!canComplete || complete.isPending}>
            {complete.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
            Hoàn thành
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string | number; tone?: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted"><Icon className={`h-5 w-5 ${tone ?? "text-foreground/70"}`} /></div>
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wide text-muted-foreground truncate">{label}</div>
          <div className={`text-xl font-semibold tabular-nums ${tone ?? ""}`}>{typeof value === "number" ? value.toLocaleString("vi-VN") : value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
