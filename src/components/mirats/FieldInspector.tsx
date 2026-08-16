// ============================================================================
// FieldInspector.tsx — Bảng thuộc tính cho 1 field đang chọn trong Designer.
// Chỉ trả sự kiện "onChange" — không giữ state riêng, không I/O.
// ============================================================================
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import { usePersistentCollapse } from "@/hooks/use-persistent-collapse";

export type InspectorField = {
  key: string;
  label: string;
  kind: string;
  required: boolean;
  help_text: string | null;
  placeholder: string | null;
  options: string[] | null;
  unit: string | null;
  tieu_chuan: string | null;
  min_value: number | null;
  max_value: number | null;
  col_span: number;
  visible_if: { field_key: string; op: string; value: unknown } | null;
  columns: Array<{ key: string; label: string; kind: string; unit?: string | null; options?: string[] | null }> | null;
  ratings: Array<{ value: string; label: string; color?: string | null }> | null;
  formula: string | null;
  nhom: string | null;
  required_if: { field_key: string; op: string; value: unknown } | null;
  constraint_formula: string | null;
  constraint_message: string | null;
};

export const FIELD_KIND_GROUPS: Array<{ label: string; items: Array<{ v: string; l: string }> }> = [
  {
    label: "Cơ bản",
    items: [
      { v: "text", l: "Văn bản 1 dòng" },
      { v: "textarea", l: "Văn bản nhiều dòng" },
      { v: "number", l: "Số" },
      { v: "date", l: "Ngày" },
      { v: "datetime", l: "Ngày giờ" },
      { v: "duration", l: "Thời lượng (giờ:phút)" },
      { v: "checkbox", l: "Checkbox" },
    ],
  },
  {
    label: "Lựa chọn",
    items: [
      { v: "select", l: "Chọn 1 (dropdown)" },
      { v: "radio", l: "Chọn 1 (radio)" },
      { v: "multiselect", l: "Chọn nhiều" },
      { v: "rating", l: "Đánh giá theo mức" },
    ],
  },
  {
    label: "Kỹ thuật",
    items: [
      { v: "measure", l: "Giá trị đo (có ngưỡng)" },
      { v: "before_after", l: "So sánh trước–sau" },
      { v: "table", l: "Bảng con (lặp dòng)" },
      { v: "section_repeat", l: "Block lặp (nhiều trường con)" },
      { v: "computed", l: "Tự tính từ trường khác" },
    ],
  },
  {
    label: "Đính kèm / ký",
    items: [
      { v: "file", l: "Tệp đính kèm" },
      { v: "photo", l: "Ảnh hiện trường" },
      { v: "signature", l: "Chữ ký (canvas)" },
      { v: "geo", l: "Toạ độ GPS" },
    ],
  },
  {
    label: "Tham chiếu",
    items: [
      { v: "user_ref", l: "Người dùng" },
      { v: "don_vi_ref", l: "Đơn vị" },
      { v: "thiet_bi_ref", l: "Tài sản" },
      { v: "linh_kien_ref", l: "Linh kiện" },
      { v: "vat_tu_ref", l: "Vật tư" },
      { v: "he_thong_thanh_phan_ref", l: "Thành phần hệ thống" },
    ],
  },
  {
    label: "Trình bày",
    items: [
      { v: "heading", l: "Tiêu đề nhóm" },
      { v: "note", l: "Ghi chú" },
      { v: "divider", l: "Đường phân cách" },
    ],
  },
];

const VISIBLE_OPS = [
  { v: "eq", l: "bằng" },
  { v: "neq", l: "khác" },
  { v: "gt", l: ">" },
  { v: "lt", l: "<" },
  { v: "gte", l: "≥" },
  { v: "lte", l: "≤" },
  { v: "in", l: "thuộc" },
  { v: "not_in", l: "không thuộc" },
];

