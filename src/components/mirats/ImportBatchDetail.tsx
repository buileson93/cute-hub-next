// ============================================================================
// Chi tiết một lô nhập: hiển thị từng dòng với action + diff before→after,
// cho phép lọc theo trạng thái/hành động và tải báo cáo lỗi (.csv).
// Trước đây batch history chỉ dump JSON thô — không đọc được. Panel này biến
// nó thành bảng có ngữ nghĩa để reviewer đối chiếu nhanh.
// ============================================================================

import { useMemo, useState } from "react";
import { Download, ChevronRight, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";

type Item = {
  id?: string;
  row_index?: number;
  sheet?: string;
  entity?: string;
  action?: string | null;
  status?: string;
  target_table?: string | null;
  target_id?: string | null;
  raw_row?: Record<string, unknown>;
  before_snapshot?: Record<string, unknown> | null;
  after_snapshot?: Record<string, unknown> | null;
  messages?: unknown;
};

const ACTION_LABEL: Record<string, string> = {
  create: "Tạo mới",
  update: "Cập nhật",
  retire: "Ngừng dùng",
  keep: "Giữ nguyên",
  error: "Lỗi",
  skip: "Bỏ qua",
};
const STATUS_LABEL: Record<string, string> = {
  staged: "Tạm",
  valid: "Hợp lệ",
  error: "Lỗi",
  committed: "Đã ghi",
  skipped: "Bỏ qua",
  rolled_back: "Đã hoàn tác",
};

function actionVariant(a?: string | null): "default" | "secondary" | "outline" | "destructive" {
  if (a === "create") return "default";
  if (a === "update") return "secondary";
  if (a === "error") return "destructive";
  return "outline";
}

/** Sinh diff phẳng giữa before/after (chỉ những trường khác nhau). */
function diffFields(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
) {
  const keys = new Set<string>([...Object.keys(before ?? {}), ...Object.keys(after ?? {})]);
  const out: Array<{ key: string; before: unknown; after: unknown }> = [];
  for (const k of keys) {
    const a = before?.[k];
    const b = after?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ key: k, before: a, after: b });
  }
  return out;
}

