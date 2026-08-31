// ============================================================================
// TaskDetailSlideOver — Xem nhanh chi tiết một công việc dự án.
// Dữ liệu thật: du_an_cong_viec, du_an_moc, profiles, du_an_cong_viec_phoi_hop,
// du_an_cong_viec_checklist, du_an_cong_viec_binh_luan.
// ============================================================================
import { useMemo, useState } from "react";
import { useSession } from "@/hooks/use-session";
import { TaskChecklist } from "./TaskChecklist";
import { TaskComments } from "./TaskComments";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock,
  FileText,
  History,
  ChevronRight,
  User,
  Calendar,
  Users,
  Trash2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { AuditLog } from "./AuditLog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

export interface TaskDetail {
  id: string;
  du_an_id: string;
  moc_id: string;
  ten: string;
  mo_ta: string | null;
  nguoi_xu_ly_chinh: string | null;
  ngay_bat_dau: string | null;
  ngay_ket_thuc_du_kien: string | null;
  ngay_hoan_thanh_thuc_te: string | null;
  trang_thai: string;
  tien_do: number;
  ket_qua: string | null;
  created_by: string | null;
  moc: { ten: string } | null;
  assignee: { ho_ten: string | null; email: string | null } | null;
}

interface TaskDetailSlideOverProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (task: TaskDetail) => void;
  /** Cho phép xoá công việc (kiểm tra thêm ở tầng RLS). */
  canDelete?: boolean;
  /** Gọi lại sau khi xoá thành công để làm mới dữ liệu cha. */
  onDeleted?: () => void;
}

const TT_LABEL: Record<string, string> = {
  chua_bat_dau: "Chưa bắt đầu",
  dang_lam: "Đang làm",
  cho_duyet: "Chờ duyệt",
  hoan_thanh: "Hoàn thành",
  qua_han: "Quá hạn",
};

function daysLeftLabel(due: string | null): { text: string; tone: string } | null {
  if (!due) return null;
  const ms = new Date(`${due}T00:00:00`).getTime() - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(ms / 86_400_000);
  if (Number.isNaN(days)) return null;
  if (days < 0) return { text: `Quá hạn ${Math.abs(days)} ngày`, tone: "text-destructive" };
  if (days === 0) return { text: "Đến hạn hôm nay", tone: "text-warning-fg" };
  return { text: `Còn ${days} ngày`, tone: "text-muted-foreground" };
}

