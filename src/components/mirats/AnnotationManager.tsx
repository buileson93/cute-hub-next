// Task: dialog quản trị ghi chú/mốc sự kiện hiển thị trên biểu đồ Xu hướng
// (trang /bao-cao/do-tin-cay). Thêm/sửa/xoá ghi chú với `thoi_diem`, `loai`,
// `tieu_de`, `mo_ta`. RLS: `admin`/`phong_kt` được thao tác, người khác chỉ
// sửa/xoá ghi chú của chính mình.
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, StickyNote } from "lucide-react";

export type AnnotationLoai = "bao_tri" | "su_co" | "thay_doi" | "ghi_chu";

export type Annotation = {
  id: string;
  thoi_diem: string;
  tieu_de: string;
  mo_ta: string | null;
  loai: AnnotationLoai;
  mau: string | null;
  he_thong_id: string | null;
  tao_boi: string | null;
  tao_luc: string;
};

export const LOAI_META: Record<AnnotationLoai, { label: string; color: string }> = {
  bao_tri: { label: "Bảo trì", color: "#0ea5e9" },
  su_co: { label: "Sự cố", color: "#ef4444" },
  thay_doi: { label: "Thay đổi", color: "#f59e0b" },
  ghi_chu: { label: "Ghi chú", color: "#6b7280" },
};

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function fromLocalInput(v: string): string {
  return new Date(v).toISOString();
}

export function AnnotationManager({
  items,
  isLoading,
  onChanged,
}: {
  items: Annotation[];
  isLoading: boolean;
  onChanged: () => void;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Annotation | null>(null);
  const [form, setForm] = useState<{
    thoi_diem: string;
    tieu_de: string;
    mo_ta: string;
    loai: AnnotationLoai;
  }>({
    thoi_diem: toLocalInput(new Date().toISOString()),
    tieu_de: "",
    mo_ta: "",
    loai: "ghi_chu",
  });
  const [saving, setSaving] = useState(false);

  function resetForm() {
    setEditing(null);
    setForm({
      thoi_diem: toLocalInput(new Date().toISOString()),
      tieu_de: "",
      mo_ta: "",
      loai: "ghi_chu",
    });
  }

  function edit(a: Annotation) {
    setEditing(a);
    setForm({
      thoi_diem: toLocalInput(a.thoi_diem),
      tieu_de: a.tieu_de,
      mo_ta: a.mo_ta ?? "",
      loai: a.loai,
    });
  }

  async function save() {
    if (!form.tieu_de.trim()) {
      toast.error("Nhập tiêu đề ghi chú");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        thoi_diem: fromLocalInput(form.thoi_diem),
        tieu_de: form.tieu_de.trim(),
        mo_ta: form.mo_ta.trim() || null,
        loai: form.loai,
        mau: LOAI_META[form.loai].color,
      };
      if (editing) {
        const { error } = await supabase
          .from("bao_cao_annotation")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Đã cập nhật ghi chú");
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase
          .from("bao_cao_annotation")
          .insert({ ...payload, tao_boi: u.user?.id ?? null });
        if (error) throw error;
        toast.success("Đã thêm ghi chú");
      }
      resetForm();
      onChanged();
      await qc.invalidateQueries({ queryKey: ["reliability-annotations"] });
    } catch (err) {
      toast.error("Lưu thất bại", { description: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function remove(a: Annotation) {
    if (!confirm(`Xoá ghi chú "${a.tieu_de}"?`)) return;
    const { error } = await supabase.from("bao_cao_annotation").delete().eq("id", a.id);
    if (error) {
      toast.error("Xoá thất bại", { description: error.message });
      return;
    }
    toast.success("Đã xoá");
    if (editing?.id === a.id) resetForm();
    onChanged();
    await qc.invalidateQueries({ queryKey: ["reliability-annotations"] });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <StickyNote className="h-3.5 w-3.5" />
          Ghi chú <Badge variant="secondary" className="ml-1">{items.length}</Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ghi chú trên biểu đồ</DialogTitle>
          <DialogDescription>
            Ghim mốc bảo trì lớn, sự cố hoặc thay đổi cấu hình lên chart Xu hướng để đối chiếu.
            Đường dọc màu tương ứng sẽ hiện tại thời điểm ghi chú.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">Thời điểm</Label>
            <Input
              type="datetime-local"
              value={form.thoi_diem}
              onChange={(e) => setForm({ ...form, thoi_diem: e.target.value })}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <Label className="text-xs">Loại</Label>
            <Select
              value={form.loai}
              onValueChange={(v) => setForm({ ...form, loai: v as AnnotationLoai })}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(LOAI_META) as AnnotationLoai[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ background: LOAI_META[k].color }}
                      />
                      {LOAI_META[k].label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Tiêu đề</Label>
            <Input
              value={form.tieu_de}
              onChange={(e) => setForm({ ...form, tieu_de: e.target.value })}
              placeholder="VD: Thay module BITE MSSR – ADS-B Đà Nẵng"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Mô tả (tuỳ chọn)</Label>
            <Textarea
              rows={2}
              value={form.mo_ta}
              onChange={(e) => setForm({ ...form, mo_ta: e.target.value })}
              placeholder="Ghi chú thêm cho người xem báo cáo"
            />
          </div>
          <div className="col-span-2 flex items-center justify-end gap-2">
            {editing && (
              <Button variant="ghost" size="sm" onClick={resetForm}>Huỷ sửa</Button>
            )}
            <Button size="sm" onClick={save} loading={saving} className="gap-1.5">
              {editing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {editing ? "Cập nhật" : "Thêm ghi chú"}
            </Button>
          </div>
        </div>

        <div className="mt-2 max-h-64 overflow-auto rounded border">
          {isLoading ? (
            <div className="p-4 text-sm text-muted-foreground">Đang tải…</div>
          ) : !items.length ? (
            <div className="p-4 text-sm text-muted-foreground">Chưa có ghi chú trong khoảng thời gian đang xem.</div>
          ) : (
            <ul className="divide-y">
              {items.map((a) => (
                <li key={a.id} className="flex items-start justify-between gap-2 p-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: a.mau ?? LOAI_META[a.loai].color }}
                      />
                      <span>{LOAI_META[a.loai].label}</span>
                      <span>·</span>
                      <span>{new Date(a.thoi_diem).toLocaleString("vi-VN")}</span>
                    </div>
                    <div className="mt-0.5 truncate text-sm font-medium">{a.tieu_de}</div>
                    {a.mo_ta && <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.mo_ta}</div>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => edit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => remove(a)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Với mỗi annotation, tìm bucket_start (label) gần nhất trong trendData để
 * ReferenceLine của Recharts (dùng category axis) có chỗ neo. Trả về mảng
 * { label, ...annotation } đã lọc bỏ những cái ngoài khung.
 */
export function mapAnnotationsToBuckets(
  items: Annotation[],
  bucketStarts: { label: string; bucket_start: string }[],
): Array<Annotation & { label: string }> {
  if (!bucketStarts.length) return [];
  const starts = bucketStarts.map((b) => new Date(b.bucket_start).getTime());
  const min = starts[0];
  const max = starts[starts.length - 1];
  const out: Array<Annotation & { label: string }> = [];
  for (const a of items) {
    const t = new Date(a.thoi_diem).getTime();
    if (t < min || t > max + 86_400_000 * 31) continue;
    let bestIdx = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < starts.length; i += 1) {
      const diff = Math.abs(starts[i] - t);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIdx = i;
      }
    }
    out.push({ ...a, label: bucketStarts[bestIdx].label });
  }
  return out;
}
