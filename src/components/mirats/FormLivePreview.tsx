// ============================================================================
// FormLivePreview.tsx — Xem trước mẫu biên bản ngay trên trang thiết kế.
// Cho phép người thiết kế điền thử để kiểm tra luồng (visible_if, required,
// ngưỡng, formula…). KHÔNG lưu vào DB — chỉ state cục bộ.
// ============================================================================
import { useMemo, useState } from "react";
import { RotateCcw, Eye, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { compileField, type RawFieldRow } from "@/lib/mirats/form-schema";
import { evalVisible, validateForm } from "@/lib/mirats/form-visibility";
import { FormFieldRuntime, useGridRows } from "./FormFieldRuntime";

export interface FormLivePreviewProps {
  tplName: string;
  tplDesc?: string;
  // Không ràng buộc kiểu chặt — nhận field từ Designer (InspectorField).
  fields: ReadonlyArray<Record<string, unknown>>;
}

export function FormLivePreview({ tplName, tplDesc, fields }: FormLivePreviewProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  const compiled = useMemo(() => {
    return fields.map((f, i) => compileField(f as RawFieldRow, i));
  }, [fields]);

  const visible = useMemo(
    () => compiled.filter((f) => evalVisible(f.visible_if, values)),
    [compiled, values],
  );
  const rows = useGridRows(visible);
  const errors = useMemo(() => validateForm(visible, values), [visible, values]);

  const draftId = "preview";
  const templateCode = "PREVIEW";

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          <span>
            Chế độ <b>Xem trước</b> — điền thử để kiểm tra luồng câu hỏi.
            Dữ liệu <b>không được lưu</b>.
          </span>
        </div>
        <Button size="sm" variant="outline" onClick={() => setValues({})}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Xoá dữ liệu thử
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{tplName || "Biểu mẫu chưa đặt tên"}</CardTitle>
          {tplDesc && <p className="text-sm text-muted-foreground">{tplDesc}</p>}
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Chưa có câu hỏi nào — thêm câu hỏi ở tab Biểu mẫu tự do để xem trước.
            </p>
          )}
          {rows.map((rowFields, ri) => (
            <div key={ri} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {rowFields.map((f) => {
                const forceFull = ["heading", "divider", "note", "table"].includes(f.kind);
                const span = forceFull ? 3 : Math.max(1, Math.min(3, f.col_span || 3));
                return (
                  <div
                    key={f.key}
                    className={
                      span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "md:col-span-1"
                    }
                  >
                    <FormFieldRuntime
                      field={f}
                      value={values[f.key]}
                      values={values}
                      onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                      templateCode={templateCode}
                      draftId={draftId}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            {errors.length === 0 ? (
              <span className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Hợp lệ — không có lỗi validate
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                Có {errors.length} vấn đề validate
              </span>
            )}
          </CardTitle>
        </CardHeader>
        {errors.length > 0 && (
          <CardContent>
            <ul className="space-y-1 text-xs">
              {errors.map((e, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-[10px]">{e.key}</Badge>
                  <span className="text-muted-foreground">{e.label}: {e.message}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
