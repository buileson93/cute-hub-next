import React, { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "@/components/mirats/PageFrame";
import { PageHeader } from "@/components/mirats/PageHeader";
import { PageBody } from "@/components/mirats/PageBody";
import { StandardTable, ColumnDef } from "@/components/mirats/StandardTable";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { fmtNgay } from "@/lib/mirats/format";
import { Shield, User, Activity, Clock, Eye, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppTooltip } from "@/components/mirats/AppTooltip";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_app/admin/audit")({
  component: AuditLogPage,
});

interface AuditLog {
  id: string;
  user_id: string;
  hanh_dong: string;
  doi_tuong: string;
  doi_tuong_ids: string[] | null;
  chi_tiet: any;
  thoi_gian: string;
  profiles?: {
    ho_ten: string | null;
    email: string | null;
  } | null;
}

function AuditLogPage() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filter, setFilter] = useState({
    action: "",
    domain: "",
    user: "",
  });

  const { data: logs = [], isLoading, error, refetch } = useQuery({
    queryKey: ["audit-logs", filter],
    queryFn: async () => {
      let query = supabase
        .from("nhat_ky_he_thong" as any)
        .select(`
          *,
          profiles:user_id (
            ho_ten,
            email
          )
        `)
        .order("thoi_gian", { ascending: false })
        .limit(500);

      if (filter.action) query = query.ilike("hanh_dong", `%${filter.action}%`);
      if (filter.domain) query = query.ilike("doi_tuong", `%${filter.domain}%`);
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Client-side filtering for user because of complex join if needed, 
      // but let's stick to basics first.
      let result = data as AuditLog[];
      if (filter.user) {
        result = result.filter(log => 
          log.profiles?.ho_ten?.toLowerCase().includes(filter.user.toLowerCase()) ||
          log.profiles?.email?.toLowerCase().includes(filter.user.toLowerCase())
        );
      }
      
      return result;
    },
  });

  const columns = useMemo<ColumnDef<AuditLog>[]>(() => [
    {
      key: "thoi_gian",
      header: "Thời gian",
      width: 180,
      render: (r) => (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{fmtNgay(r.thoi_gian, "datetime-sec")}</span>
        </div>
      ),
    },
    {
      key: "user",
      header: "Người thực hiện",
      width: 200,
      render: (r) => (
        <div className="flex items-center gap-2">
          <User className="h-3.5 w-3.5 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-[12px]">{r.profiles?.ho_ten || "Hệ thống"}</span>
            <span className="text-[10px] text-muted-foreground">{r.profiles?.email || ""}</span>
          </div>
        </div>
      ),
    },
    {
      key: "hanh_dong",
      header: "Hành động",
      width: 150,
      render: (r) => {
        const color = r.hanh_dong === "bulk_delete" ? "destructive" : 
                      r.hanh_dong === "export_csv" ? "default" : "secondary";
        return (
          <Badge variant={color as any} className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0">
            {r.hanh_dong}
          </Badge>
        );
      }
    },
    {
      key: "doi_tuong",
      header: "Đối tượng",
      width: 150,
      render: (r) => (
        <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded border">
          {r.doi_tuong}
        </span>
      ),
    },
    {
      key: "details",
      header: "Chi tiết",
      render: (r) => {
        const count = r.doi_tuong_ids?.length || 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-[12px] truncate max-w-[300px]">
              {count > 0 ? `${count} bản ghi` : JSON.stringify(r.chi_tiet)}
            </span>
          </div>
        );
      }
    },
    {
      key: "actions",
      header: "",
      width: 50,
      render: (r) => (
        <AppTooltip noiDung="Xem chi tiết JSON">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => setSelectedLog(r)}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        </AppTooltip>
      ),
    },
  ], []);

  return (
    <PageFrame>
      <PageHeader
        title="Nhật ký hệ thống"
        crumb="Quản trị"
        icon={<Shield className="h-5 w-5 text-primary" />}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setFilter({ action: "", domain: "", user: "" })} className="h-8 gap-2">
              <FilterX className="h-3.5 w-3.5" /> Xóa lọc
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="h-8 gap-2">
              <Activity className="h-3.5 w-3.5" /> Làm mới
            </Button>
          </div>
        }
      />
      <PageBody className="flex flex-col gap-4 overflow-hidden p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Người dùng</label>
            <Input 
              placeholder="Tìm theo tên/email..." 
              value={filter.user}
              onChange={e => setFilter(f => ({ ...f, user: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Hành động</label>
            <Input 
              placeholder="bulk_delete, export_csv..." 
              value={filter.action}
              onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Miền (Domain)</label>
            <Input 
              placeholder="thiet_bi, he_thong..." 
              value={filter.domain}
              onChange={e => setFilter(f => ({ ...f, domain: e.target.value }))}
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 bg-card rounded-xl border shadow-sm overflow-hidden">
          <StandardTable
            rows={logs}
            columns={columns}
            tableKey="admin-audit-logs"
            trangThai={{ dangTai: isLoading, loi: error }}
            countUnit="nhật ký"
          />
        </div>
      </PageBody>

      <Dialog open={!!selectedLog} onOpenChange={o => !o && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Chi tiết nhật ký
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] uppercase font-bold">Thời gian</div>
                  <div>{fmtNgay(selectedLog.thoi_gian, "datetime-sec")}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] uppercase font-bold">ID</div>
                  <code className="text-[10px] bg-muted px-1 rounded">{selectedLog.id}</code>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] uppercase font-bold">Người thực hiện</div>
                  <div>{selectedLog.profiles?.ho_ten || "Hệ thống"} ({selectedLog.profiles?.email || "system"})</div>
                </div>
                <div className="space-y-1">
                  <div className="text-muted-foreground text-[11px] uppercase font-bold">Miền (Domain)</div>
                  <Badge variant="outline">{selectedLog.doi_tuong}</Badge>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-muted-foreground text-[11px] uppercase font-bold">IDs đối tượng liên quan</div>
                <div className="max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/30">
                  {selectedLog.doi_tuong_ids && selectedLog.doi_tuong_ids.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedLog.doi_tuong_ids.map(id => (
                        <code key={id} className="text-[9px] bg-background border px-1 rounded">{id}</code>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic text-xs">Không có IDs cụ thể</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-muted-foreground text-[11px] uppercase font-bold">Dữ liệu chi tiết (JSON)</div>
                <pre className="p-3 rounded-lg bg-zinc-950 text-zinc-50 text-[11px] font-mono overflow-auto max-h-64 border shadow-inner">
                  {JSON.stringify(selectedLog.chi_tiet, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageFrame>
  );
}
