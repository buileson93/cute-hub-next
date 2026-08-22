import React, { useState } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  FileText, 
  FileCheck, 
  History, 
  ExternalLink,
  ChevronRight,
  User,
  Calendar,
  AlertCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface TaskDetailSlideOverProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: any) => void;
}

export function TaskDetailSlideOver({ taskId, open, onOpenChange, onEdit }: TaskDetailSlideOverProps) {
  const { data: task, isLoading } = useQuery({
    queryKey: ["du-an-cv-detail", taskId],
    queryFn: async () => {
      if (!taskId) return null;
      const { data, error } = await supabase
        .from("du_an_cong_viec")
        .select(`
          *,
          moc:du_an_moc(ten),
          assignee:profiles!du_an_cong_viec_nguoi_xu_ly_chinh_fkey(ho_ten, email)
        `)
        .eq("id", taskId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!taskId && open,
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["du-an-cv-docs", taskId],
    queryFn: async () => {
      if (!taskId) return [];
      // This is a mock query until we have the correct junction table for task-documents
      // Assuming a link might exist via du_an_id and potentially metadata
      return [];
    },
    enabled: !!taskId && open,
  });

  if (!taskId) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>Dự án</span>
            <ChevronRight className="h-3 w-3" />
            <span>{task?.moc?.ten || "Mốc công việc"}</span>
          </div>
          <SheetTitle className="text-xl font-bold leading-tight">
            {isLoading ? "Đang tải..." : task?.ten}
          </SheetTitle>
          <div className="flex items-center gap-3 mt-4">
            <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
              {task?.trang_thai?.replace("_", " ")}
            </Badge>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Tiến độ: {task?.tien_do || 0}%</span>
            </div>
          </div>
        </SheetHeader>

        <Tabs defaultValue="progress" className="flex-1 flex flex-col mt-4">
          <div className="px-6 border-b">
            <TabsList className="bg-transparent h-auto p-0 gap-6 w-full justify-start">
              <TabsTrigger 
                value="progress" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-semibold"
              >
                Tiến độ & Phối hợp
              </TabsTrigger>
              <TabsTrigger 
                value="deliverables" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-semibold"
              >
                Sản phẩm & Trình ký
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="progress" className="p-6 m-0 space-y-8">
              {/* Assignee & Dates */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Người thực hiện</span>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{task?.assignee?.ho_ten || "Chưa giao"}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{task?.assignee?.email}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Hạn hoàn thành</span>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                      <Calendar className="h-4 w-4 text-rose-600" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{task?.ngay_ket_thuc_du_kien || "—"}</span>
                      <span className="text-[10px] text-rose-600">Còn 2 ngày</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Mô tả & Yêu cầu
                </h4>
                <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed text-slate-700">
                  {task?.mo_ta || "Không có mô tả chi tiết."}
                </div>
              </div>

              {/* Activity Feed Placeholder */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  Thảo luận
                </h4>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-indigo-700">MT</span>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">Minh Trần</span>
                        <span className="text-[10px] text-muted-foreground">Vừa xong</span>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-2xl rounded-tl-none text-xs border border-slate-100">
                        Hồ sơ đính kèm đã sẵn sàng, nhờ Lãnh đạo xem xét trình ký.
                      </div>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-2 border rounded-full px-3 py-1.5 bg-card">
                    <span className="text-xs text-muted-foreground flex-1 px-1">Nhập bình luận hoặc / để dùng lệnh...</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deliverables" className="p-6 m-0 space-y-6">
              {/* Dossier Status */}
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                <FileCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                <div>
                  <h5 className="text-sm font-bold text-emerald-900">Tính pháp lý của Task</h5>
                  <p className="text-[11px] text-emerald-700 mt-1">
                    Cần hoàn thành <strong>2/2 hồ sơ bắt buộc</strong> để chuyển trạng thái Done.
                  </p>
                </div>
              </div>

              {/* Documents List */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold">Danh mục hồ sơ nộp</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card hover:border-primary/30 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-8 bg-rose-50 border border-rose-100 rounded flex items-center justify-center shrink-0">
                        <span className="text-[8px] font-bold text-rose-700">PDF</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate group-hover:text-primary transition-colors">Tờ trình phê duyệt chủ trương</div>
                        <div className="text-[10px] text-muted-foreground">Đã ký số · 1.2 MB</div>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-xl bg-card border-dashed">
                    <div className="flex items-center gap-3 opacity-60">
                      <div className="h-10 w-8 bg-slate-50 border border-slate-100 rounded flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate">Quyết định ban hành (Dự thảo)</div>
                        <div className="text-[10px] text-muted-foreground italic">Chưa có tệp đính kèm</div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-[10px] font-bold">Tải lên</Button>
                  </div>
                </div>
              </div>

              {/* E-Sign Section */}
              <div className="pt-4 border-t space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-indigo-600" />
                  Luồng phê duyệt & Ký số
                </h4>
                <div className="space-y-4 px-2">
                  <div className="flex gap-4 relative">
                    <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-slate-100" />
                    <div className="h-7 w-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 z-10">
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="pb-6">
                      <div className="text-xs font-bold">Trần Văn A (Trưởng phòng)</div>
                      <div className="text-[10px] text-muted-foreground">Đã thẩm định · 14:30 20/08/2026</div>
                    </div>
                  </div>
                  <div className="flex gap-4 relative">
                    <div className="absolute left-[13px] top-7 bottom-0 w-0.5 bg-slate-100" />
                    <div className="h-7 w-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 z-10 shadow-sm shadow-indigo-200">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div className="pb-6">
                      <div className="text-xs font-bold">Nguyễn Thị B (Lãnh đạo đơn vị)</div>
                      <div className="text-[10px] text-amber-600 font-medium">Đang chờ ký số...</div>
                      <div className="mt-3">
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold h-7">
                          Trình ký ngay
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="text-rose-600 text-xs font-bold">
            <AlertCircle className="h-3.5 w-3.5 mr-1.5" /> Xóa công việc
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Đóng</Button>
            <Button size="sm" onClick={() => onEdit?.(task)}>Chỉnh sửa</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ShieldAlert({ className, ...props }: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  );
}
