import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { 
  ScrollArea 
} from "@/components/ui/scroll-area";
import { 
  History, 
  User, 
  Clock, 
  MessageSquare, 
  FileEdit, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Search,
  Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface AuditLogProps {
  entityType: string;
  entityId: string;
}

export function AuditLog({ entityType, entityId }: AuditLogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");

  const exportLogs = () => {
    if (!filteredLogs || filteredLogs.length === 0) return;
    
    try {
      const headers = ["Thời gian", "Hành động", "Chi tiết", "Người thực hiện"];
      const rows = filteredLogs.map(log => [
        format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
        getActionLabel(log.action),
        formatDetail(log).replace(/,/g, ';'),
        log.user_id || "Hệ thống"
      ]);
      
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");
      
      const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `audit-log-${entityType}-${entityId}-${format(new Date(), "yyyyMMdd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã xuất báo cáo nhật ký thành công");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất báo cáo");
    }
  };

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit-logs", entityType, entityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .eq("entity", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId,
  });

  const uniqueUsers = useMemo(() => {
    const users = new Set<string>();
    logs.forEach(log => {
      if (log.user_id) users.add(log.user_id);
    });
    return Array.from(users);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = searchTerm === "" || 
        getActionLabel(log.action).toLowerCase().includes(searchTerm.toLowerCase()) ||
        formatDetail(log).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);
      
      const matchesUser = userFilter === "all" || log.user_id === userFilter;
      
      return matchesSearch && matchesAction && matchesUser;
    });
  }, [logs, searchTerm, actionFilter, userFilter]);


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <Clock className="h-4 w-4 animate-spin mr-2" />
        Đang tải lịch sử...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground text-xs italic">
        Chưa có nhật ký hoạt động nào được ghi lại.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-3 rounded-xl border border-dashed border-slate-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo hành động, chi tiết..."
            className="pl-9 text-xs h-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <Filter className="h-3.5 w-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Hành động" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả hành động</SelectItem>
            <SelectItem value="create">Tạo mới</SelectItem>
            <SelectItem value="update">Cập nhật</SelectItem>
            <SelectItem value="sign">Ký số</SelectItem>
            <SelectItem value="approve">Phê duyệt</SelectItem>
          </SelectContent>
        </Select>

        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-[140px] h-9 text-xs bg-background">
            <User className="h-3.5 w-3.5 mr-2 text-slate-400" />
            <SelectValue placeholder="Người thực hiện" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả người dùng</SelectItem>
            {uniqueUsers.map(user => (
              <SelectItem key={user} value={user}>
                {user.slice(0, 8)}...
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        {filteredLogs.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground text-xs italic">
            Không tìm thấy nhật ký phù hợp với bộ lọc.
          </div>
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative pl-10">
                <div className="absolute left-0 flex items-center justify-center w-8 h-8 rounded-full bg-white border shadow-sm z-10">
                  {getIcon(log.action)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {getActionLabel(log.action)}
                    </span>
                    <span className="text-mini text-muted-foreground whitespace-nowrap">
                      {format(new Date(log.created_at), "HH:mm, dd/MM/yyyy", { locale: vi })}
                    </span>
                  </div>
                  <div className="text-meta text-slate-600 leading-relaxed">
                    {formatDetail(log)}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-mini text-muted-foreground">
                    <User className="h-3 w-3" />
                    <span>{log.user_id || "Hệ thống"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="mt-4 pt-4 border-t flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 text-xs font-bold gap-2"
          onClick={exportLogs}
          disabled={logs.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Xuất báo cáo hoạt động
        </Button>
      </div>
    </div>
  );
}

function getIcon(action: string) {
  if (action.includes("create")) return <PlusIcon className="h-3.5 w-3.5 text-emerald-600" />;
  if (action.includes("update") || action.includes("edit")) return <FileEdit className="h-3.5 w-3.5 text-indigo-600" />;
  if (action.includes("delete")) return <AlertCircle className="h-3.5 w-3.5 text-rose-600" />;
  if (action.includes("approve") || action.includes("sign")) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />;
  if (action.includes("comment")) return <MessageSquare className="h-3.5 w-3.5 text-sky-600" />;
  return <History className="h-3.5 w-3.5 text-slate-400" />;
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}

function getActionLabel(action: string) {
  const labels: Record<string, string> = {
    "create": "Tạo mới",
    "update": "Cập nhật",
    "delete": "Xóa",
    "sign": "Ký số",
    "approve": "Phê duyệt",
    "reject": "Từ chối",
    "comment": "Bình luận",
    "change_status": "Thay đổi trạng thái",
  };
  
  for (const key in labels) {
    if (action.toLowerCase().includes(key)) return labels[key];
  }
  return action;
}

function formatDetail(log: any) {
  if (typeof log.detail === 'string') return log.detail;
  if (log.detail && typeof log.detail === 'object') {
    const changes = log.detail.changes || log.detail;
    if (Array.isArray(changes)) return changes.join(", ");
    return JSON.stringify(changes);
  }
  return "Không có chi tiết.";
}
