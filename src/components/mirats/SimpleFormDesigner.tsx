// ============================================================================
// SimpleFormDesigner.tsx — chế độ THIẾT KẾ ĐƠN GIẢN cho người không rành DB.
//
// Ẩn hết col_span, visible_if, formula, required_if, constraint, tiêu chuẩn…
// Chỉ còn: câu hỏi (label), kiểu trả lời (kind), bắt buộc, gợi ý, lựa chọn
// (nếu là chọn). Mỗi câu hỏi là 1 thẻ dọc.
//
// Cải tiến:
// - Kéo thả (native HTML5 drag & drop) qua tay cầm GripVertical để sắp xếp.
// - Bảng hướng dẫn nhanh có thể đóng, kèm ví dụ cụ thể cho từng kiểu trường.
// - Tooltip mô tả từng thuộc tính (Bắt buộc, Gợi ý, Lựa chọn…).
// ============================================================================
import { useState } from "react";
import {
  Plus, Trash2, ChevronUp, ChevronDown, Copy, Type, AlignLeft, Hash,
  Calendar, Clock, CheckSquare, ListChecks, CircleDot, Star, Image as ImageIcon,
  PenLine, Paperclip, MapPin, GripVertical, HelpCircle, X, Info, Lightbulb,
  MousePointerClick, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InspectorField } from "./FieldInspector";

type Field = InspectorField & { id?: string; position: number };

type KindOpt = {
  value: InspectorField["kind"];
  label: string;
  desc: string;
  example: string;
  Icon: React.ComponentType<{ className?: string }>;
  hasOptions?: boolean;
};

const KINDS: KindOpt[] = [
  { value: "text",       label: "Chữ ngắn",     desc: "Một dòng chữ",               example: "VD: Người thực hiện — 'Nguyễn Văn A'",              Icon: Type },
  { value: "textarea",   label: "Chữ dài",      desc: "Nhiều dòng, mô tả",          example: "VD: Ghi chú tình trạng — 'Thiết bị hoạt động ổn định…'", Icon: AlignLeft },
  { value: "number",     label: "Số",           desc: "Số đo, số lượng",            example: "VD: Điện áp đo được — 220",                          Icon: Hash },
  { value: "date",       label: "Ngày",         desc: "Chọn ngày",                  example: "VD: Ngày kiểm tra — 15/03/2026",                     Icon: Calendar },
  { value: "datetime",   label: "Ngày giờ",     desc: "Chọn ngày và giờ",           example: "VD: Thời điểm sự cố — 15/03/2026 08:30",             Icon: Clock },
  { value: "boolean",    label: "Có / Không",   desc: "Bật tắt 1 lựa chọn",         example: "VD: Đã vệ sinh thiết bị? — Có",                      Icon: CheckSquare },
  { value: "select",     label: "Chọn 1",       desc: "Chọn 1 mục trong danh sách", example: "VD: Kết luận — Đạt / Không đạt",                     Icon: CircleDot,  hasOptions: true },
  { value: "multiselect",label: "Chọn nhiều",   desc: "Tick nhiều mục",             example: "VD: Hạng mục đã kiểm — Nguồn, Ăng-ten, Cáp",         Icon: ListChecks, hasOptions: true },
  { value: "rating",     label: "Đánh giá sao", desc: "1–5 sao",                    example: "VD: Chất lượng dịch vụ — 4/5",                       Icon: Star },
  { value: "photo",      label: "Ảnh chụp",     desc: "Tải ảnh minh chứng",         example: "VD: Ảnh hiện trường sự cố",                          Icon: ImageIcon },
  { value: "signature",  label: "Chữ ký",       desc: "Vẽ chữ ký",                  example: "VD: Chữ ký người thực hiện / phụ trách",             Icon: PenLine },
  { value: "attachment", label: "Tệp đính kèm", desc: "PDF, Word, Excel…",          example: "VD: Đính kèm biên bản gốc scan",                     Icon: Paperclip },
  { value: "location",   label: "Vị trí",       desc: "Toạ độ GPS",                 example: "VD: Vị trí ghi nhận sự cố ngoài hiện trường",        Icon: MapPin },
];

// MIME riêng để phân biệt: kéo 1 KIỂU TRƯỜNG mới từ palette
// vs. kéo 1 CÂU HỎI đã có để sắp xếp lại.
const MIME_NEW_KIND = "application/x-mirats-new-kind";
const MIME_REORDER = "application/x-mirats-reorder-idx";

