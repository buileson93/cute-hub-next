// ============================================================================
// ChecklistDesigner.tsx — 3-pane designer cho MẪU BẢNG KIỂM (form_check_item).
//   • LEFT   : danh sách nhóm (section) + hạng mục (item), add/remove/reorder.
//   • CENTER : live preview dùng ChecklistRenderer (giống lúc lập phiếu).
//   • RIGHT  : inspector cho item đang chọn — ten, kiểu kết quả, ngưỡng min/max,
//              bắt buộc, đơn vị, hạng mục/nội dung chi tiết, nhóm lớn, choices.
// Không có state DB — chỉ props/onChange; save do route xử lý.
// ============================================================================
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Trash2, ChevronUp, ChevronDown, ListChecks, Copy, Settings2,
} from "lucide-react";
import { ChecklistRenderer } from "@/components/mirats/ChecklistRenderer";
import type { ChecklistSection, ResultKind } from "@/lib/mirats/checklist";
import {
  DEFAULT_ITEM_OPTIONS, type ChecklistItemOptions,
} from "@/lib/mirats/checklist-item-options";
import type { DesignerItem, DesignerSection } from "@/lib/mirats/checklist-designer-io";

const RESULT_KIND_OPTS: Array<{ v: ResultKind; l: string }> = [
  { v: "dat_khong_dat", l: "Đạt / Không đạt" },
  { v: "so", l: "Giá trị đo (số)" },
  { v: "chon", l: "Lựa chọn" },
  { v: "text", l: "Ghi nhận (văn bản)" },
];

function newSection(idx: number): DesignerSection {
  return {
    ma_section: `SEC${String(idx + 1).padStart(2, "0")}`,
    ten: `Nhóm ${idx + 1}`,
    mo_ta: null,
    position: idx,
    items: [],
  };
}
function newItem(section: DesignerSection): DesignerItem {
  const n = section.items.length + 1;
  const prefix = section.ma_section.replace(/[^A-Za-z0-9]/g, "") || "IT";
  return {
    item_code: `${prefix}${n}`,
    ten: "Hạng mục mới",
    huong_dan: null,
    result_kind: "dat_khong_dat",
    don_vi: null,
    tieu_chuan: null,
    tuy_chon: null,
    bat_buoc: true,
    position: section.items.length,
    options: { ...DEFAULT_ITEM_OPTIONS },
  };
}

type Sel = { sec: number; item: number | null } | null;

