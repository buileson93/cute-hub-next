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
    <div className="mb-1.5 flex items-baseline gap-2">
      <Label className="astryx-text-label text-[10px] text-muted-foreground font-bold tracking-wider">
        {f.label}
        {f.required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
      {f.unit && <span className="astryx-number text-[10px] text-muted-foreground/70">[{f.unit}]</span>}
      {f.tieu_chuan && <Badge variant="outline" className="astryx-badge border-border text-[9px] py-0 px-1.5 h-4">TC: {f.tieu_chuan}</Badge>}
    </div>
  );
}

function Help({ f }: { f: CompiledField }) {
  if (!f.help_text) return null;
  return <p className="astryx-text-muted mt-1 text-[10px] italic leading-tight">{f.help_text}</p>;
}

export function FormFieldRuntime({
  field: f, value, values, onChange, templateCode, draftId, disabled,
  attachments, onAttachmentsChange,
}: Props) {
  // Kiểu trình bày thuần.
  if (f.kind === "heading") {
    return <h3 className="astryx-heading-3 mt-4 mb-2 border-b border-border/50 pb-1">{f.label}</h3>;
  }
  if (f.kind === "divider") return <hr className="my-4 border-dashed border-border/30" />;
  if (f.kind === "note") {
    return (
      <div className="astryx-surface border-amber-200/50 bg-amber-50/30 p-3 text-[11px] text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
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
            <label key={o} className="astryx-text-body flex items-center gap-2 text-xs cursor-pointer hover:text-foreground transition-colors py-0.5">
              <input type="radio" name={`r_${f.key}`} checked={value === o}
                     className="astryx-checkbox rounded-full size-3.5"
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
                className={`astryx-control rounded-full px-3 py-0.5 text-[11px] transition-mirats-fast ${on ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-secondary"}`}>
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
                className={`astryx-control rounded-md px-2.5 py-1 text-[11px] transition-mirats-fast ${on ? "bg-primary text-primary-foreground border-primary" : "hover:bg-secondary"}`}
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
          <div className="astryx-number flex items-center rounded-md border border-border bg-muted/50 px-2 text-[10px] text-muted-foreground font-medium uppercase tracking-tight">
            {f.unit || "—"}
          </div>
          <div className={`astryx-text-label flex items-center justify-center rounded-md border text-[9px] font-bold tracking-wider px-2 ${
            status === "pass" ? "bg-emerald-50/50 border-emerald-200/50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"
            : status === "fail" ? "bg-rose-50/50 border-rose-200/50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"
            : "text-muted-foreground border-border bg-muted/30"}`}>
            {status === "pass" ? "ĐẠT" : status === "fail" ? "KHÔNG ĐẠT" : "—"}
          </div>
          {(f.min_value != null || f.max_value != null) && (
            <p className="astryx-number col-span-3 text-[10px] text-muted-foreground/70 mt-1 pl-1 border-l-2 border-border/30">
              NGƯỠNG: {f.min_value ?? "—"} … {f.max_value ?? "—"} {f.unit ?? ""}
            </p>
          )}
        </div>
      );
    }

    case "before_after": {
      const v = (value as { before?: string; after?: string } | undefined) ?? {};
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="astryx-surface border-border/50 p-2.5 bg-card/50">
            <p className="astryx-text-label mb-1.5 text-[9px] font-bold text-muted-foreground/70">TRƯỚC</p>
            <Input value={v.before ?? ""} onChange={(e) => set({ ...v, before: e.target.value })} disabled={disabled} />
          </div>
          <div className="astryx-surface border-border/50 p-2.5 bg-card/50">
            <p className="astryx-text-label mb-1.5 text-[9px] font-bold text-muted-foreground/70">SAU</p>
            <Input value={v.after ?? ""} onChange={(e) => set({ ...v, after: e.target.value })} disabled={disabled} />
          </div>
        </div>
      );
    }

    case "duration": {
      const v = (value as { h?: string; m?: string } | undefined) ?? {};
      return (
        <div className="flex items-center gap-1">
          <Input type="number" placeholder="giờ" className="w-20 astryx-number" value={v.h ?? ""} onChange={(e) => set({ ...v, h: e.target.value })} disabled={disabled} />
          <span className="astryx-number text-xs text-muted-foreground/50">:</span>
          <Input type="number" placeholder="phút" className="w-20 astryx-number" value={v.m ?? ""} onChange={(e) => set({ ...v, m: e.target.value })} disabled={disabled} />
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
                 className="astryx-number" placeholder={ph ?? "vd: 21.028, 105.804"} disabled={disabled} />
          <Button type="button" variant="outline" size="sm" className="astryx-control h-7 text-[11px] px-2.5" onClick={capture} disabled={disabled}>
            <MapPin className="mr-1.5 h-3.5 w-3.5" /> GPS
          </Button>
        </div>
      );
    }

    case "computed": {
      const computed = f.formula ? evalFormula(f.formula, values) : null;
      // Ghi lại giá trị tính được để lưu vào data.
      if (computed !== value) queueMicrotask(() => set(computed));
      return (
        <div className="astryx-surface border-border/50 bg-muted/20 px-3 py-2 text-sm flex items-center justify-between">
          <span className="astryx-number text-[10px] text-muted-foreground/60 font-mono tracking-tighter">= {f.formula || "(chưa có công thức)"}</span>
          <span className="astryx-number font-semibold text-primary">{computed ?? "—"}{f.unit ? ` ${f.unit}` : ""}</span>
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
        <div className="astryx-surface overflow-hidden border-border/50">
          <table className="w-full text-[11px]">
            <thead className="bg-muted/40 border-b border-border/50">
              <tr className="astryx-text-label text-[9px] text-muted-foreground/80">
                {cols.map((c) => (
                  <th key={c.key} className="px-3 py-2 text-left font-bold tracking-wider">
                    {c.label}{c.unit ? ` (${c.unit})` : ""}
                  </th>
                ))}
                <th className="w-10" />
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
            <Button type="button" variant="ghost" size="sm" className="astryx-control h-8 text-[11px] w-full rounded-none hover:bg-muted/30" disabled={disabled || cols.length === 0}
                    onClick={() => set([...rows, {}])}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm dòng
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
        <div className="space-y-3 astryx-surface border-border/30 bg-muted/5 p-3">
          {rows.length === 0 && (
            <p className="astryx-text-muted text-[11px] text-center py-4 border border-dashed border-border/50 rounded-md">Chưa có mục. Nhấn "Thêm mục" bên dưới.</p>
          )}
          {rows.map((r, i) => (
            <div key={i} className="astryx-card border-border/50 p-3 bg-card shadow-none">
              <div className="mb-2 flex items-center justify-between">
                <span className="astryx-text-label text-[9px] font-bold text-primary tracking-widest">MỤC #{i + 1}</span>
                <button type="button" disabled={disabled} onClick={() => delRow(i)}
                        className="astryx-control size-6 rounded-full text-rose-500 hover:bg-rose-50 border-none">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
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
          <Button type="button" variant="outline" size="sm" className="astryx-control w-full h-8 text-[11px]" onClick={addRow} disabled={disabled || cols.length === 0}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Thêm mục mới
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
