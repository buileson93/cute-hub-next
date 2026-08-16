// ============================================================================
// CHECKLIST cho mẫu ALL-IN-ONE — trực quan hoá 17 sheet đã có + các nhóm dữ
// liệu KHÔNG nhập hàng loạt (chỉ khai qua form/nghiệp vụ). Kèm nút tải CSV
// mẫu (chỉ header) và bảng MAPPING cột cho mỗi sheet — người dùng biết chính
// xác tên cột / kiểu dữ liệu / cột bắt buộc trước khi điền.
// ============================================================================

import { useMemo, useState } from "react";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Download, ListChecks } from "lucide-react";
import { ALLINONE_LAYERS, type LayerGroup } from "@/lib/mirats/allinone-template";
import { findEntity, csvHeaders, toCsv, type FieldDef } from "@/lib/mirats/import-config";
import { InfoHint } from "./InfoHint";
import { AllInOneGuide } from "./AllInOneGuide";


const KIND_LABEL: Record<FieldDef["kind"], string> = {
  text: "chuỗi", int: "số nguyên", num: "số", date: "ngày (YYYY-MM-DD)", ref: "danh mục (chọn)",
};

const GROUP_LABEL: Record<LayerGroup, string> = {
  catalog: "Danh mục nền",
  structure: "Cấu trúc hệ thống",
  asset: "Tài sản & khe linh kiện",
  operational: "Vận hành & vòng đời",
};

const GROUP_TONE: Record<LayerGroup, string> = {
  catalog:     "border-blue-200 bg-blue-50/60 dark:bg-blue-500/10",
  structure:   "border-emerald-200 bg-emerald-50/60 dark:bg-emerald-500/10",
  asset:       "border-amber-200 bg-amber-50/60 dark:bg-amber-500/10",
  operational: "border-violet-200 bg-violet-50/60 dark:bg-violet-500/10",
};

/** Các entity KHÔNG có engine import hàng loạt — chỉ nhập qua form/nghiệp vụ. */
const NOT_IN_ALLINONE = [
  { key: "su_co", label: "Sự cố", why: "Sự kiện realtime — khai qua trang Sự cố." },
  { key: "hong_hoc", label: "Hỏng hóc", why: "Gắn với sự cố; dùng form hỏng hóc." },
  { key: "ban_giao", label: "Bàn giao", why: "Nghiệp vụ ca kíp/ký nhận — dùng form bàn giao." },
  { key: "form_submission", label: "Phiếu biểu mẫu", why: "Sinh từ template + chữ ký; không CSV." },
  { key: "du_an", label: "Dự án / công việc PM", why: "Kanban — quản lý qua module Dự án." },
  { key: "kho_giao_dich", label: "Giao dịch kho", why: "Nhập/xuất kho — dùng form kho." },
  { key: "kiem_ke", label: "Kiểm kê", why: "Phiên kiểm kê — dùng module Kiểm kê." },
  { key: "thiet_bi_cap_phat", label: "Cấp phát tài sản", why: "Ghi qua thao tác cấp phát." },
  { key: "cong_viec_bao_tri", label: "Kế hoạch bảo trì", why: "Sinh từ chính sách PM." },
];