export function ChecklistDesigner({
  sections, onChange, tplName,
}: {
  sections: DesignerSection[];
  onChange: (next: DesignerSection[]) => void;
  tplName: string;
}) {
  const [sel, setSel] = useState<Sel>(() =>
    sections.length > 0 && sections[0].items.length > 0 ? { sec: 0, item: 0 } : null,
  );
  const [previewValues, setPreviewValues] = useState<Record<string, unknown>>({});

  const patch = (next: DesignerSection[]) => onChange(next);

  const addSection = () => {
    const next = [...sections, newSection(sections.length)];
    patch(next);
    setSel({ sec: next.length - 1, item: null });
  };
  const removeSection = (si: number) => {
    patch(sections.filter((_, i) => i !== si).map((s, i) => ({ ...s, position: i })));
    setSel(null);
  };
  const moveSection = (si: number, d: -1 | 1) => {
    const j = si + d;
    if (j < 0 || j >= sections.length) return;
    const cp = [...sections];
    [cp[si], cp[j]] = [cp[j], cp[si]];
    patch(cp.map((s, i) => ({ ...s, position: i })));
    setSel({ sec: j, item: null });
  };
  const patchSection = (si: number, p: Partial<DesignerSection>) => {
    patch(sections.map((s, i) => (i === si ? { ...s, ...p } : s)));
  };
  const addItem = (si: number) => {
    const s = sections[si];
    const it = newItem(s);
    const items = [...s.items, it];
    patch(sections.map((x, i) => (i === si ? { ...x, items } : x)));
    setSel({ sec: si, item: items.length - 1 });
  };
  const removeItem = (si: number, ii: number) => {
    const s = sections[si];
    const items = s.items.filter((_, i) => i !== ii).map((it, i) => ({ ...it, position: i }));
    patch(sections.map((x, i) => (i === si ? { ...x, items } : x)));
    setSel(null);
  };
  const dupItem = (si: number, ii: number) => {
    const s = sections[si];
    const src = s.items[ii];
    const clone: DesignerItem = { ...src, item_code: `${src.item_code}_copy`, position: ii + 1 };
    const items = [...s.items.slice(0, ii + 1), clone, ...s.items.slice(ii + 1)].map((it, i) => ({ ...it, position: i }));
    patch(sections.map((x, i) => (i === si ? { ...x, items } : x)));
    setSel({ sec: si, item: ii + 1 });
  };
  const moveItem = (si: number, ii: number, d: -1 | 1) => {
    const s = sections[si];
    const j = ii + d;
    if (j < 0 || j >= s.items.length) return;
    const items = [...s.items];
    [items[ii], items[j]] = [items[j], items[ii]];
    patch(sections.map((x, i) => (i === si ? { ...x, items: items.map((it, k) => ({ ...it, position: k })) } : x)));
    setSel({ sec: si, item: j });
  };
  const patchItem = (si: number, ii: number, p: Partial<DesignerItem>) => {
    patch(sections.map((s, i) => {
      if (i !== si) return s;
      const items = s.items.map((it, k) => (k === ii ? { ...it, ...p } : it));
      return { ...s, items };
    }));
  };
  const patchOptions = (si: number, ii: number, p: Partial<ChecklistItemOptions>) => {
    const cur = sections[si].items[ii].options;
    patchItem(si, ii, { options: { ...cur, ...p } });
  };

  const selectedItem = sel && sel.item != null ? sections[sel.sec]?.items[sel.item] ?? null : null;

  const previewSections: ChecklistSection[] = useMemo(
    () => sections.map((s) => ({ ...s, items: s.items.map((it) => ({ ...it })) })),
    [sections],
  );

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr_340px]">
      {/* LEFT — sections + items */}
      <aside className="min-h-0 overflow-y-auto border-r bg-muted/30">
        <div className="flex items-center justify-between p-2">
          <p className="flex items-center gap-1 text-xs font-semibold uppercase text-muted-foreground">
            <ListChecks className="h-3 w-3" /> Nhóm ({sections.length})
          </p>
          <Button size="sm" variant="outline" className="h-7" onClick={addSection}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <div className="space-y-2 p-2 pb-6">
          {sections.map((s, si) => {
            const isSecSel = sel?.sec === si && sel.item == null;
            return (
              <div key={si} className={`rounded border ${isSecSel ? "border-primary" : ""}`}>
                <div className={`flex items-center gap-1 border-b px-2 py-1 ${isSecSel ? "bg-primary/10" : "bg-secondary/40"}`}>
                  <button
                    type="button" onClick={() => setSel({ sec: si, item: null })}
                    className="flex-1 truncate text-left text-xs font-semibold"
                  >
                    {s.ten}
                    <span className="ml-1 font-mono text-[10px] text-muted-foreground">{s.ma_section}</span>
                  </button>
                  <button type="button" onClick={() => moveSection(si, -1)} className="rounded p-0.5 hover:bg-background" title="Lên">
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => moveSection(si, 1)} className="rounded p-0.5 hover:bg-background" title="Xuống">
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => removeSection(si)} className="rounded p-0.5 hover:bg-background" title="Xoá nhóm">
                    <Trash2 className="h-3 w-3 text-rose-600" />
                  </button>
                </div>
                <ul className="space-y-0.5 p-1">
                  {s.items.map((it, ii) => {
                    const isSel = sel?.sec === si && sel.item === ii;
                    return (
                      <li key={ii}>
                        <button
                          type="button" onClick={() => setSel({ sec: si, item: ii })}
                          className={`group flex w-full items-center gap-1 rounded px-2 py-1 text-left text-xs ${
                            isSel ? "bg-primary/10 text-primary" : "hover:bg-background"
                          }`}
                        >
                          <span className="flex-1 truncate">
                            <span className="font-mono text-[10px] text-muted-foreground">{it.item_code}</span>
                            <span className="ml-1">{it.ten}</span>
                          </span>
                          <Badge variant="outline" className="h-4 shrink-0 px-1 text-[9px]">{it.result_kind}</Badge>
                          <span className="flex opacity-0 transition group-hover:opacity-100">
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); moveItem(si, ii, -1); }} className="rounded p-0.5 hover:bg-secondary">
                              <ChevronUp className="h-3 w-3" />
                            </span>
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); moveItem(si, ii, 1); }} className="rounded p-0.5 hover:bg-secondary">
                              <ChevronDown className="h-3 w-3" />
                            </span>
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); dupItem(si, ii); }} className="rounded p-0.5 hover:bg-secondary" title="Nhân bản">
                              <Copy className="h-3 w-3" />
                            </span>
                            <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); removeItem(si, ii); }} className="rounded p-0.5 hover:bg-secondary">
                              <Trash2 className="h-3 w-3 text-rose-600" />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                  <li>
                    <button
                      type="button" onClick={() => addItem(si)}
                      className="mt-0.5 flex w-full items-center justify-center gap-1 rounded border border-dashed px-2 py-1 text-[11px] text-muted-foreground hover:bg-background"
                    >
                      <Plus className="h-3 w-3" /> Thêm hạng mục
                    </button>
                  </li>
                </ul>
              </div>
            );
          })}
          {sections.length === 0 && (
            <div className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
              Chưa có nhóm. Bấm + để thêm.
            </div>
          )}
        </div>
      </aside>

      {/* CENTER — live preview */}
      <main className="min-h-0 overflow-y-auto bg-background p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 text-center">
            <h1 className="text-lg font-bold uppercase">{tplName || "Mẫu bảng kiểm"}</h1>
            <p className="mt-1 text-[11px] text-muted-foreground">Xem trước theo giao diện lập phiếu — có thể điền thử.</p>
          </div>
          {previewSections.length === 0 || previewSections.every((s) => s.items.length === 0) ? (
            <div className="rounded-md border border-dashed p-12 text-center text-sm text-muted-foreground">
              Thêm nhóm và hạng mục để xem trước.
            </div>
          ) : (
            <ChecklistRenderer
              sections={previewSections}
              values={previewValues as never}
              onChange={(v) => setPreviewValues(v as never)}
            />
          )}
        </div>
      </main>

      {/* RIGHT — inspector */}
      <aside className="min-h-0 overflow-y-auto border-l bg-muted/30 p-3">
        <div className="mb-2 flex items-center gap-1">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-semibold uppercase text-muted-foreground">Thuộc tính</p>
        </div>
        {sel == null ? (
          <div className="rounded border border-dashed p-4 text-center text-xs text-muted-foreground">
            Chọn 1 nhóm hoặc hạng mục ở panel trái.
          </div>
        ) : sel.item == null ? (
          <SectionInspector
            section={sections[sel.sec]}
            onChange={(p) => patchSection(sel.sec, p)}
          />
        ) : selectedItem ? (
          <ItemInspector
            item={selectedItem}
            onPatchItem={(p) => patchItem(sel.sec, sel.item!, p)}
            onPatchOptions={(p) => patchOptions(sel.sec, sel.item!, p)}
          />
        ) : null}
      </aside>
    </div>
  );
}