export function TaskDetailSlideOver({
  taskId,
  open,
  onOpenChange,
  onEdit,
  canDelete = false,
  onDeleted,
}: TaskDetailSlideOverProps) {
  const qc = useQueryClient();
  const { user, hasRole } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);


  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["du-an-cv-detail", taskId],
    queryFn: async (): Promise<TaskDetail | null> => {
      if (!taskId) return null;
      const { data, error: err } = await supabase
        .from("du_an_cong_viec")
        .select("*, moc:du_an_moc(ten)")
        .eq("id", taskId)
        .maybeSingle();
      if (err) throw err;
      if (!data) return null;

      let assignee: TaskDetail["assignee"] = null;
      if (data.nguoi_xu_ly_chinh) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("ho_ten, email")
          .eq("id", data.nguoi_xu_ly_chinh)
          .maybeSingle();
        assignee = profile ?? null;
      }
      return { ...(data as unknown as TaskDetail), assignee };
    },
    enabled: !!taskId && open,
  });

  const { data: collaborators = [] } = useQuery({
    queryKey: ["du-an-cv-phoi-hop", taskId],
    queryFn: async (): Promise<{ ho_ten: string | null; email: string | null }[]> => {
      if (!taskId) return [];
      const { data, error: err } = await supabase
        .from("du_an_cong_viec_phoi_hop")
        .select("user_id")
        .eq("cong_viec_id", taskId);
      if (err) throw err;
      const ids = (data ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("ho_ten, email")
        .in("id", ids);
      return profiles ?? [];
    },
    enabled: !!taskId && open,
  });

  const del = useMutation({
    mutationFn: async () => {
      if (!taskId) return;
      const { error: err } = await supabase.from("du_an_cong_viec").delete().eq("id", taskId);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Đã xoá công việc");
      setConfirmDelete(false);
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["du-an-cv-detail", taskId] });
      onDeleted?.();
    },
    onError: (e: Error) => toast.error("Xoá công việc thất bại: " + e.message),
  });

  const { data: profileList = [] } = useQuery({
    queryKey: ["all-profiles"],
    enabled: open,
    staleTime: 300_000,
    queryFn: async () => {
      const { data, error: err } = await supabase.from("profiles").select("id,ho_ten,email");
      if (err) throw err;
      return data ?? [];
    },
  });

  const nameOf = useMemo(() => {
    const map = new Map(profileList.map((p) => [p.id, p.ho_ten || p.email || ""]));
    return (id: string | null) => (id ? (map.get(id) || "Người dùng") : "Không rõ");
  }, [profileList]);

  // Người phụ trách, người phối hợp, quản lý dự án và admin được ghi checklist.
  const canEditCollab =
    hasRole("admin") ||
    hasRole("quan_ly_du_an") ||
    (!!user?.id && task?.nguoi_xu_ly_chinh === user.id) ||
    canDelete;

  if (!taskId) return null;


  const due = daysLeftLabel(task?.ngay_ket_thuc_du_kien ?? null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <span>Dự án</span>
            <ChevronRight className="h-3 w-3" aria-hidden="true" />
            <span>{task?.moc?.ten ?? "Mốc công việc"}</span>
          </div>
          <SheetTitle className="text-xl font-bold leading-tight">
            {isLoading ? <Skeleton className="h-6 w-2/3" /> : (task?.ten ?? "Không tìm thấy công việc")}
          </SheetTitle>
          {task && (
            <div className="flex items-center gap-3 mt-4">
              <Badge variant="outline">{TT_LABEL[task.trang_thai] ?? task.trang_thai}</Badge>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tiến độ: {task.tien_do}%</span>
              </div>
              <Progress value={task.tien_do} className="h-1.5 flex-1 max-w-[120px]" />
            </div>
          )}
        </SheetHeader>

        {isError ? (
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              Không tải được công việc: {(error as Error).message}
            </div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="progress" className="flex-1 flex flex-col mt-4 min-h-0">
            <div className="px-6 border-b">
              <TabsList className="bg-transparent h-auto p-0 gap-6 w-full justify-start">
                <TabsTrigger
                  value="progress"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-semibold"
                >
                  Tiến độ & Phối hợp
                </TabsTrigger>
                <TabsTrigger
                  value="collab"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-semibold"
                >
                  Checklist & Trao đổi
                </TabsTrigger>
                <TabsTrigger
                  value="audit"
                  className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 py-2 text-sm font-semibold"
                >
                  Nhật ký
                </TabsTrigger>

              </TabsList>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <TabsContent value="progress" className="p-6 m-0 space-y-8">
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Người thực hiện
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
                            <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {task?.assignee?.ho_ten ?? task?.assignee?.email ?? "Chưa giao"}
                            </span>
                            {task?.assignee?.email && (
                              <span className="text-[10px] text-muted-foreground truncate">
                                {task.assignee.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                          Hạn hoàn thành
                        </span>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border">
                            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">
                              {task?.ngay_ket_thuc_du_kien ?? "—"}
                            </span>
                            {due && <span className={`text-[10px] ${due.tone}`}>{due.text}</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                        Mô tả & Yêu cầu
                      </h4>
                      <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line">
                        {task?.mo_ta || "Không có mô tả chi tiết."}
                      </div>
                    </div>

                    {task?.ket_qua && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-bold">Kết quả thực hiện</h4>
                        <div className="bg-muted/30 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-line">
                          {task.ket_qua}
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                        Người phối hợp
                      </h4>
                      {collaborators.length === 0 ? (
                        <div className="text-xs text-muted-foreground">
                          Chưa có người phối hợp. Thêm trong hộp thoại chỉnh sửa công việc.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {collaborators.map((c) => (
                            <Badge key={c.email ?? c.ho_ten} variant="secondary" className="text-xs">
                              {c.ho_ten ?? c.email}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="collab" className="p-6 m-0 space-y-8">
                <section className="space-y-3">
                  <h4 className="text-sm font-bold">Checklist</h4>
                  <TaskChecklist taskId={taskId} canEdit={canEditCollab} enabled={open} />
                </section>
                <section className="space-y-3">
                  <h4 className="text-sm font-bold">Trao đổi</h4>
                  <TaskComments
                    taskId={taskId}
                    currentUserId={user?.id ?? null}
                    nameOf={nameOf}
                    enabled={open}
                  />
                </section>
              </TabsContent>



              <TabsContent value="audit" className="p-6 m-0">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" aria-hidden="true" />
                    Lịch sử hoạt động
                  </h4>
                  <AuditLog entityType="du_an_cong_viec" entityId={taskId} />
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        )}

        <div className="p-4 border-t bg-muted/20 flex items-center justify-between gap-3">
          {canDelete ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive text-xs font-bold"
              onClick={() => setConfirmDelete(true)}
              disabled={del.isPending || !task}
            >
              {del.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              )}
              Xoá công việc
            </Button>
          ) : (
            <span className="text-[11px] text-muted-foreground">Bạn không có quyền xoá công việc này.</span>
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Đóng
            </Button>
            <Button size="sm" onClick={() => task && onEdit?.(task)} disabled={!task}>
              Chỉnh sửa
            </Button>
          </div>
        </div>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá công việc "{task?.ten}"?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động không thể hoàn tác. Tiến độ mốc và dự án sẽ được tính lại.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={del.isPending}>Huỷ</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  del.mutate();
                }}
                disabled={del.isPending}
              >
                {del.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
                Xoá
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
