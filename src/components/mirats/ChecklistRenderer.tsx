// ============================================================================
// ChecklistRenderer — Renderer DÙNG CHUNG cho mẫu dạng bảng kiểm.
//
// Dùng cả khi TẠO phiếu (readOnly=false, có onChange) và khi xem CHI TIẾT
// (readOnly=true). Mẫu "phẳng" (form_field) vẫn dùng renderer cũ (DynamicFieldsForm
// / renderField trong route) — component này chỉ phụ trách mẫu có section.
//
// Mỗi hạng mục hiển thị: tên • hướng dẫn • giá trị đo/đơn vị • tiêu chuẩn •
// kết luận (đạt/không đạt/không áp dụng) • ghi chú • HÀNH ĐỘNG (bắt buộc khi
// Không đạt — báo lỗi ngay).
// ============================================================================

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  KET_QUA_LABEL,
  coerceNumber,
  validateItemInput,
  type ChecklistItem,
  type ChecklistSection,
  type ItemInput,
  type KetQua,
} from "@/lib/mirats/checklist";

export interface ChecklistRendererProps {
  sections: ChecklistSection[];
  values: Record<string, ItemInput>;
  onChange?: (next: Record<string, ItemInput>) => void;
  readOnly?: boolean;
  /** Hiện lỗi validate ngay (VD sau khi bấm Lưu). */
  showErrors?: boolean;
  className?: string;
}

const KET_QUA_OPTIONS: KetQua[] = ["dat", "khong_dat", "khong_ap_dung"];

export function ChecklistRenderer({
  sections, values, onChange, readOnly, showErrors, className,
}: ChecklistRendererProps) {
  const patch = (code: string, part: Partial<ItemInput>) => {
    if (!onChange) return;
    onChange({ ...values, [code]: { ...values[code], ...part } });
  };

  if (sections.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {sections.map((sec) => (
        <div key={sec.ma_section} className="rounded-lg border">
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{sec.ten}</span>
              <Badge variant="outline" className="font-mono text-[10px]">{sec.ma_section}</Badge>
            </div>
            {sec.mo_ta && <p className="mt-0.5 text-xs text-muted-foreground">{sec.mo_ta}</p>}
          </div>
          <div className="divide-y">
            {sec.items.map((item) => (
              <ItemRow
                key={item.item_code}
                item={item}
                value={values[item.item_code]}
                readOnly={readOnly}
                showErrors={showErrors}
                onPatch={(part) => patch(item.item_code, part)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ItemRow({
  item, value, readOnly, showErrors, onPatch,
}: {
  item: ChecklistItem;
  value: ItemInput | undefined;
  readOnly?: boolean;
  showErrors?: boolean;
  onPatch: (part: Partial<ItemInput>) => void;
}) {
  const v = value ?? {};
  const err = showErrors ? validateItemInput(item, v) : null;
  const idBase = `chk-${item.item_code}`;
  const numInvalid =
    item.result_kind === "so" && Number.isNaN(coerceNumber(v.gia_tri_so ?? null));

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label htmlFor={idBase} className="text-sm flex items-center gap-1">
            {item.ten}
            {item.bat_buoc && <span className="text-destructive" aria-hidden="true">*</span>}
          </Label>
          {item.huong_dan && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.huong_dan}</p>
          )}
        </div>
        {item.tieu_chuan && (
          <span className="shrink-0 rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
            TC: {item.tieu_chuan}
          </span>
        )}
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {/* Giá trị đo / lựa chọn / ghi nhận */}
        {item.result_kind === "so" ? (
          <div className="flex items-center gap-2">
            <Input
              id={idBase}
              type="number"
              inputMode="decimal"
              value={v.gia_tri_so == null ? "" : String(v.gia_tri_so)}
              disabled={readOnly}
              aria-invalid={numInvalid || !!err}
              placeholder="Giá trị đo"
              onChange={(e) => onPatch({ gia_tri_so: e.target.value })}
              className="h-8 text-xs"
            />
            {item.don_vi && <span className="text-xs text-muted-foreground">{item.don_vi}</span>}
          </div>
        ) : item.result_kind === "chon" ? (
          <Select
            value={v.gia_tri_text || undefined}
            disabled={readOnly}
            onValueChange={(val) => onPatch({ gia_tri_text: val })}
          >
            <SelectTrigger id={idBase} className="h-8 text-xs" aria-invalid={!!err}>
              <SelectValue placeholder="— Chọn —" />
            </SelectTrigger>
            <SelectContent>
              {(item.tuy_chon ?? []).map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : item.result_kind === "text" ? (
          <Input
            id={idBase}
            value={v.gia_tri_text ?? ""}
            disabled={readOnly}
            aria-invalid={!!err}
            placeholder="Ghi nhận"
            onChange={(e) => onPatch({ gia_tri_text: e.target.value })}
            className="h-8 text-xs"
          />
        ) : null}

        {/* Kết luận */}
        <Select
          value={v.ket_qua || undefined}
          disabled={readOnly}
          onValueChange={(val) => onPatch({ ket_qua: val as KetQua })}
        >
          <SelectTrigger className="h-8 text-xs" aria-invalid={!!err} aria-label={`Kết luận: ${item.ten}`}>
            <SelectValue placeholder="— Kết luận —" />
          </SelectTrigger>
          <SelectContent>
            {KET_QUA_OPTIONS.map((k) => (
              <SelectItem key={k} value={k} className="text-xs">{KET_QUA_LABEL[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Textarea
          value={v.ghi_chu ?? ""}
          disabled={readOnly}
          placeholder="Ghi chú"
          aria-label={`Ghi chú: ${item.ten}`}
          onChange={(e) => onPatch({ ghi_chu: e.target.value })}
          className="min-h-8 text-xs"
        />
        {/* Hành động — bắt buộc khi Không đạt */}
        <Textarea
          value={v.hanh_dong ?? ""}
          disabled={readOnly}
          placeholder={v.ket_qua === "khong_dat" ? "Hành động khắc phục (bắt buộc)" : "Hành động"}
          aria-label={`Hành động: ${item.ten}`}
          aria-invalid={v.ket_qua === "khong_dat" && !(v.hanh_dong ?? "").trim()}
          onChange={(e) => onPatch({ hanh_dong: e.target.value })}
          className={cn(
            "min-h-8 text-xs",
            v.ket_qua === "khong_dat" && "border-destructive/60",
          )}
        />
      </div>

      {err && <p role="alert" className="mt-1 text-[11px] text-destructive">{err}</p>}
    </div>
  );
}
