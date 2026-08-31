// ============================================================================
// ProjectMembersDialog — Quản lý thành viên dự án trên dữ liệu thật.
// Bảng: du_an_thanh_vien (RLS: chỉ chủ trì / quản lý / admin được ghi).
// ============================================================================
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { AlertCircle, Loader2, Trash2, UserPlus } from "lucide-react";

export const VAI_TRO_DU_AN = [
  { value: "chu_tri", label: "Chủ trì" },
  { value: "thanh_vien", label: "Thành viên" },
  { value: "theo_doi", label: "Theo dõi" },
] as const;

export type VaiTroDuAn = (typeof VAI_TRO_DU_AN)[number]["value"];

export type ProjectMember = {
  id: string;
  user_id: string;
  vai_tro: string;
  ho_ten: string | null;
  email: string | null;
};

/** Danh sách thành viên kèm hồ sơ — dùng chung cho dialog và ô chọn người phụ trách. */
export function useProjectMembers(duAnId: string, enabled = true) {
  return useQuery({
    queryKey: ["du-an-thanh-vien", duAnId],
    enabled: enabled && !!duAnId,
    queryFn: async (): Promise<ProjectMember[]> => {
      const { data, error } = await supabase
        .from("du_an_thanh_vien")
        .select("id,user_id,vai_tro")
        .eq("du_an_id", duAnId);
      if (error) throw error;
      const rows = data ?? [];
      if (rows.length === 0) return [];
      const { data: profiles, error: pErr } = await supabase
        .from("profiles")
        .select("id,ho_ten,email")
        .in(
          "id",
          rows.map((r) => r.user_id),
        );
      if (pErr) throw pErr;
      const map = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows
        .map((r) => ({
          id: r.id,
          user_id: r.user_id,
          vai_tro: r.vai_tro,
          ho_ten: map.get(r.user_id)?.ho_ten ?? null,
          email: map.get(r.user_id)?.email ?? null,
        }))
        .sort((a, b) => (a.ho_ten ?? a.email ?? "").localeCompare(b.ho_ten ?? b.email ?? ""));
    },
  });
}

export function ProjectMembersDialog({
  open,
  onOpenChange,
  duAnId,
  canManage,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  duAnId: string;
  canManage: boolean;
}) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [vaiTro, setVaiTro] = useState<VaiTroDuAn>("thanh_vien");

  const { data: members, isLoading, isError, error, refetch } = useProjectMembers(duAnId, open);

  const { data: allProfiles } = useQuery({
    queryKey: ["all-profiles"],
    enabled: open && canManage,
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("profiles")
        .select("id,ho_ten,email")
        .eq("active", true)
        .order("ho_ten");
      if (err) throw err;
      return data ?? [];
    },
  });

  const memberIds = useMemo(() => new Set((members ?? []).map((m) => m.user_id)), [members]);
  const options = useMemo(
    () =>
      (allProfiles ?? [])
        .filter((p) => !memberIds.has(p.id))
        .map((p) => ({ value: p.id, label: p.ho_ten || p.email || p.id.slice(0, 8) })),
    [allProfiles, memberIds],
  );
  const chuTriCount = (members ?? []).filter((m) => m.vai_tro === "chu_tri").length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["du-an-thanh-vien", duAnId] });
  };

  const addMember = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Hãy chọn người cần thêm.");
      const { error: err } = await supabase
        .from("du_an_thanh_vien")
        .insert({ du_an_id: duAnId, user_id: userId, vai_tro: vaiTro });
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Đã thêm thành viên");
      setUserId("");
      setVaiTro("thanh_vien");
      invalidate();
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("duplicate") ? "Người này đã là thành viên." : `Thêm thất bại: ${e.message}`,
      ),
  });

  const changeRole = useMutation({
    mutationFn: async ({ m, role }: { m: ProjectMember; role: VaiTroDuAn }) => {
      if (m.vai_tro === "chu_tri" && role !== "chu_tri" && chuTriCount <= 1) {
        throw new Error("Dự án phải còn ít nhất một chủ trì.");
      }
      const { error: err } = await supabase
        .from("du_an_thanh_vien")
        .update({ vai_tro: role })
        .eq("id", m.id);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Đã cập nhật vai trò");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (m: ProjectMember) => {
      if (m.vai_tro === "chu_tri" && chuTriCount <= 1) {
        throw new Error("Không thể xoá chủ trì cuối cùng của dự án.");
      }
      const { error: err } = await supabase.from("du_an_thanh_vien").delete().eq("id", m.id);
      if (err) throw err;
    },
    onSuccess: () => {
      toast.success("Đã xoá thành viên");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thành viên dự án</DialogTitle>
          <DialogDescription>
            Chỉ thành viên trong danh sách mới xem được dữ liệu dự án này.
          </DialogDescription>
        </DialogHeader>

        {canManage && (
          <div className="flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[180px]">
              <Combobox
                value={userId}
                onChange={setUserId}
                options={options}
                placeholder="Chọn người dùng…"
              />
            </div>
            <Select value={vaiTro} onValueChange={(v) => setVaiTro(v as VaiTroDuAn)}>
              <SelectTrigger className="w-[130px]" aria-label="Vai trò">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VAI_TRO_DU_AN.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={() => addMember.mutate()}
              disabled={!userId || addMember.isPending}
            >
              {addMember.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus className="h-4 w-4 mr-1.5" aria-hidden="true" />
              )}
              Thêm
            </Button>
          </div>
        )}

        <div className="max-h-[320px] overflow-y-auto divide-y">
          {isLoading ? (
            <div className="space-y-2 py-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div className="py-6 space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                Không tải được thành viên: {(error as Error).message}
              </div>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          ) : (members ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Chưa có thành viên nào.
            </div>
          ) : (
            (members ?? []).map((m) => (
              <div key={m.id} className="flex items-center gap-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">
                    {m.ho_ten ?? m.email ?? m.user_id.slice(0, 8)}
                  </div>
                  {m.email && (
                    <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
                  )}
                </div>
                {canManage ? (
                  <Select
                    value={m.vai_tro}
                    onValueChange={(v) => changeRole.mutate({ m, role: v as VaiTroDuAn })}
                    disabled={changeRole.isPending}
                  >
                    <SelectTrigger className="w-[130px] h-8 text-xs" aria-label="Đổi vai trò">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VAI_TRO_DU_AN.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge variant="outline">
                    {VAI_TRO_DU_AN.find((r) => r.value === m.vai_tro)?.label ?? m.vai_tro}
                  </Badge>
                )}
                {canManage && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive"
                    aria-label={`Xoá thành viên ${m.ho_ten ?? m.email ?? ""}`}
                    onClick={() => removeMember.mutate(m)}
                    disabled={removeMember.isPending}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
