// ============================================================================
// GiayPhepFormDialog — form tạo/sửa giấy phép (device-scoped `giay_phep`).
// Chỉ phục vụ nhánh `nguon === "giay_phep"`. GPKT (`giay_phep_khai_thac`)
// nhập qua template Excel All-in-one và không sửa trực tiếp ở đây.
// Quyền ghi khớp RLS `giay_phep_write_manager` = `can_manage_equipment`
// (admin | phong_kt). Guard UI đọc từ `useSession().hasRole`.
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/mirats/Combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import type { LicenseRow } from "@/lib/mirats/db-licenses";
import { saveGpktRecord } from "@/lib/mirats/gpkt-import.functions";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Null = tạo mới. Truyền vào để sửa. */
  row: LicenseRow | null;
}

interface OptionRow { id: string; ma: string | null; ten: string | null; }

async function fetchOptions(table: "dm_loai_giay_phep" | "dm_noi_cap"): Promise<OptionRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("id, ma, ten")
    .eq("active", true)
    .order("thu_tu", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as OptionRow[];
}

async function fetchThietBiOptions(): Promise<{ id: string; ma_thiet_bi: string; ten_thiet_bi: string | null }[]> {
  const { data, error } = await supabase
    .from("thiet_bi")
    .select("id, ma_thiet_bi, ten_thiet_bi")
    .order("ma_thiet_bi", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

async function fetchHeThongOptions(): Promise<{ id: string; ma: string | null; ten: string | null }[]> {
  const { data, error } = await supabase
    .from("dm_he_thong")
    .select("id, ma, ten")
    .order("ma", { ascending: true })
    .limit(2000);
  if (error) throw error;
  return data ?? [];
}

/** Đọc chi tiết `giay_phep` để prefill (view v_giay_phep không có *_id thô). */
async function fetchLicenseDetail(rowId: string) {
  const { data, error } = await supabase
    .from("giay_phep")
    .select("id, ma_giay_phep, thiet_bi_id, loai_giay_phep_id, so_giay_phep, ngay_cap, ngay_het_han, noi_cap_id, file_giay_phep, ghi_chu")
    .eq("id", rowId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

interface FormState {
  maGiayPhep: string;
  thietBiId: string;
  heThongId: string;
  loaiGiayPhepId: string;
  soGiayPhep: string;
  ngayCap: string;
  ngayHetHan: string;
  noiCapId: string;
  fileUrl: string;
  ghiChu: string;
}

const EMPTY: FormState = {
  maGiayPhep: "", thietBiId: "", heThongId: "", loaiGiayPhepId: "", soGiayPhep: "",
  ngayCap: "", ngayHetHan: "", noiCapId: "", fileUrl: "", ghiChu: "",
};

export function GiayPhepFormDialog({ open, onOpenChange, row }: Props) {
  const qc = useQueryClient();
  const isEdit = !!row;
  const [form, setForm] = useState<FormState>(EMPTY);
  const [nguon, setNguon] = useState<"giay_phep" | "gpkt">("giay_phep");
  const saveGpkt = useServerFn(saveGpktRecord);

  const loaiOpts = useQuery({ queryKey: ["dm_loai_giay_phep_active"], queryFn: () => fetchOptions("dm_loai_giay_phep"), staleTime: 60_000 });
  const noiOpts = useQuery({ queryKey: ["dm_noi_cap_active"], queryFn: () => fetchOptions("dm_noi_cap"), staleTime: 60_000 });
  const tbOpts = useQuery({ queryKey: ["thiet_bi_options"], queryFn: fetchThietBiOptions, staleTime: 60_000, enabled: open });
  const htOpts = useQuery({ queryKey: ["dm_he_thong_options"], queryFn: fetchHeThongOptions, staleTime: 60_000, enabled: open });

  const detail = useQuery({
    queryKey: ["giay_phep_detail", row?.rowId],
    queryFn: () => fetchLicenseDetail(row!.rowId),
    enabled: open && isEdit && !!row && row.nguon === "giay_phep",
  });

  useEffect(() => {
    if (!open) return;
    if (!isEdit) { setForm(EMPTY); setNguon("giay_phep"); return; }
    if (row) setNguon(row.nguon);
    if (!detail.data) return;
    const d = detail.data;
    setForm({
      maGiayPhep: d.ma_giay_phep ?? "",
      thietBiId: d.thiet_bi_id ?? "",
      heThongId: "",
      loaiGiayPhepId: d.loai_giay_phep_id ?? "",
      soGiayPhep: d.so_giay_phep ?? "",
      ngayCap: d.ngay_cap ?? "",
      ngayHetHan: d.ngay_het_han ?? "",
      noiCapId: d.noi_cap_id ?? "",
      fileUrl: d.file_giay_phep ?? "",
      ghiChu: d.ghi_chu ?? "",
    });
  }, [open, isEdit, detail.data, row]);

  const save = useMutation({
    mutationFn: async () => {
      if (nguon === "gpkt") {
        if (!form.soGiayPhep.trim()) throw new Error("Số giấy phép bắt buộc");
        if (!form.heThongId) throw new Error("Chưa chọn hệ thống");
        await saveGpkt({
          data: {
            fields: {
              gp_so: form.soGiayPhep.trim(),
              gp_ngay: form.ngayCap || "",
              gp_han: form.ngayHetHan || "",
              gp_cu: "", ten_he_thong_theo_gp: "", nam_sx_gp: "", kieu_thiet_bi: "",
              so_san_xuat: "", noi_san_xuat: "", muc_dich: "", pham_vi: "",
              ma_dia_chi: "", dia_diem: "", thoi_gian: "", thanh_phan_theo_gp: "",
              don_vi: "", tram: "",
            },
            he_thong_id: form.heThongId,
            file_gpkt: form.fileUrl.trim() || null,
            overwrite_id: null,
          },
        });
        return;
      }
      if (!form.maGiayPhep.trim()) throw new Error("Mã giấy phép bắt buộc");
      if (!form.thietBiId) throw new Error("Chưa chọn tài sản");
      const payload = {
        ma_giay_phep: form.maGiayPhep.trim(),
        thiet_bi_id: form.thietBiId,
        loai_giay_phep_id: form.loaiGiayPhepId || null,
        so_giay_phep: form.soGiayPhep.trim() || null,
        ngay_cap: form.ngayCap || null,
        ngay_het_han: form.ngayHetHan || null,
        noi_cap_id: form.noiCapId || null,
        file_giay_phep: form.fileUrl.trim() || null,
        ghi_chu: form.ghiChu.trim() || null,
      };
      if (isEdit) {
        const { error } = await supabase.from("giay_phep").update(payload).eq("id", row!.rowId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("giay_phep").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Đã cập nhật giấy phép" : "Đã tạo giấy phép");
      qc.invalidateQueries({ queryKey: ["licenses_data"] });
      onOpenChange(false);
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Lỗi lưu giấy phép: " + msg);
    },
  });

  const tbOptions = useMemo(() =>
    (tbOpts.data ?? []).map((t) => ({ value: t.id, label: `${t.ma_thiet_bi}${t.ten_thiet_bi ? " — " + t.ten_thiet_bi : ""}` })),
    [tbOpts.data]);
  const htOptions = useMemo(() =>
    (htOpts.data ?? []).map((h) => ({ value: h.id, label: `${h.ma ?? ""}${h.ten ? " — " + h.ten : ""}` })),
    [htOpts.data]);

  const disabled = isEdit && row?.nguon === "gpkt";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Sửa giấy phép" : "Thêm giấy phép"}</DialogTitle>
          <DialogDescription>
            {disabled
              ? "Giấy phép khai thác (GPKT) gắn hệ thống — hiện chưa hỗ trợ sửa trực tiếp trong dialog này."
              : nguon === "gpkt"
                ? "GPKT — Giấy phép khai thác gắn HỆ THỐNG (bảng giay_phep_khai_thac)."
                : "Giấy phép gắn TÀI SẢN (bảng giay_phep). Ngưỡng cảnh báo mặc định 90 ngày trước hạn."}
          </DialogDescription>
        </DialogHeader>

        {disabled ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            Đóng dialog và cập nhật từ template Excel All-in-one hoặc trang chi tiết hệ thống.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {!isEdit && (
              <div className="sm:col-span-2">
                <Field label="Gán cho *">
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={nguon === "giay_phep" ? "default" : "outline"} onClick={() => setNguon("giay_phep")}>
                      Tài sản (thiết bị)
                    </Button>
                    <Button type="button" size="sm" variant={nguon === "gpkt" ? "default" : "outline"} onClick={() => setNguon("gpkt")}>
                      GPKT — Hệ thống
                    </Button>
                  </div>
                </Field>
              </div>
            )}
            {nguon === "giay_phep" ? (
              <>
            <Field label="Mã giấy phép *">
              <Input value={form.maGiayPhep} onChange={(e) => setForm({ ...form, maGiayPhep: e.target.value })} placeholder="GP_XXXXXX" />
            </Field>
            <Field label="Tài sản *">
              <Combobox
                value={form.thietBiId}
                onChange={(v) => setForm({ ...form, thietBiId: v })}
                options={tbOptions}
                placeholder="Chọn tài sản…"
                searchPlaceholder="Tìm mã/tên tài sản…"
              />
            </Field>
              </>
            ) : (
              <div className="sm:col-span-2">
                <Field label="Hệ thống *">
                  <Combobox
                    value={form.heThongId}
                    onChange={(v) => setForm({ ...form, heThongId: v })}
                    options={htOptions}
                    placeholder="Chọn hệ thống…"
                    searchPlaceholder="Tìm mã/tên hệ thống…"
                  />
                </Field>
              </div>
            )}
            <Field label="Loại giấy phép">
              <Combobox
                value={form.loaiGiayPhepId}
                onChange={(v) => setForm({ ...form, loaiGiayPhepId: v })}
                options={(loaiOpts.data ?? []).map((o) => ({ value: o.id, label: `${o.ma ?? ""}${o.ten ? " — " + o.ten : ""}` }))}
                placeholder="Chọn loại…"
                disabled={nguon === "gpkt"}
              />
            </Field>
            <Field label={nguon === "gpkt" ? "Số giấy phép *" : "Số giấy phép"}>
              <Input value={form.soGiayPhep} onChange={(e) => setForm({ ...form, soGiayPhep: e.target.value })} />
            </Field>
            <Field label="Ngày cấp">
              <Input type="date" value={form.ngayCap} onChange={(e) => setForm({ ...form, ngayCap: e.target.value })} />
            </Field>
            <Field label="Ngày hết hạn">
              <Input type="date" value={form.ngayHetHan} onChange={(e) => setForm({ ...form, ngayHetHan: e.target.value })} />
            </Field>
            <Field label="Nơi cấp">
              <Combobox
                value={form.noiCapId}
                onChange={(v) => setForm({ ...form, noiCapId: v })}
                options={(noiOpts.data ?? []).map((o) => ({ value: o.id, label: `${o.ma ?? ""}${o.ten ? " — " + o.ten : ""}` }))}
                placeholder="Chọn nơi cấp…"
                disabled={nguon === "gpkt"}
              />
            </Field>
            <Field label="Link file (tuỳ chọn)">
              <Input value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://…" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Ghi chú">
                <Textarea rows={2} value={form.ghiChu} onChange={(e) => setForm({ ...form, ghiChu: e.target.value })} disabled={nguon === "gpkt"} />
              </Field>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={() => save.mutate()} disabled={disabled || save.isPending}>
            {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Tạo giấy phép"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