export function AllInOneChecklist() {
  const [open, setOpen] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const g: Record<LayerGroup, typeof ALLINONE_LAYERS> = {
      catalog: [], structure: [], asset: [], operational: [],
    };
    for (const l of ALLINONE_LAYERS) g[l.group].push(l);
    return g;
  }, []);

  function downloadTemplate(entityId: string, catTable: string | undefined, sheet: string) {
    const ent = findEntity(entityId, catTable);
    if (!ent) return;
    const headers = csvHeaders(ent);
    const csv = toCsv(headers, []);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Sheet có tiền tố "8. Model" → chuẩn hoá cho tên file
    const clean = sheet.replace(/^\d+\.\s*/, "").replace(/\s+/g, "-");
    a.download = `MIRATS_mau_${clean}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          Sheet trong mẫu all-in-one
          <Badge variant="outline" className="text-meta">{ALLINONE_LAYERS.length}</Badge>
          <InfoHint>
            Kiểm tra nhanh entity nào đã có sheet để nhập/xuất, entity nào chỉ khai qua form.
            Bấm mỗi dòng để xem mapping cột & tải mẫu CSV riêng.
          </InfoHint>
          <span className="ml-auto"><AllInOneGuide /></span>
        </CardTitle>
      </CardHeader>


      <CardContent className="space-y-4">
        {(Object.keys(grouped) as LayerGroup[]).map((g) => (
          <div key={g} className={`rounded-md border ${GROUP_TONE[g]}`}>
            <div className="flex items-center gap-2 border-b px-3 py-1.5">
              <Badge variant="outline" className="text-meta">{GROUP_LABEL[g]}</Badge>
              <span className="text-xs text-muted-foreground">{grouped[g].length} sheet</span>
            </div>
            <div className="divide-y">
              {grouped[g].map((l) => {
                const ent = findEntity(l.entity, l.catTable);
                const key = `${l.entity}|${l.catTable ?? ""}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        className="flex flex-1 items-center gap-1.5 text-left text-sm"
                        onClick={() => setOpen(isOpen ? null : key)}
                        title={l.desc}
                      >
                        {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{l.sheet}</span>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => downloadTemplate(l.entity, l.catTable, l.sheet)}
                        title="Tải CSV mẫu cho sheet này"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {isOpen && ent && (
                      <div className="mt-2 overflow-hidden rounded-md border bg-background">
                        {ent.note && (
                          <p className="border-b bg-muted/40 px-2.5 py-1.5 text-meta text-muted-foreground">
                            {ent.note}
                          </p>
                        )}
                        <table className="w-full text-meta">
                          <thead className="bg-muted/40 text-muted-foreground">
                            <tr>
                              <th className="px-2 py-1 text-left font-medium">Cột CSV</th>
                              <th className="px-2 py-1 text-left font-medium">Nhãn</th>
                              <th className="px-2 py-1 text-left font-medium">Kiểu</th>
                              <th className="px-2 py-1 text-center font-medium">*</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ent.fields.map((f) => {
                              const note = f.kind === "ref" && f.ref
                                ? `Chọn từ ${f.ref.table} (khớp ${f.ref.by.join("/")})${f.ref.create ? " · tự tạo nếu thiếu" : ""}${f.ref.guard ? " · cần xác nhận admin" : ""}`
                                : f.ghi_chu ?? "";
                              return (
                                <tr key={f.key} className="border-t" title={note}>
                                  <td className="px-2 py-1 font-mono text-meta">{f.key}</td>
                                  <td className="px-2 py-1">{f.label}</td>
                                  <td className="px-2 py-1">
                                    {KIND_LABEL[f.kind]}
                                    {f.virtual && <span className="ml-1 text-amber-600">(ảo)</span>}
                                  </td>
                                  <td className="px-2 py-1 text-center">
                                    {f.required ? <span className="text-red-600">✓</span> : ""}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="rounded-md border border-dashed border-muted-foreground/30 bg-muted/30 p-3">
          <div className="mb-1.5 flex items-center gap-2 text-sm font-medium">
            <Circle className="h-4 w-4 text-muted-foreground" />
            Chỉ khai qua form
            <Badge variant="outline" className="text-meta">{NOT_IN_ALLINONE.length}</Badge>
            <InfoHint>Dữ liệu giao dịch / sự kiện — không phù hợp import CSV hàng loạt.</InfoHint>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-meta sm:grid-cols-3">
            {NOT_IN_ALLINONE.map((n) => (
              <li key={n.key} className="flex items-start gap-1" title={n.why}>
                <span className="mt-0.5 text-muted-foreground">•</span>
                <span>{n.label}</span>
              </li>
            ))}
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}
