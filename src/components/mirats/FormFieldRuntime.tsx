// ============================================================================
// FormFieldRuntime.tsx — Render interactive 1 field CompiledField.
// Hỗ trợ: text/textarea/number/date/checkbox/select/multiselect/radio/rating/
//         measure(+ngưỡng)/before_after/duration/geo/computed/table/
//         photo/file/signature/heading/divider/note.
// ============================================================================
import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, MapPin } from "lucide-react";
import type { CompiledField } from "@/lib/mirats/form-schema";
import type { FormValues } from "@/lib/mirats/form-visibility";
import { checkThreshold, evalFormula } from "@/lib/mirats/form-visibility";
import { SignaturePad } from "./SignaturePad";
import { PhotoUpload } from "./PhotoUpload";
import { MultiSignatureFlow, type SignatureSlot } from "./MultiSignatureFlow";
import { FieldAttachSlot } from "./FieldAttachSlot";
import type { FormAttachment } from "@/lib/mirats/form-attachments";

type Props = {
  field: CompiledField;
  value: unknown;
  values: FormValues;                    // để tính computed
  onChange: (v: unknown) => void;
  templateCode: string;
  draftId: string;
  disabled?: boolean;
  // Sidecar attachments cho MỌI trường (không phải kind file/photo).
  attachments?: FormAttachment[];
  onAttachmentsChange?: (a: FormAttachment[]) => void;
};


function LabelRow({ f }: { f: CompiledField }) {
  return (
    <div className="mb-1 flex items-baseline gap-2">
      <Label className="text-sm font-medium">
        {f.label}
        {f.required && <span className="ml-0.5 text-rose-600">*</span>}
      </Label>
      {f.unit && <span className="text-xs text-muted-foreground">({f.unit})</span>}
      {f.tieu_chuan && <Badge variant="outline" className="text-[10px]">TC: {f.tieu_chuan}</Badge>}
    </div>
  );
}

function Help({ f }: { f: CompiledField }) {
  if (!f.help_text) return null;
  return <p className="mt-1 text-xs text-muted-foreground">{f.help_text}</p>;
}

export function FormFieldRuntime({
  field: f, value, values, onChange, templateCode, draftId, disabled,
  attachments, onAttachmentsChange,
}: Props) {
  // Kiểu trình bày thuần.
  if (f.kind === "heading") {
    return <h3 className="mt-2 border-b pb-1 text-base font-semibold">{f.label}</h3>;
  }
  if (f.kind === "divider") return <hr className="my-1 border-dashed" />;
  if (f.kind === "note") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        {f.help_text || f.label}
      </div>
    );
  }

  const showAttachSlot = onAttachmentsChange
    && !["photo", "file", "signature", "heading", "divider", "note"].includes(f.kind);

  return (
    <div>
      <LabelRow f={f} />
      <Inner field={f} value={value} values={values} onChange={onChange}
             templateCode={templateCode} draftId={draftId} disabled={disabled} />
      <Help f={f} />
      {showAttachSlot && (
        <FieldAttachSlot
          attachments={attachments ?? []}
          onChange={onAttachmentsChange!}
          templateCode={templateCode}
          draftId={draftId}
          fieldKey={f.key}
          disabled={disabled}
        />
      )}
    </div>
  );
}

