/**
 * Task 45 — Form render động cho custom fields (attrs JSONB).
 *
 * Dùng cho FormDialog: truyền entity ("thiet_bi"/"he_thong"/...) + attrs hiện tại
 * → render input theo `dinh_nghia_truong`. Ghi vào `attrs` JSONB của thực thể.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchDinhNghiaTruong } from "@/lib/mirats/custom-fields/api";
import type { DinhNghiaTruong } from "@/lib/mirats/custom-fields/registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  entity: string;
  giaTri: Record<string, unknown>;
  onChange: (attrs: Record<string, unknown>) => void;
  disabled?: boolean;
}

export function CustomFieldsForm({ entity, giaTri, onChange, disabled }: Props) {
  const { data: defs, isLoading } = useQuery({
    queryKey: ["dinh_nghia_truong", entity],
    queryFn: () => fetchDinhNghiaTruong(entity),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Đang tải trường tuỳ biến…</div>;
  if (!defs || defs.length === 0) return null;

  const setValue = (k: string, v: unknown) => onChange({ ...giaTri, [k]: v });

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-muted-foreground">Trường tuỳ biến</div>
      {defs.map((d) => (
        <FieldRow key={d.key} def={d} value={giaTri[d.key]} onChange={(v) => setValue(d.key, v)} disabled={disabled} />
      ))}
    </div>
  );
}

interface RowProps {
  def: DinhNghiaTruong;
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}

function FieldRow({ def, value, onChange, disabled }: RowProps) {
  const id = `attr-${def.key}`;
  const nhan = (
    <Label htmlFor={id} className="flex items-center gap-1">
      {def.nhan}
      {def.batBuoc && <span className="text-destructive">*</span>}
    </Label>
  );

  if (def.loai === "checkbox") {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={Boolean(value)}
          disabled={disabled}
          onCheckedChange={(c) => onChange(c === true)}
        />
        {nhan}
      </div>
    );
  }

  if (def.loai === "chon") {
    return (
      <div className="space-y-1.5">
        {nhan}
        <Select
          value={typeof value === "string" ? value : ""}
          onValueChange={(v) => onChange(v)}
          disabled={disabled}
        >
          <SelectTrigger id={id}><SelectValue placeholder="Chọn…" /></SelectTrigger>
          <SelectContent>
            {(def.luaChon ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {def.moTa && <p className="text-xs text-muted-foreground">{def.moTa}</p>}
      </div>
    );
  }

  const type = def.loai === "so" ? "number" : def.loai === "ngay" ? "date" : "text";
  return (
    <div className="space-y-1.5">
      {nhan}
      <Input
        id={id}
        type={type}
        disabled={disabled}
        value={value == null ? "" : String(value)}
        min={def.min}
        max={def.max}
        onChange={(e) => {
          const raw = e.target.value;
          if (raw === "") return onChange(undefined);
          if (def.loai === "so") {
            const n = Number(raw);
            onChange(Number.isNaN(n) ? raw : n);
          } else {
            onChange(raw);
          }
        }}
      />
      {def.moTa && <p className="text-xs text-muted-foreground">{def.moTa}</p>}
    </div>
  );
}
