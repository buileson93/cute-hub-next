// ============================================================================
// LienKetForm — FORM thêm/sửa liên kết hệ thống (presentational, dễ test).
//  - 2 combobox tìm kiếm hệ thống (nguồn/đích)
//  - dropdown loại (kèm chip màu), lớp, hướng, giao diện nguồn/đích, giao thức,
//    vai trò dự phòng
//  - validate: nguồn ≠ đích (chặn submit); cảnh báo trùng cạnh đang hiệu lực
// Không gọi CSDL: nhận options + callback onSubmit từ ngoài.
// ============================================================================

import { useMemo, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import type { AddLienKetInput, LoaiLienKet } from "@/lib/mirats/lien-ket";
import type { DoThiRow, Lop, Huong } from "@/lib/mirats/system-graph";

const NONE = "__none";

export interface LienKetFormValues {
  nguonId: string;
  dichId: string;
  loaiId: string;
  lop: Lop;
  huong: Huong;
  gdNguon: string;
  gdDich: string;
  giaoThuc: string;
  vaiTro: "chinh" | "du_phong" | "";
  moTa: string;
  ghiChu: string;
}

const EMPTY: LienKetFormValues = {
  nguonId: "", dichId: "", loaiId: "", lop: "logic", huong: "mot_chieu",
  gdNguon: "", gdDich: "", giaoThuc: "", vaiTro: "", moTa: "", ghiChu: "",
};

/** Kiểm tra thuần: trả lỗi chặn (nguồn≠đích) và cảnh báo (trùng cạnh hiệu lực). */
export function kiemTraLienKet(
  v: LienKetFormValues,
  existingEdges: DoThiRow[],
): { loi: string | null; canhBao: string | null } {
  let loi: string | null = null;
  if (v.nguonId && v.dichId && v.nguonId === v.dichId) {
    loi = "Không thể nối một hệ thống với chính nó.";
  }
  let canhBao: string | null = null;
  if (!loi && v.nguonId && v.dichId && v.loaiId) {
    const trung = existingEdges.some(
      (e) =>
        e.nguon_id === v.nguonId &&
        e.dich_id === v.dichId &&
        e.loai_lien_ket_id === v.loaiId,
    );
    if (trung) canhBao = "Liên kết này đã tồn tại (trùng cạnh đang hiệu lực). Bạn vẫn có thể lưu nếu chủ đích.";
  }
  return { loi, canhBao };
}

interface LienKetFormProps {
  heThongOptions: ComboOption[];
  loaiList: LoaiLienKet[];
  existingEdges: DoThiRow[];
  onSubmit: (input: AddLienKetInput) => void;
  onCancel?: () => void;
  submitting?: boolean;
  defaultValues?: Partial<LienKetFormValues>;
}

export function LienKetForm({
  heThongOptions, loaiList, existingEdges, onSubmit, onCancel, submitting, defaultValues,
}: LienKetFormProps) {
  const [v, setV] = useState<LienKetFormValues>({ ...EMPTY, ...defaultValues });
  const set = <K extends keyof LienKetFormValues>(k: K, val: LienKetFormValues[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const { loi, canhBao } = useMemo(() => kiemTraLienKet(v, existingEdges), [v, existingEdges]);
  const thieuBatBuoc = !v.nguonId || !v.dichId || !v.loaiId;
  const disabled = !!loi || thieuBatBuoc || !!submitting;

  const submit = () => {
    if (disabled) return;
    onSubmit({
      he_thong_nguon_id: v.nguonId,
      he_thong_dich_id: v.dichId,
      loai_lien_ket_id: v.loaiId,
      lop: v.lop,
      huong: v.huong,
      giao_dien_nguon: v.gdNguon || null,
      giao_dien_dich: v.gdDich || null,
      giao_thuc: v.giaoThuc || null,
      vai_tro_du_phong: v.vaiTro || null,
      mo_ta_tin_hieu: v.moTa || null,
      ghi_chu: v.ghiChu || null,
    });
  };

  return (
    <div className="grid gap-3 py-2">
      <div className="grid gap-1.5">
        <Label>Hệ thống nguồn</Label>
        <Combobox options={heThongOptions} value={v.nguonId} onChange={(x) => set("nguonId", x)} placeholder="Chọn hệ thống nguồn…" />
      </div>
      <div className="grid gap-1.5">
        <Label>Hệ thống đích</Label>
        <Combobox options={heThongOptions} value={v.dichId} onChange={(x) => set("dichId", x)} placeholder="Chọn hệ thống đích…" />
      </div>

      {loi && (
        <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> {loi}
        </p>
      )}
      {canhBao && (
        <p role="status" className="flex items-center gap-1.5 rounded-md border border-amber-300/60 bg-amber-50/50 px-2 py-1 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
          <AlertTriangle className="h-3.5 w-3.5" /> {canhBao}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Loại liên kết</Label>
          <Select value={v.loaiId} onValueChange={(x) => set("loaiId", x)}>
            <SelectTrigger aria-label="Loại liên kết"><SelectValue placeholder="Chọn loại…" /></SelectTrigger>
            <SelectContent>
              {loaiList.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.mau_sac }} aria-hidden />
                    {l.ten}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Lớp</Label>
          <Select value={v.lop} onValueChange={(x) => set("lop", x as Lop)}>
            <SelectTrigger aria-label="Lớp"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="logic">Logic</SelectItem>
              <SelectItem value="vat_ly">Vật lý</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Hướng</Label>
          <Select value={v.huong} onValueChange={(x) => set("huong", x as Huong)}>
            <SelectTrigger aria-label="Hướng"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mot_chieu">Một chiều</SelectItem>
              <SelectItem value="hai_chieu">Hai chiều</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Vai trò dự phòng</Label>
          <Select value={v.vaiTro || NONE} onValueChange={(x) => set("vaiTro", x === NONE ? "" : (x as "chinh" | "du_phong"))}>
            <SelectTrigger aria-label="Vai trò dự phòng"><SelectValue placeholder="Không xác định" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Không xác định</SelectItem>
              <SelectItem value="chinh">Chính</SelectItem>
              <SelectItem value="du_phong">Dự phòng</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Giao diện nguồn</Label>
          <Input value={v.gdNguon} onChange={(e) => set("gdNguon", e.target.value)} placeholder="E1/IP…" />
        </div>
        <div className="grid gap-1.5">
          <Label>Giao diện đích</Label>
          <Input value={v.gdDich} onChange={(e) => set("gdDich", e.target.value)} placeholder="E1/IP…" />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label>Giao thức</Label>
        <Input value={v.giaoThuc} onChange={(e) => set("giaoThuc", e.target.value)} placeholder="VoIP/E1…" />
      </div>
      <div className="grid gap-1.5">
        <Label>Mô tả tín hiệu</Label>
        <Input value={v.moTa} onChange={(e) => set("moTa", e.target.value)} placeholder="Kết nối thoại VHF vào VCCS…" />
      </div>
      <div className="grid gap-1.5">
        <Label>Ghi chú</Label>
        <Textarea value={v.ghiChu} onChange={(e) => set("ghiChu", e.target.value)} rows={2} />
      </div>

      <div className="mt-1 flex justify-end gap-2">
        {onCancel && <Button variant="outline" onClick={onCancel}>Hủy</Button>}
        <Button onClick={submit} disabled={disabled}>
          {submitting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
          Lưu liên kết
        </Button>
      </div>
    </div>
  );
}