function Inner({ field: f, value, values, onChange, templateCode, draftId, disabled }: Props) {
  const ph = f.placeholder ?? undefined;
  const set = (v: unknown) => onChange(v);


  switch (f.kind) {
    case "textarea":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} rows={3} maxLength={4000} placeholder={ph} disabled={disabled} />;

    case "number":
      return (
        <div className="flex items-stretch gap-2">
          <Input type="number" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} placeholder={ph} disabled={disabled} />
          {f.unit && <span className="flex items-center rounded-md border bg-muted px-2 text-xs text-muted-foreground">{f.unit}</span>}
        </div>
      );

    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} disabled={disabled} />;
    case "datetime":
      return <Input type="datetime-local" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)} disabled={disabled} />;

    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox checked={!!value} onCheckedChange={(c) => set(!!c)} disabled={disabled} />
          <span className="text-sm text-muted-foreground">{ph ?? "Đánh dấu nếu có"}</span>
        </div>
      );

    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={set} disabled={disabled}>
          <SelectTrigger><SelectValue placeholder={ph ?? "Chọn…"} /></SelectTrigger>
          <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
        </Select>
      );

    case "radio":
      return (
        <div className="space-y-1">
          {(f.options ?? ["Đạt", "Không đạt"]).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`r_${f.key}`} checked={value === o}
                     onChange={() => set(o)} disabled={disabled} />
              {o}
            </label>
          ))}
        </div>
      );

    case "multiselect": {
      const arr = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {(f.options ?? []).map((o) => {
            const on = arr.includes(o);
            return (
              <button key={o} type="button" disabled={disabled}
                onClick={() => set(on ? arr.filter((x) => x !== o) : [...arr, o])}
                className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}>
                {o}
              </button>
            );
          })}
        </div>
      );
    }

    case "rating": {
      const items = f.ratings ?? [
        { value: "1", label: "Xấu" }, { value: "2", label: "TB" }, { value: "3", label: "Tốt" },
      ];
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((r) => {
            const on = value === r.value;
            return (
              <button key={r.value} type="button" disabled={disabled} onClick={() => set(r.value)}
                className={`rounded-md border px-2 py-1 text-xs transition ${on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"}`}
                style={r.color && !on ? { borderColor: r.color, color: r.color } : undefined}>
                {r.label}
              </button>
            );
          })}
        </div>
      );
    }

    case "measure": {
      const status = checkThreshold(f, value);
      return (
        <div className="grid grid-cols-1 @md:grid-cols-3 gap-1">
          <Input type="number" value={(value as string) ?? ""} onChange={(e) => set(e.target.value)}
                 placeholder={ph ?? "Giá trị đo"} disabled={disabled} />
          <div className="flex items-center rounded-md border bg-muted px-2 text-xs text-muted-foreground">
            {f.unit || "—"}
          </div>
          <div className={`flex items-center justify-center rounded-md border px-2 text-xs ${
            status === "pass" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
            : status === "fail" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
            : "text-muted-foreground"}`}>
            {status === "pass" ? "Đạt" : status === "fail" ? "Không đạt" : "—"}
          </div>
          {(f.min_value != null || f.max_value != null) && (
            <p className="col-span-3 text-[11px] text-muted-foreground">
              Ngưỡng: {f.min_value ?? "—"} … {f.max_value ?? "—"} {f.unit ?? ""}
            </p>
          )}
        </div>
      );
    }

    case "before_after": {
      const v = (value as { before?: string; after?: string } | undefined) ?? {};
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border p-2">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">TRƯỚC</p>
            <Input value={v.before ?? ""} onChange={(e) => set({ ...v, before: e.target.value })} disabled={disabled} />
          </div>
          <div className="rounded-md border p-2">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">SAU</p>
            <Input value={v.after ?? ""} onChange={(e) => set({ ...v, after: e.target.value })} disabled={disabled} />
          </div>
        </div>
      );
    }

    case "duration": {
      const v = (value as { h?: string; m?: string } | undefined) ?? {};
      return (
        <div className="flex items-center gap-1">
          <Input type="number" placeholder="giờ" className="w-24" value={v.h ?? ""} onChange={(e) => set({ ...v, h: e.target.value })} disabled={disabled} />
          <span className="text-xs text-muted-foreground">:</span>
          <Input type="number" placeholder="phút" className="w-24" value={v.m ?? ""} onChange={(e) => set({ ...v, m: e.target.value })} disabled={disabled} />
        </div>
      );
    }

    case "geo": {
      const capture = () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
          (pos) => set(`${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
          () => {/* im lặng */},
        );
      };
      return (
        <div className="flex items-center gap-1">
          <Input value={(value as string) ?? ""} onChange={(e) => set(e.target.value)}
                 placeholder={ph ?? "vd: 21.028, 105.804"} disabled={disabled} />
          <Button type="button" variant="outline" size="sm" onClick={capture} disabled={disabled}>
            <MapPin className="mr-1 h-3.5 w-3.5" /> GPS
          </Button>
        </div>
      );
    }

    case "computed": {
      const computed = f.formula ? evalFormula(f.formula, values) : null;
      // Ghi lại giá trị tính được để lưu vào data.
      if (computed !== value) queueMicrotask(() => set(computed));
      return (
        <div className="rounded-md border bg-muted/30 px-2 py-1.5 text-sm">
          <span className="font-mono text-xs text-muted-foreground">= {f.formula || "(chưa có công thức)"}</span>
          <span className="ml-2 font-medium">{computed ?? "—"}{f.unit ? ` ${f.unit}` : ""}</span>
        </div>
      );
    }

    case "table": {
      const cols = f.columns ?? [];
      const rows = (value as Array<Record<string, string>>) ?? [];
      const setRow = (i: number, key: string, v: string) => {
        const next = rows.slice();
        next[i] = { ...next[i], [key]: v };
        set(next);
      };
      return (
        <div className="rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {cols.map((c) => (
                  <th key={c.key} className="px-2 py-1 text-left font-medium">
                    {c.label}{c.unit ? ` (${c.unit})` : ""}
                  </th>
                ))}
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {cols.map((c) => (
                    <td key={c.key} className="border-t p-1">
                      <Input className="h-7 text-xs" value={r[c.key] ?? ""}
                             onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled} />
                    </td>
                  ))}
                  <td className="border-t px-1 text-right">
                    <button type="button" onClick={() => set(rows.filter((_, x) => x !== i))}
                            disabled={disabled} className="text-rose-600 hover:text-rose-700">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={cols.length + 1} className="border-t p-2 text-center text-muted-foreground">Chưa có dòng</td></tr>
              )}
            </tbody>
          </table>
          <div className="border-t p-1">
            <Button type="button" variant="ghost" size="sm" disabled={disabled || cols.length === 0}
                    onClick={() => set([...rows, {}])}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Thêm dòng
            </Button>
          </div>
        </div>
      );
    }

    case "section_repeat": {
      // Lặp cả một block trường con. `columns` mô tả các field con (key/label/kind/unit/options).
      const cols = f.columns ?? [];
      const rows = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
      const setRow = (i: number, key: string, v: unknown) => {
        const next = rows.slice();
        next[i] = { ...(next[i] ?? {}), [key]: v };
        set(next);
      };
      const addRow = () => set([...rows, {}]);
      const delRow = (i: number) => set(rows.filter((_, x) => x !== i));
      return (
        <div className="space-y-2 rounded-md border bg-muted/10 p-2">
          {rows.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có mục. Nhấn "Thêm mục" bên dưới.</p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="rounded border bg-background p-2">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Mục #{i + 1}</span>
                <button type="button" disabled={disabled} onClick={() => delRow(i)}
                        className="text-rose-600 hover:text-rose-700">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                {cols.map((c) => (
                  <div key={c.key}>
                    <Label className="text-xs">{c.label}{c.unit ? ` (${c.unit})` : ""}</Label>
                    {c.kind === "textarea" ? (
                      <Textarea rows={2} className="text-sm" value={(r[c.key] as string) ?? ""}
                        onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled} maxLength={2000} />
                    ) : c.kind === "number" ? (
                      <Input type="number" className="h-8 text-sm" value={(r[c.key] as string) ?? ""}
                        onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled} />
                    ) : c.kind === "select" && c.options ? (
                      <select className="h-8 w-full rounded-md border bg-background px-2 text-sm"
                        value={(r[c.key] as string) ?? ""}
                        onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled}>
                        <option value="">—</option>
                        {c.options.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : c.kind === "date" ? (
                      <Input type="date" className="h-8 text-sm" value={(r[c.key] as string) ?? ""}
                        onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled} />
                    ) : (
                      <Input className="h-8 text-sm" value={(r[c.key] as string) ?? ""}
                        onChange={(e) => setRow(i, c.key, e.target.value)} disabled={disabled} maxLength={500} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={disabled || cols.length === 0}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Thêm mục
          </Button>
          {cols.length === 0 && (
            <p className="text-[11px] text-amber-600">Chưa cấu hình trường con — mở Inspector để thêm cột (key/label/kind).</p>
          )}
        </div>
      );
    }


    case "photo":
    case "file":
      return (
        <PhotoUpload
          value={(value as FormAttachment[]) ?? []}
          onChange={set}
          templateCode={templateCode} draftId={draftId} fieldKey={f.key}
          photoOnly={f.kind === "photo"} disabled={disabled}
        />
      );

    case "signature": {
      // Nếu field có `columns` cấu hình -> quy trình ký nhiều người có thứ tự.
      const signers = (f.columns ?? []).map((c) => ({ key: c.key, label: c.label }));
      if (signers.length > 0) {
        const slots = Array.isArray(value) ? (value as SignatureSlot[]) : [];
        return <MultiSignatureFlow value={slots} onChange={set} signers={signers} disabled={disabled} />;
      }
      return (
        <SignaturePad
          value={(value as string) ?? null}
          onChange={(dataUrl) => set(dataUrl)}
          disabled={disabled}
        />
      );
    }


    default:
      return <Input value={(value as string) ?? ""} onChange={(e) => set(e.target.value)}
                    maxLength={500} placeholder={ph} disabled={disabled} />;
  }
}

/** Helper: nhóm fields theo grid 3 cột dựa vào col_span (1-3). */
export function useGridRows(fields: CompiledField[]) {
  return useMemo(() => {
    const rows: CompiledField[][] = [];
    let cur: CompiledField[] = [];
    let used = 0;
    for (const f of fields) {
      const span = Math.max(1, Math.min(3, f.col_span || 3));
      // heading/divider/note/table luôn chiếm nguyên hàng.
      const forceFull = ["heading", "divider", "note", "table"].includes(f.kind);
      const effective = forceFull ? 3 : span;
      if (used + effective > 3 && cur.length > 0) { rows.push(cur); cur = []; used = 0; }
      cur.push(f);
      used += effective;
      if (used >= 3) { rows.push(cur); cur = []; used = 0; }
    }
    if (cur.length) rows.push(cur);
    return rows;
  }, [fields]);
}
