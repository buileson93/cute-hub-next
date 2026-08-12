// ============================================================================
// FieldPreview.tsx — Preview 1 field theo kind. Chỉ hiển thị (disabled), KHÔNG
// bắt sự kiện — mục đích: cho người thiết kế "nhìn" cách người dùng sẽ thấy.
// ============================================================================
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Camera, FileSignature, MapPin, Timer, Table as TableIcon, Calculator,
  PackageSearch, Wrench, Layers,
} from "lucide-react";

export type PreviewField = {
  key: string;
  label: string;
  kind: string;
  required: boolean;
  options: string[] | null;
  help_text: string | null;
  placeholder: string | null;
  unit: string | null;
  tieu_chuan: string | null;
  min_value: number | null;
  max_value: number | null;
  columns: Array<{ key: string; label: string; kind: string; unit?: string | null }> | null;
  ratings: Array<{ value: string; label: string; color?: string | null }> | null;
  formula: string | null;
};

function LabelRow({ f }: { f: PreviewField }) {
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

function Help({ f }: { f: PreviewField }) {
  if (!f.help_text) return null;
  return <p className="mt-1 text-xs text-muted-foreground">{f.help_text}</p>;
}

export function FieldPreview({ f }: { f: PreviewField }) {
  const ph = f.placeholder ?? undefined;

  // Kiểu trình bày thuần
  if (f.kind === "heading") {
    return <h3 className="mt-2 border-b pb-1 text-base font-semibold">{f.label}</h3>;
  }
  if (f.kind === "divider") {
    return <hr className="my-1 border-dashed" />;
  }
  if (f.kind === "note") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
        {f.help_text || f.label}
      </div>
    );
  }

  return (
    <div>
      <LabelRow f={f} />
      {renderInner(f, ph)}
      <Help f={f} />
    </div>
  );
}

