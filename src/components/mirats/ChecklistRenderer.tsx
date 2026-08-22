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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, MinusCircle, Camera } from "lucide-react";
import { PhotoUpload } from "@/components/mirats/PhotoUpload";
import type { FormAttachment } from "@/lib/mirats/form-attachments";
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
  /** Bật đính kèm ảnh cho từng hạng mục (tuỳ theo cấu hình mẫu). */
  templateCode?: string;
  draftId?: string;
  attachments?: Record<string, FormAttachment[]>;
  onAttachmentsChange?: (next: Record<string, FormAttachment[]>) => void;
}

const KET_QUA_OPTIONS: KetQua[] = ["dat", "khong_dat", "khong_ap_dung"];
const KET_QUA_SHORT: Record<KetQua, string> = {
  dat: "Đạt",
  khong_dat: "K.Đạt",
  khong_ap_dung: "N/A",
};
/** Prefix key attachments dành cho hạng mục checklist (không đụng field_key phẳng). */
export const chkAttachKey = (item_code: string) => `chk:${item_code}`;

export function ChecklistRenderer({
  sections,
  values,
  onChange,
  readOnly,
  showErrors,
  className,
  templateCode,
  draftId,
  attachments,
  onAttachmentsChange,
}: ChecklistRendererProps) {
  const patch = (code: string, part: Partial<ItemInput>) => {
    if (!onChange) return;
    onChange({ ...values, [code]: { ...values[code], ...part } });
  };
  const canAttach = !!(templateCode && draftId && onAttachmentsChange);
  const setItemPhotos = (code: string, list: FormAttachment[]) => {
    if (!onAttachmentsChange) return;
    const k = chkAttachKey(code);
    const next = { ...(attachments ?? {}) };
    if (list.length === 0) delete next[k];
    else next[k] = list;
    onAttachmentsChange(next);
  };

  if (sections.length === 0) return null;

  return (
    <div className={cn("space-y-6", className)}>
      {sections.map((sec) => (
        <div key={sec.ma_section} className="rounded-lg border">
          <div className="border-b bg-muted/40 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{sec.ten}</span>
              <Badge variant="outline" className="font-mono text-[10px]">
                {sec.ma_section}
              </Badge>
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
                    canAttach={canAttach}
                    templateCode={templateCode}
                    draftId={draftId}
                    photos={attachments?.[chkAttachKey(item.item_code)] ?? []}
                    onPhotosChange={(list) => setItemPhotos(item.item_code, list)}
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
  item,
  value,
  readOnly,
  showErrors,
  onPatch,
  canAttach,
  templateCode,
  draftId,
  photos,
  onPhotosChange,
}: {
  item: ChecklistItem;
  value: ItemInput | undefined;
  readOnly?: boolean;
  showErrors?: boolean;
  onPatch: (part: Partial<ItemInput>) => void;
  canAttach: boolean;
  templateCode?: string;
  draftId?: string;
  photos: FormAttachment[];
  onPhotosChange: (list: FormAttachment[]) => void;
}) {
  const v = value ?? {};
  const opts = item.options ?? DEFAULT_ITEM_OPTIONS;
  const err = showErrors ? validateItemInput(item, v) : null;
  const idBase = `chk-${item.item_code}`;
  const numInvalid = item.result_kind === "so" && Number.isNaN(coerceNumber(v.gia_tri_so ?? null));
  const thresholdLabel = formatThreshold(opts.tieu_chuan_min, opts.tieu_chuan_max, item.don_vi);
  const hasThreshold = opts.tieu_chuan_min != null || opts.tieu_chuan_max != null;
  const numValue = item.result_kind === "so" ? coerceNumber(v.gia_tri_so ?? null) : null;
  const autoRes =
    item.result_kind === "so" && numValue != null && !Number.isNaN(numValue)
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
            {item.bat_buoc && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </Label>
          {opts.noi_dung_chi_tiet && (
            <p className="mt-0.5 whitespace-pre-line text-[11px] text-foreground/80">
              {opts.noi_dung_chi_tiet}
            </p>
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
            <LiveStatusBadge
              status={autoRes}
              hasValue={numValue != null && !Number.isNaN(numValue)}
            />
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
                autoRes === "dat" &&
                  "border-emerald-500/70 bg-emerald-50/40 dark:bg-emerald-950/20",
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
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
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

        {/* Kết luận — segmented 3 lựa chọn cho gọn, click chọn / click lại để bỏ. */}
        <KetQuaSegmented
          value={v.ket_qua ?? null}
          disabled={readOnly}
          invalid={!!err}
          ariaLabel={`Kết luận: ${item.ten}`}
          onChange={(val) => onPatch({ ket_qua: val })}
        />
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
          className={cn("min-h-8 text-xs", v.ket_qua === "khong_dat" && "border-destructive/60")}
        />
      </div>

      {/* Ảnh chứng minh — chỉ hiện khi mẫu có bật, và form đang cho phép đính kèm */}
      {opts.cho_upload_anh && canAttach && templateCode && draftId && (
        <div className="mt-2 rounded-md border border-dashed p-2">
          <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Camera className="h-3 w-3" /> Ảnh chứng minh
            {photos.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {photos.length}
              </Badge>
            )}
          </div>
          <PhotoUpload
            value={photos}
            onChange={onPhotosChange}
            templateCode={templateCode}
            draftId={draftId}
            fieldKey={chkAttachKey(item.item_code)}
            photoOnly
            disabled={readOnly}
            maxFiles={6}
          />
        </div>
      )}

      {err && (
        <p role="alert" className="mt-1 text-[11px] text-destructive">
          {err}
        </p>
      )}
    </div>
  );
}

function KetQuaSegmented({
  value,
  onChange,
  disabled,
  invalid,
  ariaLabel,
}: {
  value: KetQua | null;
  onChange: (v: KetQua | null) => void;
  disabled?: boolean;
  invalid?: boolean;
  ariaLabel?: string;
}) {
  const styles: Record<KetQua, { on: string; icon: typeof CheckCircle2 }> = {
    dat: {
      on: "bg-emerald-500/15 text-emerald-700 border-emerald-500/50 hover:bg-emerald-500/20 dark:text-emerald-300",
      icon: CheckCircle2,
    },
    khong_dat: {
      on: "bg-rose-500/15 text-rose-700 border-rose-500/50 hover:bg-rose-500/20 dark:text-rose-300",
      icon: XCircle,
    },
    khong_ap_dung: {
      on: "bg-muted text-foreground border-foreground/30",
      icon: MinusCircle,
    },
  };
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      className={cn(
        "inline-flex h-8 items-stretch overflow-hidden rounded-md border bg-background",
        invalid && !value && "border-destructive/60",
      )}
    >
      {KET_QUA_OPTIONS.map((k, i) => {
        const active = value === k;
        const { on, icon: Icon } = styles[k];
        return (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(active ? null : k)}
            className={cn(
              "flex items-center gap-1 px-2.5 text-xs font-medium transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              i > 0 && "border-l",
              active ? on : "text-muted-foreground hover:bg-muted/60",
            )}
            title={KET_QUA_LABEL[k]}
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{KET_QUA_SHORT[k]}</span>
          </button>
        );
      })}
    </div>
  );
}

function LiveStatusBadge({
  status,
  hasValue,
}: {
  status: "dat" | "khong_dat" | null;
  hasValue: boolean;
}) {
  if (!hasValue) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px]">
        <MinusCircle className="h-2.5 w-2.5" /> Chưa đo
      </Badge>
    );
  }
  if (status === "dat") {
    return (
      <Badge className="gap-1 border-emerald-500/40 bg-emerald-500/15 text-[10px] text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-300">
        <CheckCircle2 className="h-2.5 w-2.5" /> Trong ngưỡng
      </Badge>
    );
  }
  if (status === "khong_dat") {
    return (
      <Badge className="gap-1 border-rose-500/40 bg-rose-500/15 text-[10px] text-rose-700 hover:bg-rose-500/15 dark:text-rose-300">
        <XCircle className="h-2.5 w-2.5" /> Ngoài ngưỡng
      </Badge>
    );
  }
  return null;
}

function KetQuaBadge({ value }: { value: KetQua }) {
  const map: Record<KetQua, { cls: string; icon: typeof CheckCircle2 }> = {
    dat: {
      cls: "border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      icon: CheckCircle2,
    },
    khong_dat: {
      cls: "border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300",
      icon: XCircle,
    },
    khong_ap_dung: { cls: "border-muted bg-muted text-muted-foreground", icon: MinusCircle },
  };
  const { cls, icon: Icon } = map[value];
  return (
    <Badge className={cn("gap-1 text-[10px] hover:bg-transparent", cls)}>
      <Icon className="h-2.5 w-2.5" /> {KET_QUA_LABEL[value]}
    </Badge>
  );
}