export function FieldInspector({
  field, otherFields, onChange,
}: {
  field: InspectorField;
  otherFields: Array<{ key: string; label: string }>;
  onChange: (patch: Partial<InspectorField>) => void;
}) {
  const f = field;

  const hasOptions = f.kind === "select" || f.kind === "multiselect" || f.kind === "radio";
  const hasNumeric = f.kind === "number" || f.kind === "measure";
  const isTable = f.kind === "table" || f.kind === "section_repeat";
  const isRating = f.kind === "rating";
  const isComputed = f.kind === "computed";
  const isDisplay = f.kind === "heading" || f.kind === "note" || f.kind === "divider";
  const [advOpen, setAdvOpen] = usePersistentCollapse("form-designer", "field-advanced", false);


  return (
    <div className="space-y-4">
      <div>
        <Label className="text-xs">Kiểu trường</Label>
        <Select value={f.kind} onValueChange={(v) => onChange({ kind: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FIELD_KIND_GROUPS.map((g) => (
              <div key={g.label}>
                <div className="px-2 py-1 text-meta font-semibold uppercase text-muted-foreground">{g.label}</div>
                {g.items.map((it) => (
                  <SelectItem key={it.v} value={it.v}>{it.l}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <Label className="text-xs">Nhãn hiển thị</Label>
          <Input value={f.label} onChange={(e) => onChange({ label: e.target.value })} maxLength={200} />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Khoá dữ liệu (key)</Label>
          <Input
            value={f.key}
            onChange={(e) => onChange({ key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() })}
            maxLength={40}
            className="font-mono text-xs"
          />
        </div>

        {!isDisplay && (
          <>
            <div className="col-span-2">
              <Label className="text-xs">Placeholder</Label>
              <Input value={f.placeholder ?? ""} onChange={(e) => onChange({ placeholder: e.target.value })} maxLength={200} />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Hướng dẫn</Label>
              <Textarea rows={2} value={f.help_text ?? ""} onChange={(e) => onChange({ help_text: e.target.value })} maxLength={300} />
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={f.required} onCheckedChange={(v) => onChange({ required: v })} />
              <Label className="text-xs">Bắt buộc nhập</Label>
            </div>
          </>
        )}

        <div className="col-span-2">
          <Label className="text-xs">Độ rộng cột (1–3)</Label>
          <Select value={String(f.col_span)} onValueChange={(v) => onChange({ col_span: Number(v) })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1/3 hàng</SelectItem>
              <SelectItem value="2">2/3 hàng</SelectItem>
              <SelectItem value="3">Nguyên hàng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label className="text-xs">Nhóm trình bày</Label>
          <Input value={f.nhom ?? ""} onChange={(e) => onChange({ nhom: e.target.value })} placeholder="vd: Thông số kỹ thuật" />
        </div>
      </div>

      {hasNumeric && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">Đo lường</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <Label className="text-xs">Đơn vị</Label>
              <Input value={f.unit ?? ""} onChange={(e) => onChange({ unit: e.target.value })} placeholder="vd: dBm, °C, V…" />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Tiêu chuẩn</Label>
              <Input value={f.tieu_chuan ?? ""} onChange={(e) => onChange({ tieu_chuan: e.target.value })} placeholder="vd: ICAO Annex 10" />
            </div>
            <div>
              <Label className="text-xs">Ngưỡng nhỏ nhất</Label>
              <Input type="number" value={f.min_value ?? ""}
                onChange={(e) => onChange({ min_value: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
            <div>
              <Label className="text-xs">Ngưỡng lớn nhất</Label>
              <Input type="number" value={f.max_value ?? ""}
                onChange={(e) => onChange({ max_value: e.target.value === "" ? null : Number(e.target.value) })} />
            </div>
          </div>
        </div>
      )}

      {hasOptions && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">Lựa chọn</p>
          <Textarea
            rows={4}
            placeholder="Mỗi dòng 1 giá trị"
            value={(f.options ?? []).join("\n")}
            onChange={(e) => onChange({
              options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })}
          />
        </div>
      )}

      {isRating && (
        <div className="rounded-md border p-2">
          <p className="mb-2 flex items-center justify-between text-meta font-semibold uppercase text-muted-foreground">
            Mức đánh giá
            <Button size="sm" variant="ghost" className="h-6 px-2"
              onClick={() => onChange({
                ratings: [...(f.ratings ?? []), { value: String((f.ratings?.length ?? 0) + 1), label: "Mức mới", color: null }],
              })}><Plus className="h-3 w-3" /></Button>
          </p>
          <div className="space-y-1">
            {(f.ratings ?? []).map((r, i) => (
              <div key={i} className="grid grid-cols-[60px_1fr_60px_28px] gap-1">
                <Input value={r.value} onChange={(e) => {
                  const cp = [...(f.ratings ?? [])]; cp[i] = { ...cp[i], value: e.target.value };
                  onChange({ ratings: cp });
                }} className="h-7 font-mono text-xs" />
                <Input value={r.label} onChange={(e) => {
                  const cp = [...(f.ratings ?? [])]; cp[i] = { ...cp[i], label: e.target.value };
                  onChange({ ratings: cp });
                }} className="h-7 text-xs" />
                <Input type="color" value={r.color ?? "#64748b"} onChange={(e) => {
                  const cp = [...(f.ratings ?? [])]; cp[i] = { ...cp[i], color: e.target.value };
                  onChange({ ratings: cp });
                }} className="h-7 p-0.5" />
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                  onChange({ ratings: (f.ratings ?? []).filter((_, j) => j !== i) });
                }} aria-label="Xoá mức đánh giá"><Trash2 className="h-3 w-3 text-rose-600" /></Button>
              </div>
            ))}
            {(f.ratings ?? []).length === 0 && (
              <p className="text-meta text-muted-foreground">Chưa có mức. Bấm + để thêm.</p>
            )}
          </div>
        </div>
      )}

      {isTable && (
        <div className="rounded-md border p-2">
          <p className="mb-2 flex items-center justify-between text-meta font-semibold uppercase text-muted-foreground">
            Cột của bảng
            <Button size="sm" variant="ghost" className="h-6 px-2"
              onClick={() => onChange({
                columns: [...(f.columns ?? []), { key: `col_${(f.columns?.length ?? 0) + 1}`, label: "Cột mới", kind: "text" }],
              })}><Plus className="h-3 w-3" /></Button>
          </p>
          <div className="space-y-1">
            {(f.columns ?? []).map((c, i) => (
              <div key={i} className="rounded border p-1.5">
                <div className="grid grid-cols-[1fr_1fr_28px] gap-1">
                  <Input value={c.label} onChange={(e) => {
                    const cp = [...(f.columns ?? [])]; cp[i] = { ...cp[i], label: e.target.value };
                    onChange({ columns: cp });
                  }} className="h-7 text-xs" placeholder="Nhãn" />
                  <Input value={c.key} onChange={(e) => {
                    const cp = [...(f.columns ?? [])]; cp[i] = { ...cp[i], key: e.target.value.replace(/[^a-z0-9_]/gi, "_").toLowerCase() };
                    onChange({ columns: cp });
                  }} className="h-7 font-mono text-xs" placeholder="key" />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                    onChange({ columns: (f.columns ?? []).filter((_, j) => j !== i) });
                  }} aria-label="Xoá cột bảng con"><Trash2 className="h-3 w-3 text-rose-600" /></Button>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  <Select value={c.kind} onValueChange={(v) => {
                    const cp = [...(f.columns ?? [])]; cp[i] = { ...cp[i], kind: v };
                    onChange({ columns: cp });
                  }}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Văn bản</SelectItem>
                      <SelectItem value="number">Số</SelectItem>
                      <SelectItem value="date">Ngày</SelectItem>
                      <SelectItem value="select">Chọn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={c.unit ?? ""} onChange={(e) => {
                    const cp = [...(f.columns ?? [])]; cp[i] = { ...cp[i], unit: e.target.value };
                    onChange({ columns: cp });
                  }} className="h-7 text-xs" placeholder="Đơn vị (nếu có)" />
                </div>
              </div>
            ))}
            {(f.columns ?? []).length === 0 && (
              <p className="text-meta text-muted-foreground">Chưa có cột.</p>
            )}
          </div>
        </div>
      )}

      {isComputed && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">Công thức</p>
          <Input value={f.formula ?? ""} onChange={(e) => onChange({ formula: e.target.value })}
            placeholder="vd: {gia_tri_do} * 0.8" className="font-mono text-xs" />
          <p className="mt-1 text-meta text-muted-foreground">Dùng &#123;key_của_trường&#125; để tham chiếu.</p>
        </div>
      )}

      {/* GĐ1-03 — Panel Nâng cao mặc định thu gọn */}
      <Collapsible open={advOpen} onOpenChange={setAdvOpen} className="rounded-md border">
        <CollapsibleTrigger
          className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-meta font-semibold uppercase text-muted-foreground"
          aria-expanded={advOpen}
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${advOpen ? "rotate-180" : ""}`} aria-hidden />
          Nâng cao (điều kiện / kiểm tra chéo)
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-3 border-t p-2">

      <div className="rounded-md border p-2">
        <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">Điều kiện hiển thị</p>
        {f.visible_if ? (
          <div className="space-y-1">
            <div className="grid grid-cols-[1fr_70px] gap-1">
              <Select
                value={f.visible_if.field_key}
                onValueChange={(v) => onChange({ visible_if: { ...f.visible_if!, field_key: v } })}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Trường…" /></SelectTrigger>
                <SelectContent>
                  {otherFields.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select
                value={f.visible_if.op}
                onValueChange={(v) => onChange({ visible_if: { ...f.visible_if!, op: v } })}
              >
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VISIBLE_OPS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input
              value={String(f.visible_if.value ?? "")}
              onChange={(e) => onChange({ visible_if: { ...f.visible_if!, value: e.target.value } })}
              className="h-7 text-xs" placeholder="Giá trị so sánh"
            />
            <Button size="sm" variant="ghost" className="h-6 w-full text-xs text-rose-600"
              onClick={() => onChange({ visible_if: null })}>Bỏ điều kiện</Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" className="w-full text-xs"
            onClick={() => onChange({ visible_if: { field_key: otherFields[0]?.key ?? "", op: "eq", value: "" } })}
            disabled={otherFields.length === 0}
          >
            + Thêm điều kiện hiển thị
          </Button>
        )}
      </div>

      {!isDisplay && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">
            Bắt buộc theo điều kiện (required_if)
          </p>
          {f.required_if ? (
            <div className="space-y-1">
              <div className="grid grid-cols-[1fr_70px] gap-1">
                <Select value={f.required_if.field_key}
                  onValueChange={(v) => onChange({ required_if: { ...f.required_if!, field_key: v } })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Trường…" /></SelectTrigger>
                  <SelectContent>
                    {otherFields.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={f.required_if.op}
                  onValueChange={(v) => onChange({ required_if: { ...f.required_if!, op: v } })}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VISIBLE_OPS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Input value={String(f.required_if.value ?? "")}
                onChange={(e) => onChange({ required_if: { ...f.required_if!, value: e.target.value } })}
                className="h-7 text-xs" placeholder="Giá trị so sánh" />
              <Button size="sm" variant="ghost" className="h-6 w-full text-xs text-rose-600"
                onClick={() => onChange({ required_if: null })}>Bỏ điều kiện</Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" className="w-full text-xs"
              onClick={() => onChange({ required_if: { field_key: otherFields[0]?.key ?? "", op: "eq", value: "" } })}
              disabled={otherFields.length === 0}>+ Bắt buộc khi …</Button>
          )}
        </div>
      )}

      {!isDisplay && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-meta font-semibold uppercase text-muted-foreground">
            Kiểm tra chéo trường (constraint)
          </p>
          <Input value={f.constraint_formula ?? ""}
            onChange={(e) => onChange({ constraint_formula: e.target.value })}
            className="font-mono text-xs" placeholder="vd: {gia_tri_sau} >= {gia_tri_truoc}" />
          <Input value={f.constraint_message ?? ""}
            onChange={(e) => onChange({ constraint_message: e.target.value })}
            className="mt-1 text-xs" placeholder="Thông báo khi vi phạm (tuỳ chọn)" maxLength={200} />
          <p className="mt-1 text-meta text-muted-foreground">
            Biểu thức boolean: dùng &#123;key&#125;, phép so sánh &lt;,&gt;,==, &amp;&amp;, ||, !.
          </p>
        </div>
      )}
        </CollapsibleContent>
      </Collapsible>




      <div className="text-meta text-muted-foreground">
        <Badge variant="outline" className="mr-1 font-mono text-meta">kind={f.kind}</Badge>
        <Badge variant="outline" className="font-mono text-meta">col={f.col_span}</Badge>
      </div>
    </div>
  );
}
