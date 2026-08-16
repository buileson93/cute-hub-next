// ============================================================================
// Bảng review đối chiếu nhập liệu: với mỗi dòng "needs_review", hiển thị
//   FILE (giá trị trong file) · HIỆN TẠI (bản ghi khớp) · ĐỀ XUẤT (hành động)
// và cho phép: create / update / merge / skip / lưu alias.
// Không tự merge — mọi thao tác gộp phải do người dùng bấm.
// ============================================================================

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Candidate, MatchResult } from "@/lib/mirats/entity-resolve";

export type ReviewAction = "create" | "update" | "merge" | "skip" | "save_alias";

export interface ReviewRow {
  rowIndex: number;
  /** Giá trị đọc từ file (đã map key → giá trị). */
  fileValues: Record<string, string>;
  result: MatchResult;
  /** Hành động người dùng đã chọn (nếu có). */
  chosen?: ReviewAction;
  /** Ứng viên đã chọn để merge/update (khi có nhiều ứng viên). */
  chosenCandidate?: Candidate | null;
}

const KIND_LABEL: Record<MatchResult["kind"], string> = {
  exact_id: "Khớp ID",
  exact_code: "Khớp mã",
  serial_model_mfr: "Serial+Model+NSX",
  alias: "Alias",
  near_name: "Tên gần giống",
  low_confidence: "Tin cậy thấp",
  none: "Không khớp",
};

const DECISION_VARIANT: Record<MatchResult["decision"], "default" | "secondary" | "destructive"> = {
  resolved: "default",
  needs_review: "destructive",
  create: "secondary",
};

function summarize(values: Record<string, string>): string {
  const keys = ["ma", "ma_thiet_bi", "ten", "ma_serial"];
  const parts = keys.map((k) => values[k]).filter(Boolean);
  if (parts.length) return parts.join(" · ");
  return Object.values(values).filter(Boolean).slice(0, 3).join(" · ") || "(trống)";
}

function candidateLabel(c: Candidate | null | undefined): string {
  if (!c) return "—";
  return [c.ma, c.ten, c.ma_serial].filter(Boolean).join(" · ") || c.id;
}

export function ResolutionReview({
  rows,
  onAction,
}: {
  rows: ReviewRow[];
  onAction: (row: ReviewRow, action: ReviewAction, candidate?: Candidate | null) => void;
}) {
  if (!rows.length) {
    return <p className="text-xs text-muted-foreground">Không có dòng nào cần xem lại.</p>;
  }

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 bg-background">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Trong file</TableHead>
            <TableHead>Hiện tại (khớp)</TableHead>
            <TableHead className="w-40">Đề xuất</TableHead>
            <TableHead className="w-[340px] text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const r = row.result;
            const cand = row.chosenCandidate ?? r.candidate;
            const canMerge = r.candidates.length > 0;
            return (
              <TableRow key={row.rowIndex} data-testid={`review-row-${row.rowIndex}`}>
                <TableCell className="text-xs tabular-nums">{row.rowIndex}</TableCell>
                <TableCell className="text-xs font-medium">{summarize(row.fileValues)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {candidateLabel(cand)}
                  {r.candidates.length > 1 && (
                    <span className="ml-1 text-[10px] text-amber-600">+{r.candidates.length - 1} ứng viên</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={DECISION_VARIANT[r.decision]} className="w-fit">{KIND_LABEL[r.kind]}</Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {r.confidence > 0 ? `${Math.round(r.confidence * 100)}% · ` : ""}{r.reason}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {row.chosen ? (
                    <Badge variant="outline" className="uppercase">{row.chosen}</Badge>
                  ) : (
                    <div className="flex flex-wrap justify-end gap-1">
                      <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={() => onAction(row, "create")}>
                        Tạo mới
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!cand} onClick={() => onAction(row, "update", cand)}>
                        Cập nhật
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!canMerge} onClick={() => onAction(row, "merge", cand)}>
                        Gộp
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" disabled={!cand} onClick={() => onAction(row, "save_alias", cand)}>
                        Lưu alias
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onAction(row, "skip")}>
                        Bỏ qua
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
