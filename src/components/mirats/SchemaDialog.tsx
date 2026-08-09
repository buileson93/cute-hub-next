// ============================================================================
// SchemaDialog — dialog "khai thêm / sửa nhanh" chuẩn hoá bằng schema.
// GĐ3-06 + a11y hardening:
//   - Radix Dialog đã bao focus-trap + ESC + return-focus; ta thêm
//     aria-describedby/help + aria-invalid + aria-required cho từng field.
//   - `disableSubmitWhenInvalid` (mặc định TRUE): live-validate values →
//     disable nút submit khi schema fail. Vẫn hiện lỗi khi user bấm submit.
//   - Field mới hỗ trợ: `disabled`, `emptyOptionLabel` (select) để cho phép
//     bỏ chọn — thay cho pattern sentinel "__none__" cũ.
//   - loadOptions lỗi → hiện thông báo dưới field và không rơi vào loop.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ZodSchema } from "zod";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { cn } from "@/lib/utils";

export type SchemaOption = { value: string; label: string };

type Common = {
  key: string;
  label: string;
  required?: boolean;
  help?: string;
  disabled?: boolean;
};

export type SchemaField =
  | (Common & { type: "text" | "textarea" | "date" | "password"; placeholder?: string; colSpan?: 1 | 2 })
  | (Common & {
      type: "number";
      placeholder?: string;
      min?: number;
      max?: number;
      step?: number;
      colSpan?: 1 | 2;
    })
  | (Common & { type: "switch"; colSpan?: 1 | 2 })
  | (Common & {
      type: "select" | "combobox";
      placeholder?: string;
      options?: SchemaOption[];
      /** Cho phép bỏ chọn — hiện 1 SelectItem "trống" trên đầu. */
      emptyOptionLabel?: string;
      colSpan?: 1 | 2;
      loadOptions?: {
        queryKey: unknown[];
        queryFn: (values: Record<string, unknown>) => Promise<SchemaOption[]>;
        deps?: string[];
      };
    })
  | (Common & {
      type: "custom";
      render: (props: {
        value: any;
        onChange: (v: any) => void;
        values: Record<string, unknown>;
        error?: string;
      }) => ReactNode;
      colSpan?: 1 | 2;
    });


export interface SchemaDialogProps<TValues extends Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  fields: SchemaField[];
  schema: ZodSchema<TValues>;
  defaultValues?: Partial<TValues>;
  submitLabel?: string;
  onSubmit: (values: TValues) => void | Promise<void>;
  footerExtra?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  /** Disable submit nếu schema fail (mặc định TRUE). */
  disableSubmitWhenInvalid?: boolean;
}

const WIDTH_CLASS: Record<
  NonNullable<SchemaDialogProps<Record<string, unknown>>["maxWidth"]>,
  string
> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
};

/** Coerce values → object phù hợp cho zod parse.
 *  - number: "" → undefined, còn lại Number(raw).
 *  - text/textarea/date: trim; giữ "" để `.min(1, msg)` bắn message custom
 *    thay vì "expected string, received undefined".
 *  - select/combobox: giữ "" (schema tự xử qua `.min(1)` hoặc `.optional()`). */
function coerceForParse(fields: SchemaField[], values: Record<string, unknown>) {
  const draft: Record<string, unknown> = { ...values };
  for (const f of fields) {
    if (f.type === "number") {
      const raw = draft[f.key];
      if (raw === "" || raw == null) draft[f.key] = undefined;
      else draft[f.key] = Number(raw);
    } else if (f.type === "text" || f.type === "textarea" || f.type === "date" || f.type === "password") {
      if (typeof draft[f.key] === "string") {
        draft[f.key] = (draft[f.key] as string).trim();
      }
    }
  }
  return draft;
}

