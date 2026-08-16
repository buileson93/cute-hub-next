import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Check, X, FileClock } from "lucide-react";
import { StandardTable } from "@/components/mirats/StandardTable";
import { Badge } from "@/components/ui/badge";
import { type AuditRow, ENTITY_LABEL } from "./types";


interface AuditLogViewerProps {
  auditLogs: AuditRow[];
  loading: boolean;
  profileMap: Map<string, any>;
  q: string;
  setQ: (val: string) => void;
}

const dvLabel = (ma: string) => ma; // Simplified for now

function describeAction(a: string): { verb: string; ok: boolean } {
  if (a.includes("failed") || a.includes("captcha") || a.includes("rate_limited") || a.includes("unknown") || a.includes("inactive"))
    return { verb: a, ok: false };
  if (a.startsWith("insert_")) return { verb: "Tạo mới", ok: true };
  if (a.startsWith("update_")) return { verb: "Cập nhật", ok: true };
  if (a.startsWith("delete_")) return { verb: "Xoá", ok: true };
  if (a.includes("password_reset")) return { verb: "Đặt lại mật khẩu", ok: true };
  if (a.includes("login") || a.includes("sign")) return { verb: "Đăng nhập", ok: true };
  return { verb: a, ok: true };
}

function fmtTs(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AuditLogViewer({ auditLogs, loading, profileMap, q, setQ }: AuditLogViewerProps) {
  const filteredAudit = useMemo(() => {
    const kw = q.trim().toLowerCase();
    return auditLogs.filter((r) => {
      if (!kw) return true;
      const p = r.user_id ? profileMap.get(r.user_id) : null;
      const hay = `${r.action} ${r.entity ?? ""} ${r.entity_id ?? ""} ${p?.ho_ten ?? ""} ${p?.don_vi ?? ""}`.toLowerCase();
      return hay.includes(kw);
    });
  }, [auditLogs, q, profileMap]);

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileClock className="h-4 w-4" /> Nhật ký kiểm toán
              </CardTitle>
              <CardDescription>{auditLogs.length} bản ghi gần nhất.</CardDescription>
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
                placeholder="Tìm theo người, đối tượng…" 
                className="h-8 pl-8 text-xs" 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <StandardTable<AuditRow>
            tableKey="phan_quyen_audit_log"
            rows={filteredAudit.slice(0, 50)}
            getRowId={(r) => r.id}
            requireFilterToShow={false}
            trangThai={{ dangTai: loading }}
            emptyContent={<div className="py-10 text-center text-sm text-muted-foreground">Không có bản ghi phù hợp.</div>}
            columns={[
              {
                key: "created_at", label: "Thời điểm", sortable: true,
                value: (r) => r.created_at,
                cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{fmtTs(r.created_at)}</span>,
              },
              {
                key: "nguoi", label: "Người thực hiện", filter: "text",
                value: (r) => {
                  const p = r.user_id ? profileMap.get(r.user_id) : null;
                  return `${p?.ho_ten ?? ""} ${p?.don_vi ?? ""}`;
                },
                cell: (r) => {
                  const p = r.user_id ? profileMap.get(r.user_id) : null;
                  return (
                    <div>
                      <div className="text-xs font-medium">{p?.ho_ten ?? "—"}</div>
                      <div className="text-[10.5px] text-muted-foreground">{p?.don_vi ? dvLabel(p.don_vi) : "Hệ thống"}</div>
                    </div>
                  );
                },
              },
              {
                key: "action", label: "Hành động", filter: "cat",
                value: (r) => describeAction(r.action).verb,
                cell: (r) => <span className="text-xs">{describeAction(r.action).verb}</span>,
              },
              {
                key: "entity", label: "Đối tượng", filter: "cat",
                value: (r) => ENTITY_LABEL[r.entity ?? ""] ?? r.entity ?? "",
                cell: (r) => <Badge variant="outline" className="text-[10.5px]">{ENTITY_LABEL[r.entity ?? ""] ?? r.entity ?? "—"}</Badge>,
              },
              {
                key: "entity_id", label: "Mã bản ghi", filter: "text",
                value: (r) => r.entity_id ?? "",
                cell: (r) => <span className="font-mono text-[11px] text-muted-foreground">{r.entity_id ?? "—"}</span>,
              },
              {
                key: "kq", label: "KQ", align: "center",
                value: (r) => describeAction(r.action).ok ? "OK" : "Lỗi",
                cell: (r) => describeAction(r.action).ok
                  ? <Check className="mx-auto h-4 w-4 text-emerald-600" />
                  : <X className="mx-auto h-4 w-4 text-rose-600" />,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
