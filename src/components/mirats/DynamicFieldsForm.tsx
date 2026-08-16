// ============================================================================
// Form trường dữ liệu động — render theo FieldSpec (bảng he_thong_truong).
//
// - Hiển thị nhãn + dấu bắt buộc (*) + help_text.
// - Prefill mac_dinh khi chưa có giá trị.
// - Validate client theo rang_buoc (regex/min/max) + bat_buoc — mirror trigger
//   validate_thuoc_tinh của CSDL để không bị chặn oan phía server.
// Component "controlled": nhận value + onChange, không giữ state riêng để dễ
// dùng chung với form cha (thiet_bi.thuoc_tinh).
// ============================================================================

import { useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { useReferenceOptions } from "@/lib/mirats/reference-sources";
import { cn } from "@/lib/utils";
import type { FieldSpec } from "@/lib/mirats/registry";
import { buildInitialValues, validateFieldValue, type FormValues } from "@/lib/mirats/field-form";

export interface DynamicFieldsFormProps {
  specs: FieldSpec[];
  value: FormValues;
  onChange: (next: FormValues) => void;
  /** Hiện lỗi validate ngay (VD sau khi bấm Lưu). */
  showErrors?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DynamicFieldsForm({
  specs, value, onChange, showErrors, disabled, className,
}: DynamicFieldsFormProps) {
  // Prefill mac_dinh cho các field chưa có giá trị (chỉ khi thiếu key).
  useEffect(() => {
    const missing = specs.some((s) => value[s.field_key] === undefined);
    if (!missing) return;
    onChange({ ...buildInitialValues(specs, value), ...stripUndefined(value) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specs]);

  const merged = useMemo<FormValues>(
    () => ({ ...buildInitialValues(specs, value) }),
    [specs, value],
  );

  const patch = (key: string, v: string) => onChange({ ...merged, [key]: v });

  if (specs.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {specs.map((s) => {
        const val = merged[s.field_key] ?? "";
        const err = showErrors ? validateFieldValue(s, val) : null;
        const id = `dyn-${s.field_key}`;
        return (
          <div key={s.field_key} className="space-y-1.5">
            <Label htmlFor={id} className="text-meta flex items-center gap-1">
              {s.nhan}
              {s.bat_buoc && <span className="text-destructive" aria-hidden="true">*</span>}
            </Label>

            {s.kieu === "textarea" ? (
              <Textarea
                id={id}
                value={val}
                disabled={disabled}
                aria-invalid={!!err}
                onChange={(e) => patch(s.field_key, e.target.value)}
                className="min-h-16 text-xs"
              />
            ) : s.kieu === "select" ? (
              <Select value={val || undefined} disabled={disabled} onValueChange={(v) => patch(s.field_key, v)}>
                <SelectTrigger id={id} className="h-8 text-xs" aria-invalid={!!err}>
                  <SelectValue placeholder="— Chọn —" />
                </SelectTrigger>
                <SelectContent>
                  {s.tuy_chon.map((opt) => (
                    <SelectItem key={opt} value={opt} className="text-xs">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : s.kieu === "reference" ? (
              <ReferenceField
                source={s.rang_buoc.ref}
                value={val}
                disabled={disabled}
                onChange={(v) => patch(s.field_key, v)}
              />
            ) : (
              <Input
                id={id}
                type={s.kieu === "number" ? "number" : s.kieu === "date" ? "date" : "text"}
                value={val}
                disabled={disabled}
                aria-invalid={!!err}
                onChange={(e) => patch(s.field_key, e.target.value)}
                className="h-8 text-xs"
              />
            )}

            {s.help_text && !err && (
              <p className="text-meta text-muted-foreground">{s.help_text}</p>
            )}
            {err && (
              <p role="alert" className="text-meta text-destructive">{err}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function stripUndefined(v: FormValues): FormValues {
  const out: FormValues = {};
  for (const k of Object.keys(v)) if (v[k] !== undefined) out[k] = v[k];
  return out;
}

/** Ô chọn giá trị từ bảng danh mục (kieu="reference") — dropdown có tìm kiếm. */
function ReferenceField({
  source, value, disabled, onChange,
}: {
  source?: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  const { data: options, isLoading } = useReferenceOptions(source);
  if (!source) {
    return <p className="text-meta text-destructive">Trường liên kết CSDL chưa chọn nguồn danh mục.</p>;
  }
  return (
    <Combobox
      options={options ?? []}
      value={value}
      onChange={onChange}
      className={disabled ? "pointer-events-none opacity-60 h-8 text-xs" : "h-8 text-xs"}
      placeholder={isLoading ? "Đang tải…" : "— Chọn —"}
      searchPlaceholder="Tìm kiếm…"
      allowCustom
    />
  );
}