function SectionInspector({
  section, onChange,
}: {
  section: DesignerSection;
  onChange: (p: Partial<DesignerSection>) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Mã nhóm</Label>
        <Input
          className="font-mono text-xs" value={section.ma_section}
          onChange={(e) => onChange({ ma_section: e.target.value.trim().toUpperCase() })}
          maxLength={40}
        />
      </div>
      <div>
        <Label className="text-xs">Tên nhóm</Label>
        <Input value={section.ten} onChange={(e) => onChange({ ten: e.target.value })} maxLength={200} />
      </div>
      <div>
        <Label className="text-xs">Mô tả (không bắt buộc)</Label>
        <Textarea rows={3} value={section.mo_ta ?? ""} onChange={(e) => onChange({ mo_ta: e.target.value || null })} />
      </div>
    </div>
  );
}

function ItemInspector({
  item, onPatchItem, onPatchOptions,
}: {
  item: DesignerItem;
  onPatchItem: (p: Partial<DesignerItem>) => void;
  onPatchOptions: (p: Partial<ChecklistItemOptions>) => void;
}) {
  const opts = item.options;
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Mã hạng mục</Label>
        <Input
          className="font-mono text-xs" value={item.item_code}
          onChange={(e) => onPatchItem({ item_code: e.target.value.replace(/\s+/g, "_").trim() })}
          maxLength={40}
        />
      </div>
      <div>
        <Label className="text-xs">Tên hạng mục</Label>
        <Input value={item.ten} onChange={(e) => onPatchItem({ ten: e.target.value })} maxLength={200} />
      </div>
      <div>
        <Label className="text-xs">Nhóm lớn (subheader, VD "A. CẢM BIẾN")</Label>
        <Input
          value={opts.nhom_lon ?? ""}
          onChange={(e) => onPatchOptions({ nhom_lon: e.target.value || null })}
          placeholder="Để trống nếu không cần"
        />
      </div>
      <div>
        <Label className="text-xs">Nội dung chi tiết (hiển thị dưới tên)</Label>
        <Textarea
          rows={3}
          value={opts.noi_dung_chi_tiet ?? ""}
          onChange={(e) => onPatchOptions({ noi_dung_chi_tiet: e.target.value || null })}
          placeholder="- Kiểm tra…&#10;- Vệ sinh…"
        />
      </div>

      <div>
        <Label className="text-xs">Kiểu kết quả</Label>
        <Select value={item.result_kind} onValueChange={(v) => onPatchItem({ result_kind: v as ResultKind })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {RESULT_KIND_OPTS.map((o) => (
              <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {item.result_kind === "so" && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Ngưỡng đo</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Min (≥)</Label>
              <Input
                type="number" inputMode="decimal"
                value={opts.tieu_chuan_min == null ? "" : String(opts.tieu_chuan_min)}
                onChange={(e) => onPatchOptions({ tieu_chuan_min: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div>
              <Label className="text-xs">Max (≤)</Label>
              <Input
                type="number" inputMode="decimal"
                value={opts.tieu_chuan_max == null ? "" : String(opts.tieu_chuan_max)}
                onChange={(e) => onPatchOptions({ tieu_chuan_max: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs">Đơn vị</Label>
              <Input
                value={item.don_vi ?? ""}
                onChange={(e) => onPatchItem({ don_vi: e.target.value || null })}
                placeholder="Ohm, V, °C…"
              />
            </div>
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Giá trị đo ngoài ngưỡng sẽ tự chấm Không đạt.</p>
        </div>
      )}

      {item.result_kind === "chon" && (
        <div className="rounded-md border p-2">
          <p className="mb-2 text-[11px] font-semibold uppercase text-muted-foreground">Lựa chọn (mỗi dòng 1 giá trị)</p>
          <Textarea
            rows={4}
            value={(opts.choices ?? item.tuy_chon ?? []).join("\n")}
            onChange={(e) => onPatchOptions({
              choices: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean),
            })}
          />
        </div>
      )}

      <div>
        <Label className="text-xs">Tiêu chuẩn (ghi chú tham chiếu)</Label>
        <Input
          value={item.tieu_chuan ?? ""}
          onChange={(e) => onPatchItem({ tieu_chuan: e.target.value || null })}
          placeholder="ICAO Annex 10, TCVN…"
        />
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={!!item.bat_buoc} onCheckedChange={(v) => onPatchItem({ bat_buoc: v })} />
        <Label className="text-xs">Bắt buộc</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          checked={opts.require_note_when_fail !== false}
          onCheckedChange={(v) => onPatchOptions({ require_note_when_fail: v })}
        />
        <Label className="text-xs">Bắt buộc "Hành động khắc phục" khi K.Đạt</Label>
      </div>
    </div>
  );
}