function renderInner(f: PreviewField, ph: string | undefined) {
  switch (f.kind) {
    case "text":
    case "user_ref":
    case "don_vi_ref":
    case "thiet_bi_ref":
    case "linh_kien_ref":
    case "vat_tu_ref":
    case "he_thong_thanh_phan_ref":
      return (
        <div className="relative">
          <Input disabled placeholder={ph ?? refPlaceholder(f.kind)} />
          {refIcon(f.kind) && (
            <span className="absolute right-2 top-2 text-muted-foreground">{refIcon(f.kind)}</span>
          )}
        </div>
      );
    case "textarea":
      return <Textarea disabled rows={3} placeholder={ph} />;
    case "number":
      return (
        <div className="flex items-stretch">
          <Input type="number" disabled placeholder={ph ?? "0"} />
          {f.unit && (
            <span className="ml-2 flex items-center rounded-md border bg-muted px-2 text-xs text-muted-foreground">
              {f.unit}
            </span>
          )}
        </div>
      );
    case "date":
      return <Input type="date" disabled />;
    case "datetime":
      return <Input type="datetime-local" disabled />;
    case "select":
      return (
        <Select disabled>
          <SelectTrigger><SelectValue placeholder={ph ?? "Chọn…"} /></SelectTrigger>
          <SelectContent>
            {(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    case "multiselect":
      return (
        <div className="flex flex-wrap gap-1 rounded-md border p-2 text-xs text-muted-foreground">
          {(f.options ?? []).length === 0 && <span>Chưa có lựa chọn</span>}
          {(f.options ?? []).map((o) => (
            <Badge key={o} variant="secondary" className="font-normal">{o}</Badge>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <Checkbox disabled />
          <span className="text-sm text-muted-foreground">{ph ?? "Đánh dấu nếu đúng"}</span>
        </div>
      );
    case "file":
    case "photo":
      return (
        <div className="flex items-center justify-center rounded-md border border-dashed p-4 text-xs text-muted-foreground">
          {f.kind === "photo" ? <Camera className="mr-2 h-4 w-4" /> : null}
          Kéo/thả tệp hoặc bấm để chọn
        </div>
      );
    case "signature":
      return (
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed text-xs text-muted-foreground">
          <FileSignature className="mr-2 h-4 w-4" /> Vùng ký (canvas)
        </div>
      );
    case "geo":
      return (
        <Input disabled placeholder={ph ?? "Toạ độ GPS (lat, lng)"}
          className="pl-8" style={{ backgroundImage: "none" }} />
      );
    case "duration":
      return (
        <div className="flex items-center gap-1">
          <Input disabled placeholder="giờ" className="w-20" />
          <span className="text-xs text-muted-foreground">:</span>
          <Input disabled placeholder="phút" className="w-20" />
          <Timer className="ml-1 h-4 w-4 text-muted-foreground" />
        </div>
      );
    case "measure":
      return (
        <div className="grid grid-cols-3 gap-1">
          <Input disabled placeholder={ph ?? "Giá trị đo"} />
          <div className="flex items-center rounded-md border bg-muted px-2 text-xs text-muted-foreground">
            {f.unit || "—"}
          </div>
          <div className="flex items-center justify-center rounded-md border bg-emerald-50 px-2 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Đạt / Không đạt
          </div>
          {(f.min_value != null || f.max_value != null) && (
            <p className="col-span-3 text-[11px] text-muted-foreground">
              Ngưỡng: {f.min_value ?? "—"} … {f.max_value ?? "—"} {f.unit ?? ""}
            </p>
          )}
        </div>
      );
    case "before_after":
      return (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-md border p-2">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">TRƯỚC</p>
            <Input disabled placeholder="Giá trị / mô tả" />
          </div>
          <div className="rounded-md border p-2">
            <p className="mb-1 text-[11px] font-medium text-muted-foreground">SAU</p>
            <Input disabled placeholder="Giá trị / mô tả" />
          </div>
        </div>
      );
    case "rating": {
      const items = f.ratings ?? [
        { value: "1", label: "Xấu" },
        { value: "2", label: "TB" },
        { value: "3", label: "Tốt" },
      ];
      return (
        <div className="flex flex-wrap gap-1">
          {items.map((r) => (
            <span
              key={r.value}
              className="rounded-md border px-2 py-1 text-xs"
              style={r.color ? { borderColor: r.color, color: r.color } : undefined}
            >
              {r.label}
            </span>
          ))}
        </div>
      );
    }
    case "radio":
      return (
        <div className="space-y-1">
          {(f.options ?? ["Đạt", "Không đạt"]).map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="radio" disabled name={`r_${f.key}`} /> {o}
            </label>
          ))}
        </div>
      );
    case "table":
      return (
        <div className="rounded-md border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                {(f.columns ?? []).map((c) => (
                  <th key={c.key} className="px-2 py-1 text-left font-medium">
                    {c.label}{c.unit ? ` (${c.unit})` : ""}
                  </th>
                ))}
                {(f.columns ?? []).length === 0 && <th className="px-2 py-1 text-muted-foreground">Chưa khai cột</th>}
              </tr>
            </thead>
            <tbody>
              <tr>
                {(f.columns ?? []).map((c) => (
                  <td key={c.key} className="border-t px-2 py-1 text-muted-foreground">—</td>
                ))}
              </tr>
            </tbody>
          </table>
          <div className="border-t p-1 text-right text-[11px] text-muted-foreground">
            <TableIcon className="mr-1 inline h-3 w-3" /> Bảng lặp — người dùng thêm dòng khi nhập
          </div>
        </div>
      );
    case "section_repeat":
      return (
        <div className="rounded-md border bg-muted/10 p-2">
          <div className="mb-1 text-[11px] font-medium text-muted-foreground">
            Block lặp — người nhập có thể thêm nhiều "mục", mỗi mục gồm các trường con:
          </div>
          <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
            {(f.columns ?? []).map((c) => (
              <div key={c.key} className="rounded border bg-background px-2 py-1 text-xs">
                <span className="font-medium">{c.label}</span>
                <span className="ml-2 text-muted-foreground">({c.kind}{c.unit ? ` · ${c.unit}` : ""})</span>
              </div>
            ))}
            {(f.columns ?? []).length === 0 && (
              <div className="text-[11px] text-amber-600">Chưa cấu hình trường con — mở Inspector để thêm.</div>
            )}
          </div>
        </div>
      );
    case "computed":
      return (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-2 py-1.5 text-sm">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-xs text-muted-foreground">
            = {f.formula || "chưa nhập công thức"}
          </span>
        </div>
      );
    default:
      return <Input disabled placeholder={ph ?? f.kind} />;
  }
}

function refIcon(kind: string) {
  if (kind === "linh_kien_ref") return <PackageSearch className="h-4 w-4" />;
  if (kind === "vat_tu_ref") return <Wrench className="h-4 w-4" />;
  if (kind === "he_thong_thanh_phan_ref") return <Layers className="h-4 w-4" />;
  if (kind === "thiet_bi_ref") return <PackageSearch className="h-4 w-4" />;
  if (kind === "geo") return <MapPin className="h-4 w-4" />;
  return null;
}
function refPlaceholder(kind: string) {
  switch (kind) {
    case "user_ref": return "Chọn người dùng…";
    case "don_vi_ref": return "Chọn đơn vị…";
    case "thiet_bi_ref": return "Chọn tài sản…";
    case "linh_kien_ref": return "Chọn linh kiện…";
    case "vat_tu_ref": return "Chọn vật tư…";
    case "he_thong_thanh_phan_ref": return "Chọn thành phần hệ thống…";
    default: return "";
  }
}