function slug(s: string, i: number) {
  const base = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return base || `cau_hoi_${i + 1}`;
}

function newFieldOfKind(kind: InspectorField["kind"], position: number): Field {
  const k = KINDS.find((x) => x.value === kind) ?? KINDS[0];
  return {
    key: `cau_hoi_${position + 1}`,
    label: `Câu hỏi mới (${k.label})`,
    kind,
    required: false, help_text: null, placeholder: null,
    options: k.hasOptions ? ["Lựa chọn 1", "Lựa chọn 2"] : null,
    unit: null, tieu_chuan: null, min_value: null, max_value: null,
    col_span: 3, visible_if: null, columns: null, ratings: null,
    formula: null, nhom: null, position,
    required_if: null, constraint_formula: null, constraint_message: null,
  };
}

function HelpDot({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground hover:text-foreground" aria-label="Trợ giúp">
          <Info className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs leading-relaxed">
        {children}
      </TooltipContent>
    </Tooltip>
  );
}

export function SimpleFormDesigner({
  fields, onChange, tplName, tplDesc, onTplChange,
}: {
  fields: Field[];
  onChange: (next: Field[]) => void;
  tplName: string;
  tplDesc: string;
  onTplChange: (patch: { ten?: string; mo_ta?: string }) => void;
}) {
  const [showGuide, setShowGuide] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("mirats.simple-designer.guide") !== "0";
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  // Đang kéo 1 KIỂU MỚI từ palette (kind.value) — để hiển thị drop slot.
  const [dragKind, setDragKind] = useState<InspectorField["kind"] | null>(null);
  // Slot đang hover khi kéo (index chèn 0..fields.length).
  const [slotOver, setSlotOver] = useState<number | null>(null);

  const dismissGuide = () => {
    setShowGuide(false);
    if (typeof window !== "undefined") localStorage.setItem("mirats.simple-designer.guide", "0");
  };
  const openGuide = () => {
    setShowGuide(true);
    if (typeof window !== "undefined") localStorage.setItem("mirats.simple-designer.guide", "1");
  };

  const patch = (i: number, p: Partial<Field>) =>
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...p } : f)));

  const addField = () => {
    const i = fields.length;
    onChange([
      ...fields,
      newFieldOfKind("text", i),
    ]);
  };
  const remove = (i: number) => onChange(fields.filter((_, idx) => idx !== i));
  const dup = (i: number) => {
    const f = fields[i];
    onChange([
      ...fields.slice(0, i + 1),
      { ...f, id: undefined, key: `${f.key}_copy`, position: i + 1 },
      ...fields.slice(i + 1),
    ]);
  };
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const copy = [...fields];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };
  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= fields.length) return;
    const copy = [...fields];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    onChange(copy);
  };

  // Chèn 1 câu hỏi kiểu `kind` vào vị trí `at` (0..fields.length).
  const insertKindAt = (kind: InspectorField["kind"], at: number) => {
    const clamped = Math.max(0, Math.min(at, fields.length));
    const nf = newFieldOfKind(kind, clamped);
    const copy = [...fields];
    copy.splice(clamped, 0, nf);
    onChange(copy.map((f, idx) => ({ ...f, position: idx })));
  };

  // Xử lý drop chung cho các slot chèn: có thể là kéo kiểu mới hoặc kéo reorder.
  const handleSlotDrop = (at: number, e: React.DragEvent) => {
    e.preventDefault();
    const kind = e.dataTransfer.getData(MIME_NEW_KIND) as InspectorField["kind"] | "";
    const reorderRaw = e.dataTransfer.getData(MIME_REORDER);
    if (kind) {
      insertKindAt(kind, at);
    } else if (reorderRaw !== "") {
      const from = Number(reorderRaw);
      if (Number.isFinite(from)) {
        // Khi kéo card #from vào slot at: nếu at > from, phải trừ 1 để bù việc splice.
        const to = at > from ? at - 1 : at;
        moveTo(from, to);
      }
    }
    setDragIdx(null); setOverIdx(null); setDragKind(null); setSlotOver(null);
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="mx-auto grid max-w-6xl gap-4 p-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* ================= PALETTE ================= */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Kiểu câu hỏi
              <HelpDot>
                Kéo một ô bên dưới thả vào biểu mẫu để thêm câu hỏi mới. Hoặc bấm để thêm vào cuối.
              </HelpDot>
            </div>
            <div className="mb-2 flex items-center gap-1 rounded-md bg-muted/60 px-2 py-1 text-meta text-muted-foreground">
              <MousePointerClick className="h-3 w-3" />
              Kéo &amp; thả vào biểu mẫu
            </div>
            <ul className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
              {KINDS.map((k) => {
                const KI = k.Icon;
                const active = dragKind === k.value;
                return (
                  <li key={k.value}>
                    <button
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        setDragKind(k.value);
                        e.dataTransfer.effectAllowed = "copy";
                        e.dataTransfer.setData(MIME_NEW_KIND, k.value);
                        // Payload phụ để 1 số browser cho phép drag.
                        e.dataTransfer.setData("text/plain", k.value);
                      }}
                      onDragEnd={() => { setDragKind(null); setSlotOver(null); }}
                      onClick={() => insertKindAt(k.value, fields.length)}
                      title={`${k.label} — ${k.desc}\nKéo hoặc bấm để thêm.\n${k.example}`}
                      className={`group flex w-full cursor-grab items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left text-xs shadow-sm transition hover:border-primary hover:bg-primary/5 active:cursor-grabbing ${
                        active ? "border-primary bg-primary/10 ring-1 ring-primary/40" : ""
                      }`}
                    >
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded bg-primary/10 text-primary">
                        <KI className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{k.label}</span>
                        <span className="block truncate text-meta text-muted-foreground">{k.desc}</span>
                      </span>
                      <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ================= MAIN CANVAS ================= */}
        <div className="space-y-4">
        {/* Hướng dẫn nhanh — có thể đóng, có thể mở lại */}
        {showGuide ? (
          <div className="relative rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <button
              type="button"
              onClick={dismissGuide}
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-background hover:text-foreground"
              aria-label="Đóng hướng dẫn"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div className="mb-2 flex items-center gap-2 font-semibold text-primary">
              <Lightbulb className="h-4 w-4" />
              Hướng dẫn nhanh — thiết kế mẫu trong 3 bước
            </div>
            <ol className="ml-4 list-decimal space-y-1 text-xs text-foreground/90">
              <li>
                <b>Đặt tên biểu mẫu</b> ở khung trên cùng (VD: <i>“Phiếu bảo dưỡng định kỳ tháng”</i>).
              </li>
              <li>
                Bấm <b>Thêm câu hỏi</b> ở cuối trang cho mỗi câu hỏi. Nhập nội dung câu hỏi vào ô lớn
                (VD: <i>“Điện áp đo được là bao nhiêu?”</i>).
              </li>
              <li>
                Chọn <b>Kiểu trả lời</b> phù hợp: Chữ ngắn, Số, Ngày, Chọn 1… Bật <b>Bắt buộc</b> nếu câu
                hỏi phải điền.
              </li>
            </ol>
            <div className="mt-2 rounded-md bg-background/60 p-2 text-xs text-muted-foreground">
              <b className="text-foreground">Mẹo:</b> Kéo một <b>kiểu câu hỏi</b> ở bảng bên trái thả vào biểu mẫu để thêm nhanh.
              Kéo biểu tượng <GripVertical className="mx-0.5 inline h-3 w-3" /> bên trái mỗi thẻ để sắp xếp lại thứ tự.
              Bấm <Eye /> <i>Xem trước</i> ở đầu trang để điền thử.
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1 text-meta sm:grid-cols-2">
              {KINDS.slice(0, 8).map((k) => (
                <div key={k.value} className="flex items-start gap-1.5">
                  <k.Icon className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                  <span><b>{k.label}:</b> <span className="text-muted-foreground">{k.example}</span></span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={openGuide}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Hiện hướng dẫn nhanh
          </button>
        )}

        {/* Tiêu đề mẫu */}
        <div className="rounded-lg border bg-card p-4 shadow-sm">
          <Label className="text-xs text-muted-foreground">Tên biểu mẫu</Label>
          <Input
            value={tplName}
            onChange={(e) => onTplChange({ ten: e.target.value })}
            placeholder="Ví dụ: Phiếu bảo dưỡng định kỳ tháng"
            className="mt-1 border-0 border-b border-dashed px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
          <Textarea
            value={tplDesc}
            onChange={(e) => onTplChange({ mo_ta: e.target.value })}
            placeholder="Mô tả ngắn cho người điền (không bắt buộc)…"
            rows={2}
            className="mt-2 border-0 px-0 text-sm shadow-none focus-visible:ring-0"
          />
        </div>

        {/* Danh sách câu hỏi — có drop-slot giữa các thẻ */}
        {/* Slot đầu tiên (chèn vào đầu) */}
        <DropSlot
          index={0}
          active={dragKind !== null || dragIdx !== null}
          hover={slotOver === 0}
          onEnter={() => setSlotOver(0)}
          onLeave={() => setSlotOver((v) => (v === 0 ? null : v))}
          onDrop={(e) => handleSlotDrop(0, e)}
        />
        {fields.map((f, i) => {
          const kind = KINDS.find((k) => k.value === f.kind) ?? KINDS[0];
          const Icon = kind.Icon;
          const isDragOver = overIdx === i && dragIdx !== null && dragIdx !== i;
          return (
            <div key={i}>
            <div
              onDragOver={(e) => {
                if (dragIdx === null && dragKind === null) return;
                e.preventDefault();
                if (overIdx !== i) setOverIdx(i);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const kindPayload = e.dataTransfer.getData(MIME_NEW_KIND) as InspectorField["kind"] | "";
                if (kindPayload) {
                  // Thả kiểu mới vào giữa thẻ ⇒ chèn TRƯỚC thẻ hiện tại.
                  insertKindAt(kindPayload, i);
                } else if (dragIdx !== null && dragIdx !== i) {
                  moveTo(dragIdx, i);
                }
                setDragIdx(null); setOverIdx(null); setDragKind(null); setSlotOver(null);
              }}
              onDragLeave={() => { if (overIdx === i) setOverIdx(null); }}
              className={`group relative rounded-lg border bg-card p-4 shadow-sm transition hover:border-primary/40 ${
                dragIdx === i ? "opacity-40" : ""
              } ${isDragOver ? "border-primary ring-2 ring-primary/30" : ""}`}
            >
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    setDragIdx(i);
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(MIME_REORDER, String(i));
                    e.dataTransfer.setData("text/plain", String(i));
                  }}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  className="-ml-1 cursor-grab rounded p-1 hover:bg-secondary active:cursor-grabbing"
                  title="Kéo để sắp xếp lại thứ tự"
                  aria-label={`Kéo câu hỏi ${i + 1} để sắp xếp`}
                >
                  <GripVertical className="h-3.5 w-3.5" />
                </button>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono">#{i + 1}</span>
                <Icon className="h-3.5 w-3.5" />
                <span>{kind.label}</span>
                <HelpDot>
                  <b>{kind.label}</b> — {kind.desc}.<br />
                  <span className="text-muted-foreground">{kind.example}</span>
                </HelpDot>
                <div className="ml-auto flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => move(i, -1)} className="rounded p-1 hover:bg-secondary" title="Lên">
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => move(i, 1)} className="rounded p-1 hover:bg-secondary" title="Xuống">
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => dup(i)} className="rounded p-1 hover:bg-secondary" title="Nhân bản">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(i)} className="rounded p-1 hover:bg-secondary" title="Xoá">
                    <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                  </button>
                </div>
              </div>

              <Input
                value={f.label}
                onChange={(e) => {
                  const label = e.target.value;
                  const newKey = !f.id ? slug(label, i) : f.key;
                  patch(i, { label, key: newKey });
                }}
                placeholder="Nhập câu hỏi… (VD: Điện áp đo được là bao nhiêu?)"
                className="border-0 border-b border-dashed px-0 text-base font-medium shadow-none focus-visible:ring-0"
              />

              <div className="mt-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  Kiểu trả lời
                  <HelpDot>
                    Chọn định dạng phù hợp để hệ thống kiểm tra hợp lệ và hiển thị đúng khi điền.
                    VD: chọn <b>Số</b> nếu người điền phải nhập giá trị đo.
                  </HelpDot>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {KINDS.map((k) => {
                    const active = k.value === f.kind;
                    const KI = k.Icon;
                    return (
                      <button
                        key={k.value}
                        type="button"
                        title={`${k.label} — ${k.desc}\n${k.example}`}
                        onClick={() => patch(i, { kind: k.value, options: k.hasOptions && !f.options ? ["Lựa chọn 1", "Lựa chọn 2"] : f.options })}
                        className={`flex items-start gap-2 rounded-md border p-2 text-left text-xs transition ${
                          active ? "border-primary bg-primary/5 text-primary" : "border-transparent bg-muted/40 hover:border-muted-foreground/30"
                        }`}
                      >
                        <KI className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-medium">{k.label}</div>
                          <div className="truncate text-meta opacity-70">{k.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {kind.hasOptions && (
                <div className="mt-3">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    Các lựa chọn (mỗi dòng 1 mục)
                    <HelpDot>
                      Mỗi dòng là một lựa chọn người dùng thấy. VD với “Kết luận”:
                      <br /><i>Đạt</i><br /><i>Không đạt</i><br /><i>Cần theo dõi</i>
                    </HelpDot>
                  </Label>
                  <Textarea
                    value={(f.options ?? []).join("\n")}
                    onChange={(e) => patch(i, { options: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
                    rows={Math.max(3, (f.options?.length ?? 0) + 1)}
                    placeholder={"Lựa chọn 1\nLựa chọn 2\nLựa chọn 3"}
                    className="mt-1 text-sm"
                  />
                </div>
              )}

              <div className="mt-3">
                <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Gợi ý điền (không bắt buộc)
                  <HelpDot>
                    Dòng chú thích nhỏ hiển thị dưới câu hỏi, giúp người điền hiểu đúng đơn vị / cách đo.
                    VD: <i>“Đơn vị Volt, đo ở đầu vào biến áp.”</i>
                  </HelpDot>
                </Label>
                <Input
                  value={f.help_text ?? ""}
                  onChange={(e) => patch(i, { help_text: e.target.value || null })}
                  placeholder="VD: Đơn vị Volt, đo ở đầu vào biến áp"
                  className="mt-1 text-sm"
                />
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Switch
                  checked={f.required}
                  onCheckedChange={(v) => patch(i, { required: v })}
                  id={`req-${i}`}
                />
                <Label htmlFor={`req-${i}`} className="cursor-pointer text-xs">
                  Bắt buộc phải điền
                </Label>
                <HelpDot>
                  Khi bật, người điền không thể gửi biểu mẫu nếu bỏ trống câu hỏi này.
                </HelpDot>
              </div>
            </div>
            {/* Slot chèn NGAY SAU thẻ #i */}
            <DropSlot
              index={i + 1}
              active={dragKind !== null || dragIdx !== null}
              hover={slotOver === i + 1}
              onEnter={() => setSlotOver(i + 1)}
              onLeave={() => setSlotOver((v) => (v === i + 1 ? null : v))}
              onDrop={(e) => handleSlotDrop(i + 1, e)}
            />
            </div>
          );
        })}

        {fields.length === 0 && (
          <div
            onDragOver={(e) => { if (dragKind) { e.preventDefault(); setSlotOver(0); } }}
            onDrop={(e) => handleSlotDrop(0, e)}
            className={`rounded-lg border-2 border-dashed p-10 text-center text-sm transition ${
              dragKind ? "border-primary bg-primary/5 text-primary" : "text-muted-foreground"
            }`}
          >
            {dragKind ? "Thả vào đây để thêm câu hỏi đầu tiên." : "Chưa có câu hỏi nào. Kéo một kiểu ở bảng bên trái vào đây, hoặc bấm nút bên dưới."}
          </div>
        )}

        <Button
          onClick={addField}
          variant="outline"
          className="w-full border-dashed py-6 text-sm hover:border-primary hover:bg-primary/5"
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm câu hỏi (Chữ ngắn)
        </Button>

        <p className="pt-2 text-center text-meta text-muted-foreground">
          Cần cấu hình nâng cao (công thức, ẩn hiện có điều kiện, tiêu chuẩn…)? Chuyển sang chế độ <b>Nâng cao</b> ở đầu trang.
        </p>
        </div>
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// DropSlot — khe nhỏ giữa các câu hỏi, chỉ nổi lên khi đang kéo.
// ============================================================================
function DropSlot({
  active, hover, onEnter, onLeave, onDrop,
}: {
  index: number;
  active: boolean;
  hover: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  if (!active) return <div className="h-1" />;
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); onEnter(); }}
      onDragLeave={onLeave}
      onDrop={onDrop}
      className={`relative my-1 rounded-md transition-all ${
        hover
          ? "h-12 border-2 border-dashed border-primary bg-primary/10"
          : "h-2 border border-dashed border-primary/30 bg-primary/5"
      }`}
    >
      {hover && (
        <div className="absolute inset-0 grid place-items-center text-meta font-medium text-primary">
          Thả vào đây để chèn
        </div>
      )}
    </div>
  );
}

// Icon Eye nhỏ dùng trong bảng hướng dẫn (khỏi import ngoài).
function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="inline h-3 w-3" {...props}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