function fmt(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function messagesToStrings(m: unknown): string[] {
  if (!m) return [];
  if (Array.isArray(m))
    return m.map((x) => (typeof x === "string" ? x : ((x as any)?.message ?? JSON.stringify(x))));
  if (typeof m === "string") return [m];
  return [JSON.stringify(m)];
}

export function ImportBatchDetail({ items, batchName }: { items: Item[]; batchName?: string }) {
  const [status, setStatus] = useState("");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter((it) => {
      if (status && it.status !== status) return false;
      if (action && it.action !== action) return false;
      if (qq) {
        const hay =
          `${it.sheet ?? ""} ${it.entity ?? ""} ${JSON.stringify(it.raw_row ?? {})}`.toLowerCase();
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [items, status, action, q]);

  const statusOptions: ComboOption[] = useMemo(() => {
    const set = new Set(items.map((i) => i.status).filter(Boolean) as string[]);
    return [
      { value: "", label: "Mọi trạng thái" },
      ...[...set].map((s) => ({ value: s, label: STATUS_LABEL[s] ?? s })),
    ];
  }, [items]);
  const actionOptions: ComboOption[] = useMemo(() => {
    const set = new Set(items.map((i) => i.action).filter(Boolean) as string[]);
    return [
      { value: "", label: "Mọi hành động" },
      ...[...set].map((s) => ({ value: s, label: ACTION_LABEL[s] ?? s })),
    ];
  }, [items]);

  function toggle(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function downloadErrors() {
    const errs = items.filter((i) => i.status === "error" || i.action === "error");
    if (!errs.length) return;
    const rows = errs.map((e) => ({
      row: e.row_index,
      sheet: e.sheet,
      entity: e.entity,
      messages: messagesToStrings(e.messages).join(" | "),
      raw: JSON.stringify(e.raw_row ?? {}),
    }));
    const header = "row,sheet,entity,messages,raw";
    const body = rows
      .map((r) =>
        [r.row, r.sheet, r.entity, r.messages, r.raw]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loi-nhap-${batchName ?? "batch"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const errorCount = items.filter((i) => i.status === "error" || i.action === "error").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-40">
          <Combobox
            options={statusOptions}
            value={status}
            onChange={setStatus}
            placeholder="Trạng thái"
          />
        </div>
        <div className="w-40">
          <Combobox
            options={actionOptions}
            value={action}
            onChange={setAction}
            placeholder="Hành động"
          />
        </div>
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm trong sheet/dữ liệu…"
          className="h-9 max-w-xs"
        />
        <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {filtered.length}/{items.length} dòng
          </span>
          {errorCount > 0 && (
            <Button size="sm" variant="outline" onClick={downloadErrors}>
              <Download className="mr-1 h-3.5 w-3.5" /> Tải {errorCount} dòng lỗi
            </Button>
          )}
        </div>
      </div>

      <div className="max-h-[26rem] overflow-auto rounded-md border bg-background">
        <Table>
          <TableHeader className="sticky top-0 bg-background">
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-12">#</TableHead>
              <TableHead className="w-28">Sheet</TableHead>
              <TableHead className="w-24">Đối tượng</TableHead>
              <TableHead className="w-24">Hành động</TableHead>
              <TableHead className="w-24">Trạng thái</TableHead>
              <TableHead>Ghi chú / dữ liệu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((it, i) => {
              const id = (it.id as string) ?? String(i);
              const isOpen = openIds.has(id);
              const msgs = messagesToStrings(it.messages);
              const diffs = diffFields(
                it.before_snapshot,
                it.after_snapshot ?? (it.raw_row as Record<string, unknown>),
              );
              return (
                <>
                  <TableRow key={id} className="cursor-pointer" onClick={() => toggle(id)}>
                    <TableCell className="p-1 text-muted-foreground">
                      {isOpen ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums">{it.row_index ?? i + 1}</TableCell>
                    <TableCell className="text-xs">{it.sheet ?? "—"}</TableCell>
                    <TableCell className="text-xs">{it.entity ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={actionVariant(it.action)}>
                        {ACTION_LABEL[it.action ?? ""] ?? it.action ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {STATUS_LABEL[it.status ?? ""] ?? it.status ?? "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[420px] truncate text-[11px] text-muted-foreground">
                      {msgs[0] ??
                        Object.entries(it.raw_row ?? {})
                          .slice(0, 4)
                          .map(([k, v]) => `${k}=${fmt(v)}`)
                          .join(" · ")}
                    </TableCell>
                  </TableRow>
                  {isOpen && (
                    <TableRow key={id + "-detail"} className="bg-muted/20">
                      <TableCell />
                      <TableCell colSpan={6} className="p-3">
                        {msgs.length > 0 && (
                          <div className="mb-2 space-y-0.5">
                            {msgs.map((m, k) => (
                              <div key={k} className="text-xs text-destructive">
                                • {m}
                              </div>
                            ))}
                          </div>
                        )}
                        {it.target_table && (
                          <div className="mb-2 text-[11px] text-muted-foreground">
                            Đích: <span className="font-mono">{it.target_table}</span>
                            {it.target_id && (
                              <>
                                {" "}
                                · id <span className="font-mono">{it.target_id}</span>
                              </>
                            )}
                          </div>
                        )}
                        {diffs.length > 0 ? (
                          <div className="overflow-auto rounded border bg-background">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-40">Trường</TableHead>
                                  <TableHead>Trước</TableHead>
                                  <TableHead>Sau</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {diffs.map((d) => (
                                  <TableRow key={d.key}>
                                    <TableCell className="text-xs font-medium">{d.key}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground line-through decoration-destructive/60">
                                      {fmt(d.before)}
                                    </TableCell>
                                    <TableCell className="text-xs text-emerald-700 dark:text-emerald-400">
                                      {fmt(d.after)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted-foreground">
                            Không có thay đổi trường.
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-6 text-center text-xs text-muted-foreground">
                  Không có dòng nào khớp bộ lọc.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
