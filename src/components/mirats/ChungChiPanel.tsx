// ============================================================================
// Task 48 — Panel Kiểm định / Hiệu chuẩn cho trang chi tiết tài sản.
// - Đọc chứng chỉ qua useChungChiByDevice (Task 47 data).
// - Thêm/sửa qua dialog + validateChungChi (Task 47 pure logic).
// - Người có quyền theo canWrite('thiet_bi') mới thấy nút thêm.
// ============================================================================
import * as React from "react";
import { Plus, ShieldCheck, Loader2, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ExpiringBadge } from "@/components/mirats/ExpiringBadge";
import { fmtNgay } from "@/lib/mirats/format";
import {
  validateChungChi, trangThaiHetHan,
  LOAI_CHUNG_NHAN, type LoaiChungNhan,
} from "@/lib/mirats/kiem-dinh";
import {
  useChungChiByDevice, useInvalidateChungChi, type ChungChiRow,
} from "@/lib/mirats/db-chung-chi";
import { canWrite } from "@/lib/mirats/quyen";
import type { AppRole } from "@/hooks/use-session";

interface Props {
  thietBiId: string;
  cheDo?: string | null;
  roles?: readonly AppRole[] | null;
  compact?: boolean;
}

export function ChungChiPanel({ thietBiId, cheDo, roles, compact }: Props) {
  const { data, isLoading } = useChungChiByDevice(thietBiId);
  const invalidate = useInvalidateChungChi();
  const [editing, setEditing] = React.useState<ChungChiRow | null>(null);
  const [open, setOpen] = React.useState(false);
  const writable = canWrite("thiet_bi", roles ?? null);
  const showAdd = writable && cheDo && cheDo !== "KHONG";

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(cc: ChungChiRow) {
    setEditing(cc);
    setOpen(true);
  }
  async function xoa(cc: ChungChiRow) {
    if (!confirm(`Xoá chứng chỉ ${cc.so_giay_chung_nhan}?`)) return;
    const { error } = await supabase.from("chung_chi_thiet_bi").delete().eq("id", cc.id);
    if (error) return toast.error(error.message);
    toast.success("Đã xoá chứng chỉ");
    invalidate();
  }

  const rows = data ?? [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Kiểm định / Hiệu chuẩn
          {cheDo && cheDo !== "KHONG" && (
            <Badge variant="outline" className="ml-2 text-meta">
              {cheDo === "KIEM_DINH" ? "KĐ" : "HC"}
            </Badge>
          )}
        </div>
        {showAdd && (
          <Button size="sm" variant="outline" onClick={openNew}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm chứng chỉ
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang tải…
        </div>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {cheDo === "KHONG" || !cheDo
            ? "Tài sản không thuộc diện KĐ/HC."
            : "Chưa có chứng chỉ nào."}
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => {
            const tt = trangThaiHetHan(c.ngay_het_han);
            return (
              <li key={c.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      <span className="font-mono font-medium">{c.so_giay_chung_nhan}</span>
                      <Badge variant="outline" className="text-meta">
                        {c.loai === "KIEM_DINH" ? "KĐ" : "HC"}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.ngay_bat_dau && <>Từ {fmtNgay(c.ngay_bat_dau)} </>}
                      {c.ngay_het_han && <>→ {fmtNgay(c.ngay_het_han)}</>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {c.ngay_het_han && <ExpiringBadge soNgay={tt.soNgay} />}
                    {writable && !compact && (
                      <>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(c)} aria-label="Sửa">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => xoa(c)} aria-label="Xoá">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ChungChiDialog
        open={open}
        onOpenChange={setOpen}
        thietBiId={thietBiId}
        cheDo={cheDo}
        editing={editing}
        onSaved={invalidate}
      />
    </div>
  );
}

function ChungChiDialog({
  open, onOpenChange, thietBiId, cheDo, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  thietBiId: string;
  cheDo?: string | null;
  editing: ChungChiRow | null;
  onSaved: () => void;
}) {
  const defaultLoai: LoaiChungNhan =
    editing?.loai
      ?? (cheDo === "HIEU_CHUAN" ? "HIEU_CHUAN" : "KIEM_DINH");
  const [loai, setLoai] = React.useState<LoaiChungNhan>(defaultLoai);
  const [so, setSo] = React.useState(editing?.so_giay_chung_nhan ?? "");
  const [batDau, setBatDau] = React.useState(editing?.ngay_bat_dau ?? "");
  const [hetHan, setHetHan] = React.useState(editing?.ngay_het_han ?? "");
  const [ghiChu, setGhiChu] = React.useState(editing?.ghi_chu ?? "");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setLoai(editing?.loai ?? (cheDo === "HIEU_CHUAN" ? "HIEU_CHUAN" : "KIEM_DINH"));
      setSo(editing?.so_giay_chung_nhan ?? "");
      setBatDau(editing?.ngay_bat_dau ?? "");
      setHetHan(editing?.ngay_het_han ?? "");
      setGhiChu(editing?.ghi_chu ?? "");
    }
  }, [open, editing, cheDo]);

  async function luu() {
    const payload = {
      thiet_bi_id: thietBiId,
      loai,
      so_giay_chung_nhan: so.trim(),
      ngay_bat_dau: batDau || null,
      ngay_het_han: hetHan || null,
    };
    const kt = validateChungChi(payload);
    if (!kt.hopLe) return toast.error(kt.loi.join("; "));
    setBusy(true);
    try {
      const full = { ...payload, ghi_chu: ghiChu || null };
      const { error } = editing
        ? await supabase.from("chung_chi_thiet_bi").update(full).eq("id", editing.id)
        : await supabase.from("chung_chi_thiet_bi").insert(full);
      if (error) throw error;
      toast.success(editing ? "Đã cập nhật chứng chỉ" : "Đã thêm chứng chỉ");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được chứng chỉ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Sửa chứng chỉ" : "Thêm chứng chỉ KĐ/HC"}</DialogTitle>
          <DialogDescription>Nhập thông tin giấy chứng nhận kiểm định hoặc hiệu chuẩn.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-1.5">
            <Label>Loại</Label>
            <Select value={loai} onValueChange={(v) => setLoai(v as LoaiChungNhan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOAI_CHUNG_NHAN.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l === "KIEM_DINH" ? "Kiểm định" : "Hiệu chuẩn"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Số giấy chứng nhận *</Label>
            <Input value={so} onChange={(e) => setSo(e.target.value)} placeholder="VD: KĐ/2026/001" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Ngày bắt đầu</Label>
              <Input type="date" value={batDau ?? ""} onChange={(e) => setBatDau(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Ngày hết hạn</Label>
              <Input type="date" value={hetHan ?? ""} onChange={(e) => setHetHan(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Ghi chú</Label>
            <Input value={ghiChu ?? ""} onChange={(e) => setGhiChu(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>Huỷ</Button>
          <Button onClick={luu} disabled={busy}>
            {busy && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Lưu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
