import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Network, Loader2, Pencil, Boxes, Trash2, Power, PowerOff, Wrench } from "lucide-react";
import { StandardTable } from "@/components/mirats/StandardTable";
import { PageHeader } from "@/components/mirats/PageHeader";
import { UI_DENSITY } from "@/lib/mirats/ui/ui-density";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ResponsiveDialog } from "@/components/mirats/ResponsiveDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/backend/client";
import { renameEntity } from "@/lib/mirats/rename-entity";
import { useDbTaxonomy, invalidateTaxonomy } from "@/lib/mirats/db-taxonomy";
import { useScope } from "@/lib/mirats/scope";
import { useSession } from "@/hooks/use-session";
import { useUserPref } from "@/hooks/use-user-pref";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/danh-muc/he-thong")({
  head: () => ({
    meta: [
      { title: "Hệ thống — Danh mục MIRATS" },
      { name: "description", content: "Danh mục hệ thống kỹ thuật đọc trực tiếp từ cơ sở dữ liệu." },
    ],
  }),
  component: HeThongPage,
});

type Row = {
  id: string;
  ma: string;
  ten: string;
  phanLoai: string;
  
  donVi: string;
  gpSo: string;
  soTb: number;
};

function HeThongPage() {
  const { scopeAll, donViCode } = useScope();
  const { data, isLoading, error } = useDbTaxonomy();
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Row | null>(null);
  // Chế độ chỉnh sửa: BẬT mới hiện chọn dòng, nút xoá và các action hàng loạt.
  const [editMode, setEditMode] = useUserPref<boolean>("danh-muc-ht:edit-mode", false);
  const editOn = canManage && editMode;
  const [delTargets, setDelTargets] = useState<Row[] | null>(null);
  const [delReason, setDelReason] = useState("");

  const rows = useMemo<Row[]>(() => {
    if (!data) return [];
    const dvId = data.donViList.find((d) => d.ma === donViCode)?.id ?? null;
    const dvNameMap = new Map(data.donViList.map((d) => [d.id, d.ten]));
    const plNameMap = new Map(data.plList.map((p) => [p.id, p.ten]));
    const tbCount = new Map<string, number>();
    for (const t of data.devices) {
      if (!scopeAll && (!donViCode || t.don_vi !== donViCode)) continue;
      tbCount.set(t._htId, (tbCount.get(t._htId) ?? 0) + 1);
    }
    return data.htList
      .filter((h) => scopeAll || (!!dvId && h.donViId === dvId))
      .map((h) => ({
        id: h.id,
        ma: h.ma,
        ten: h.ten,
        phanLoai: plNameMap.get(h.nhomId) ?? "(Chưa phân loại)",
        donVi: dvNameMap.get(h.donViId) ?? "—",
        gpSo: h.gpSo ?? "",
        soTb: tbCount.get(h.id) ?? 0,
      }))
      .sort((a, b) => b.soTb - a.soTb);
  }, [data, scopeAll, donViCode]);

  const delMut = useMutation({
    mutationFn: async (list: Row[]) => {
      const removable = list.filter((r) => r.soTb === 0);
      const blocked = list.length - removable.length;
      if (removable.length === 0) throw new Error("Các hệ thống đã chọn đều còn tài sản — không thể xoá.");
      for (const r of removable) {
        const { error } = await supabase.rpc("dm_xoa_an_toan" as never, { _bang: "dm_he_thong", _id: r.id } as never);
        if (error) throw error;
      }
      return { deleted: removable.length, blocked };
    },
    onSuccess: ({ deleted, blocked }) => {
      invalidateTaxonomy(qc);
      setDelTargets(null); setDelReason("");
      toast.success(`Đã xoá ${deleted} hệ thống${blocked ? ` · bỏ qua ${blocked} còn tài sản` : ""}.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const toggleActiveMut = useMutation({
    mutationFn: async ({ list, active }: { list: Row[]; active: boolean }) => {
      const { error } = await supabase.from("dm_he_thong").update({ active }).in("id", list.map((r) => r.id));
      if (error) throw error;
      return list.length;
    },
    onSuccess: (n, vars) => {
      invalidateTaxonomy(qc);
      toast.success(`Đã ${vars.active ? "kích hoạt" : "tạm dừng"} ${n} hệ thống.`);
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div className={`space-y-4 ${UI_DENSITY.PAGE_PADDING}`}>
      <PageHeader
        icon={Network}
        title="Danh mục hệ thống"
        subtitle={`${rows.length.toLocaleString("vi-VN")} hệ thống`}
        description={
          <>
            Dữ liệu thật từ cơ sở dữ liệu. Cấu trúc cây (nhóm/tài sản) chỉnh sửa tại{" "}
            <span className="font-medium">Hệ Thống tài sản</span>.
          </>
        }
        actions={
          canManage ? (
            <label className="inline-flex items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-xs">
              <Wrench className={`h-3.5 w-3.5 ${editOn ? "text-primary" : "text-muted-foreground"}`} />
              Chế độ chỉnh sửa
              <Switch checked={editMode} onCheckedChange={setEditMode} />
            </label>
          ) : null
        }
      />


      {error && <div className="text-sm text-destructive">Lỗi tải dữ liệu: {(error as Error).message}</div>}

      {!error && (
        <StandardTable<Row>
          tableKey="catalog:dm_he_thong"
          trangThai={{ dangTai: isLoading }}
          rows={rows}
          getRowId={(r) => r.id}
          emptyText="Không có hệ thống phù hợp."
          countUnit="hệ thống"
          selectable={editOn}
          bulkActions={editOn ? ({ selectedRows, clear }) => (
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => toggleActiveMut.mutate({ list: selectedRows, active: true })}>
                <Power className="h-3.5 w-3.5" /> Kích hoạt
              </Button>
              <Button size="sm" variant="outline" className="h-7 gap-1" onClick={() => toggleActiveMut.mutate({ list: selectedRows, active: false })}>
                <PowerOff className="h-3.5 w-3.5" /> Tạm dừng
              </Button>
              <Button size="sm" variant="destructive" className="h-7 gap-1" onClick={() => setDelTargets(selectedRows)}>
                <Trash2 className="h-3.5 w-3.5" /> Xoá ({selectedRows.length})
              </Button>
              <Button size="sm" variant="ghost" className="h-7" onClick={clear}>Bỏ chọn</Button>
            </div>
          ) : undefined}
          columns={[
            { key: "ma", label: "Mã", minW: "min-w-[110px]", filter: "text", value: (r) => r.ma,
              cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.ma || "—"}</span> },
            { key: "ten", label: "Tên hệ thống", minW: "min-w-[240px]", filter: "text", value: (r) => r.ten,
              cell: (r) => <span className="font-medium">{r.ten}</span> },
            { key: "phanLoai", label: "Phân loại nhóm", minW: "min-w-[180px]", filter: "cat", value: (r) => r.phanLoai },
            { key: "donVi", label: "Đơn vị", minW: "min-w-[180px]", filter: "cat", value: (r) => r.donVi },
            { key: "gpSo", label: "Giấy phép", minW: "min-w-[120px]", filter: "text", value: (r) => r.gpSo,
              cell: (r) => r.gpSo ? <span className="font-mono text-xs text-muted-foreground">{r.gpSo}</span> : <span className="text-xs text-muted-foreground">—</span> },
            { key: "soTb", label: "Tài sản", align: "center", value: (r) => r.soTb,
              cell: (r) => r.soTb > 0
                ? <Badge variant="secondary" className="gap-1 text-[11px]"><Boxes className="h-3 w-3" /> {r.soTb.toLocaleString("vi-VN")}</Badge>
                : <span className="text-xs text-muted-foreground">0</span> },
            ...(canManage ? [{
              key: "actions", label: "", align: "right" as const,
              cell: (r: Row) => (
                <div className="flex items-center justify-end gap-0.5 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <Button size="icon" variant="ghost" aria-label="Chỉnh sửa hệ thống" className="h-7 w-7" onClick={() => setEditing(r)} title="Sửa thông tin">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {editOn && (
                    <Button
                      size="icon" variant="ghost" aria-label="Xoá hệ thống"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDelTargets([r])}
                      title={r.soTb > 0 ? `Còn ${r.soTb} tài sản — không thể xoá` : "Xoá hệ thống"}
                      disabled={r.soTb > 0}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ),
            }] : []),
          ]}
        />
      )}

      {editing && (
        <HeThongDialog row={editing} onClose={() => setEditing(null)} />
      )}

      <AlertDialog open={!!delTargets} onOpenChange={(o) => { if (!o) { setDelTargets(null); setDelReason(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá hệ thống?</AlertDialogTitle>
            <AlertDialogDescription>
              Sẽ xoá <b>{delTargets?.filter((r) => r.soTb === 0).length ?? 0}</b> hệ thống chưa có tài sản.
              {delTargets && delTargets.some((r) => r.soTb > 0) && (
                <> Bỏ qua <b>{delTargets.filter((r) => r.soTb > 0).length}</b> hệ thống còn tài sản.</>
              )}
              {" "}Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1">
            <Label htmlFor="ht-del-reason">Lý do (tuỳ chọn)</Label>
            <Textarea id="ht-del-reason" rows={2} value={delReason} onChange={(e) => setDelReason(e.target.value)} placeholder="VD: nhập nhầm, gộp vào hệ thống khác…" />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={delMut.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              disabled={delMut.isPending || !delTargets?.length}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => { e.preventDefault(); if (delTargets) delMut.mutate(delTargets); }}
            >
              {delMut.isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />} Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function HeThongDialog({ row, onClose }: { row: Row; onClose: () => void }) {
  const qc = useQueryClient();
  const [ten, setTen] = useState(row.ten);
  const [moTa, setMoTa] = useState("");
  const [gpSo, setGpSo] = useState(row.gpSo);
  const [active, setActive] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Nạp mô tả & trạng thái từ dm_he_thong khi mở.
  useEffect(() => {
    let cancelled = false;
    supabase.from("dm_he_thong").select("mo_ta,active").eq("id", row.id).single().then(({ data }) => {
      if (cancelled || !data) return;
      setMoTa((data as { mo_ta: string | null }).mo_ta ?? "");
      setActive((data as { active: boolean }).active ?? true);
      setLoaded(true);
    });
    return () => { cancelled = true; };
  }, [row.id]);

  async function save() {
    if (!ten.trim()) { toast.error("Vui lòng nhập tên hệ thống."); return; }
    setSaving(true);
    try {
      // Đổi tên qua SSoT chung (ghi thẳng dm_he_thong.ten).
      await renameEntity({ kind: "ht", id: row.id, ten: ten.trim() });
      const { error } = await supabase
        .from("dm_he_thong")
        .update({ mo_ta: moTa.trim() || null, gp_so: gpSo.trim() || null, active })
        .eq("id", row.id);
      if (error) throw error;
      toast.success("Đã cập nhật hệ thống.");
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      onClose();
    } catch (e) {
      toast.error("Lưu thất bại: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveDialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Sửa hệ thống"
      description="Chỉnh thông tin cơ bản. Cấu trúc cây (nhóm, lĩnh vực, tài sản) được quản lý tại Hệ Thống tài sản."
      className="max-w-md"
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Tên hệ thống *</Label>
          <Input value={ten} onChange={(e) => setTen(e.target.value)} autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Số giấy phép</Label>
          <Input value={gpSo} onChange={(e) => setGpSo(e.target.value)} className="font-mono" placeholder="VD: GP-123/…" />
        </div>
        <div className="space-y-1.5">
          <Label>Mô tả</Label>
          <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={2} disabled={!loaded} placeholder={loaded ? "Ghi chú (không bắt buộc)…" : "Đang tải…"} />
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={setActive} id="ht-active" disabled={!loaded} />
          <Label htmlFor="ht-active" className="cursor-pointer">Đang sử dụng</Label>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button variant="outline" onClick={onClose} disabled={saving}>Huỷ</Button>
        <Button onClick={save} disabled={saving} className="gap-1.5">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
        </Button>
      </DialogFooter>
    </ResponsiveDialog>
  );
}