function AsyncOptions({
  field,
  values,
  onLoaded,
  onError,
}: {
  field: Extract<SchemaField, { type: "select" | "combobox" }>;
  values: Record<string, unknown>;
  onLoaded: (opts: SchemaOption[]) => void;
  onError: (msg: string | null) => void;
}) {
  const depsSig = (field.loadOptions?.deps ?? []).map((k) => values[k] ?? "");
  const q = useQuery({
    queryKey: [...(field.loadOptions?.queryKey ?? ["schema-dialog-noop", field.key]), ...depsSig],
    queryFn: () => field.loadOptions!.queryFn(values),
    enabled: !!field.loadOptions,
    retry: false,
  });
  useEffect(() => {
    if (q.data) {
      onLoaded(q.data);
      onError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.data]);
  useEffect(() => {
    if (q.error) onError(q.error instanceof Error ? q.error.message : "Không tải được lựa chọn");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.error]);
  return null;
}

export function SchemaDialog<TValues extends Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  schema,
  defaultValues,
  submitLabel = "Lưu",
  onSubmit,
  footerExtra,
  maxWidth = "lg",
  disableSubmitWhenInvalid = true,
}: SchemaDialogProps<TValues>) {
  const initial = useMemo(() => {
    const base: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "switch") base[f.key] = false;
      else base[f.key] = "";
    }
    return { ...base, ...(defaultValues ?? {}) } as Record<string, unknown>;
  }, [fields, defaultValues]);

  const [values, setValues] = useState<Record<string, unknown>>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [asyncOpts, setAsyncOpts] = useState<Record<string, SchemaOption[]>>({});
  const [asyncErr, setAsyncErr] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (open) {
      setValues(initial);
      setErrors({});
      setAsyncErr({});
    }
  }, [open, initial]);

  function setValue(k: string, v: unknown) {
    setValues((prev) => ({ ...prev, [k]: v }));
    if (errors[k])
      setErrors((e) => {
        const n = { ...e };
        delete n[k];
        return n;
      });
  }

  // Live-validate cho việc disable submit — KHÔNG set errors state để tránh
  // hiển thị lỗi trước khi user tương tác.
  const isValid = useMemo(() => {
    if (!disableSubmitWhenInvalid) return true;
    const draft = coerceForParse(fields, values);
    return schema.safeParse(draft).success;
  }, [values, fields, schema, disableSubmitWhenInvalid]);

  async function submit() {
    const draft = coerceForParse(fields, values);
    const parsed = schema.safeParse(draft);
    if (!parsed.success) {
      const map: Record<string, string> = {};
      for (const iss of parsed.error.issues) {
        const key = iss.path.join(".") || "_";
        if (!map[key]) map[key] = iss.message;
      }
      setErrors(map);
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      await onSubmit(parsed.data);
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent
        className={WIDTH_CLASS[maxWidth]}
        onKeyDown={(e) => {
          // Enter trong Input đơn dòng → submit; Textarea giữ hành vi mặc định.
          if (
            e.key === "Enter" &&
            !e.shiftKey &&
            (e.target as HTMLElement).tagName === "INPUT"
          ) {
            e.preventDefault();
            if (!busy && (isValid || !disableSubmitWhenInvalid)) void submit();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3">
          {fields.map((f) => {
            const err = errors[f.key] || asyncErr[f.key];
            const req = "required" in f && f.required;
            const helpId = f.help ? `sd-${f.key}-help` : undefined;
            const errId = err ? `sd-${f.key}-err` : undefined;
            const describedBy = [helpId, errId].filter(Boolean).join(" ") || undefined;
            const commonAria = {
              "aria-invalid": !!err || undefined,
              "aria-required": req || undefined,
              "aria-describedby": describedBy,
            } as const;
            const labelNode = (
              <Label htmlFor={`sd-${f.key}`}>
                {f.label}
                {req && (
                  <span className="text-destructive" aria-hidden="true">
                    {" "}
                    *
                  </span>
                )}
              </Label>
            );
            const helpNode = f.help ? (
              <p id={helpId} className="text-xs text-muted-foreground">
                {f.help}
              </p>
            ) : null;
            const errNode = err ? (
              <p id={errId} role="alert" className="text-xs text-destructive">
                {err}
              </p>
            ) : null;

            if (f.type === "text" || f.type === "date" || f.type === "password") {
              return (
                <div key={f.key} className={cn("space-y-1", f.colSpan === 2 ? "md:col-span-2" : "")}>
                  {labelNode}
                  <Input
                    id={`sd-${f.key}`}
                    type={f.type === "date" ? "date" : f.type === "password" ? "password" : "text"}
                    value={(values[f.key] as string) ?? ""}
                    placeholder={f.placeholder}
                    disabled={f.disabled}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    {...commonAria}
                  />
                  {errNode}
                  {helpNode}
                </div>
              );
            }
            if (f.type === "number") {
              return (
                <div key={f.key} className={cn("space-y-1", f.colSpan === 2 ? "md:col-span-2" : "")}>
                  {labelNode}
                  <Input
                    id={`sd-${f.key}`}
                    type="number"
                    value={(values[f.key] as string | number) ?? ""}
                    placeholder={f.placeholder}
                    min={f.min}
                    max={f.max}
                    step={f.step}
                    disabled={f.disabled}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    {...commonAria}
                  />
                  {errNode}
                  {helpNode}
                </div>
              );
            }
            if (f.type === "textarea") {
              return (
                <div key={f.key} className={cn("space-y-1", f.colSpan === 2 ? "md:col-span-2" : "")}>
                  {labelNode}
                  <Textarea
                    id={`sd-${f.key}`}
                    rows={3}
                    value={(values[f.key] as string) ?? ""}
                    placeholder={f.placeholder}
                    disabled={f.disabled}
                    onChange={(e) => setValue(f.key, e.target.value)}
                    {...commonAria}
                  />
                  {errNode}
                  {helpNode}
                </div>
              );
            }
            if (f.type === "switch") {
              return (
                <label key={f.key} className={cn("flex items-center gap-2 text-sm pt-4", f.colSpan === 2 ? "md:col-span-2" : "")}>
                  <Switch
                    id={`sd-${f.key}`}
                    checked={Boolean(values[f.key])}
                    disabled={f.disabled}
                    onCheckedChange={(v) => setValue(f.key, v)}
                    aria-describedby={describedBy}
                  />
                  <span>{f.label}</span>
                  {helpNode}
                </label>
              );
            }
            if (f.type === "custom") {
              return (
                <div key={f.key} className={cn("space-y-1", f.colSpan === 2 ? "md:col-span-2" : "")}>
                  {f.render({
                    value: values[f.key],
                    onChange: (v) => setValue(f.key, v),
                    values,
                    error: err,
                  })}
                  {errNode}
                  {helpNode}
                </div>
              );
            }

            if (f.type !== "select" && f.type !== "combobox") return null;
            const selectField = f;
            const opts: SchemaOption[] = selectField.options ?? asyncOpts[selectField.key] ?? [];
            const EMPTY_SENTINEL = "__sd_empty__";
            const currentVal = (values[selectField.key] as string) ?? "";
            const inner =
              selectField.type === "combobox" ? (
                <Combobox
                  options={opts}
                  value={currentVal}
                  onChange={(v: string) => setValue(selectField.key, v)}
                  placeholder={selectField.placeholder ?? "Chọn"}
                  emptyText="Không có lựa chọn"
                />
              ) : (
                <Select
                  value={currentVal || (selectField.emptyOptionLabel ? EMPTY_SENTINEL : "")}
                  onValueChange={(v) =>
                    setValue(selectField.key, v === EMPTY_SENTINEL ? "" : v)
                  }
                  disabled={selectField.disabled}
                >
                  <SelectTrigger id={`sd-${selectField.key}`} {...commonAria}>
                    <SelectValue placeholder={selectField.placeholder ?? "Chọn"} />
                  </SelectTrigger>
                  <SelectContent>
                    {selectField.emptyOptionLabel && (
                      <SelectItem value={EMPTY_SENTINEL}>
                        {selectField.emptyOptionLabel}
                      </SelectItem>
                    )}
                    {opts.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            return (
              <div key={selectField.key} className={cn("space-y-1", selectField.colSpan === 2 ? "md:col-span-2" : "")}>
                {labelNode}
                {selectField.loadOptions && (
                  <AsyncOptions
                    field={selectField}
                    values={values}
                    onLoaded={(list) =>
                      setAsyncOpts((prev) =>
                        prev[selectField.key] === list
                          ? prev
                          : { ...prev, [selectField.key]: list },
                      )
                    }
                    onError={(msg) =>
                      setAsyncErr((prev) =>
                        prev[selectField.key] === msg
                          ? prev
                          : { ...prev, [selectField.key]: msg },
                      )
                    }
                  />
                )}
                {inner}
                {errNode}
                {helpNode}
              </div>
            );
          })}

        </div>
        {footerExtra}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Huỷ
          </Button>
          <Button
            onClick={submit}
            loading={busy}
            disabled={busy || (disableSubmitWhenInvalid && !isValid)}
          >
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
