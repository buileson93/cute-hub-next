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
import { CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import {
  KET_QUA_LABEL,
  coerceNumber,
  validateItemInput,
  type ChecklistItem,
  type ChecklistSection,
  type ItemInput,
  type KetQua,
} from "@/lib/mirats/checklist";
import {
  DEFAULT_ITEM_OPTIONS,
  evaluateAutoResult,
  formatThreshold,
} from "@/lib/mirats/checklist-item-options";

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
            {sec.items.map((item, idx) => {
              const prev = idx > 0 ? sec.items[idx - 1] : null;
              const grp = item.options?.nhom_lon ?? null;
              const prevGrp = prev?.options?.nhom_lon ?? null;
              const showGroup = grp && grp !== prevGrp;
              return (
                <div key={item.item_code}>
                  {showGroup && (
                    <div className="bg-secondary/50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {grp}
                    </div>
                  )}
                  <ItemRow
                    item={item}
                    value={values[item.item_code]}
                    readOnly={readOnly}
                    showErrors={showErrors}
                    onPatch={(part) => patch(item.item_code, part)}
                  />
                </div>
              );
            })}
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
  const opts = item.options ?? DEFAULT_ITEM_OPTIONS;
  const err = showErrors ? validateItemInput(item, v) : null;
  const idBase = `chk-${item.item_code}`;
  const numInvalid =
    item.result_kind === "so" && Number.isNaN(coerceNumber(v.gia_tri_so ?? null));
  const thresholdLabel = formatThreshold(opts.tieu_chuan_min, opts.tieu_chuan_max, item.don_vi);
  const hasThreshold = opts.tieu_chuan_min != null || opts.tieu_chuan_max != null;
  const numValue = item.result_kind === "so" ? coerceNumber(v.gia_tri_so ?? null) : null;
  const autoRes = item.result_kind === "so" && numValue != null && !Number.isNaN(numValue)
    ? evaluateAutoResult(numValue, opts.tieu_chuan_min, opts.tieu_chuan_max)
    : null;

  // Tự chấm Đạt/K.Đạt khi nhập số hợp lệ và có ngưỡng — không đè kết luận thủ công khác.
  const handleNumChange = (raw: string) => {
    const next: Partial<ItemInput> = { gia_tri_so: raw };
    const n = coerceNumber(raw);
    if (n != null && !Number.isNaN(n)) {
      const auto = evaluateAutoResult(n, opts.tieu_chuan_min, opts.tieu_chuan_max);
      if (auto && (!v.ket_qua || v.ket_qua === "dat" || v.ket_qua === "khong_dat")) {
        next.ket_qua = auto;
      }
    }
    onPatch(next);
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Label htmlFor={idBase} className="text-sm flex items-center gap-1">
            {opts.hang_muc ?? item.ten}
            {item.bat_buoc && <span className="text-destructive" aria-hidden="true">*</span>}
          </Label>
          {opts.noi_dung_chi_tiet && (
            <p className="mt-0.5 whitespace-pre-line text-[11px] text-foreground/80">{opts.noi_dung_chi_tiet}</p>
          )}
          {item.huong_dan && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.huong_dan}</p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {thresholdLabel && (
            <Badge variant="secondary" className="font-mono text-[10px]" title="Ngưỡng tự chấm">
              {thresholdLabel}
            </Badge>
          )}
          {item.tieu_chuan && (
            <span className="rounded bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
              TC: {item.tieu_chuan}
            </span>
          )}
          {item.result_kind === "so" && hasThreshold && (
            <LiveStatusBadge status={autoRes} hasValue={numValue != null && !Number.isNaN(numValue)} />
          )}
          {v.ket_qua && (item.result_kind !== "so" || !hasThreshold) && (
            <KetQuaBadge value={v.ket_qua} />
          )}
        </div>
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
              onChange={(e) => handleNumChange(e.target.value)}
              className={cn(
                "h-8 text-xs transition-colors",
                autoRes === "dat" && "border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/20",
                autoRes === "khong_dat" && "border-rose-500/70 bg-rose-50/40 dark:bg-rose-950/20",
              )}
              data-testid={`chk-num-${item.item_code}`}
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
              {(opts.choices ?? item.tuy_chon ?? []).map((opt) => (
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
