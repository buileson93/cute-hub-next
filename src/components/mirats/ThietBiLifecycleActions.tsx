import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { toast } from "sonner";
import { PackageX, RotateCcw, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/** Trạng thái "nghỉ khai thác" — mặc định ẩn khỏi danh sách nhưng vẫn lọc xem được. */
export const RETIRED_STATUSES = new Set(["Ngừng khai thác", "Thanh lý", "NGUNG_KHAI_THAC", "THANH_LY"]);
/** true nếu tài sản đang ở trạng thái nghỉ khai thác. */
export function isRetiredStatus(trangThai?: string | null): boolean {
  return RETIRED_STATUSES.has((trangThai ?? "").trim());
}

export function ThietBiLifecycleActions({ ma, trangThai }: { ma: string; trangThai: string | null | undefined }) {
  const { hasRole } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const isAdmin = hasRole("admin");
  const qc = useQueryClient();

  const [lyDo, setLyDo] = useState("");
  const [thanhLy, setThanhLy] = useState(false);
  const isRetired = isRetiredStatus(trangThai);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    qc.invalidateQueries({ queryKey: ["change_log"] });
  };

  const retire = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("ngung_khai_thac_thiet_bi", {
        _mas: [ma], _ly_do: lyDo || undefined, _thanh_ly: thanhLy,
      });
      if (error) throw error;
      return data as { trang_thai: string };
    },
    onSuccess: (d) => { invalidate(); setLyDo(""); toast.success(`Đã chuyển sang "${d?.trang_thai ?? "Ngừng khai thác"}" — hồ sơ lý lịch được giữ nguyên`); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thực hiện được"),
  });

  const restore = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("phuc_hoi_thiet_bi", { _mas: [ma], _ly_do: lyDo || undefined });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setLyDo(""); toast.success("Đã phục hồi tài sản về Đang khai thác"); },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không thực hiện được"),
  });

  const purge = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("purge_thiet_bi", { _mas: [ma] });
      if (error) throw error;
      return data as { so_da_xoa: number | null; so_bo_qua: number | null };
    },
    onSuccess: (d) => {
      invalidate();
      if ((d?.so_da_xoa ?? 0) > 0) toast.success("Đã xoá vĩnh viễn bản ghi nhập nhầm");
      else toast.error("Không xoá được: tài sản đã phát sinh lịch sử. Hãy dùng “Ngừng khai thác”.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không xoá được"),
  });

  if (!canManage) return null;
  const busy = retire.isPending || restore.isPending || purge.isPending;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isRetired ? (
        <Button variant="outline" size="sm" disabled={busy} onClick={() => restore.mutate()}>
          {restore.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-1 h-4 w-4" />}
          Phục hồi khai thác
        </Button>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={busy}>
              <PackageX className="mr-1 h-4 w-4" /> Ngừng khai thác
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Ngừng khai thác tài sản?</AlertDialogTitle>
              <AlertDialogDescription>
                Tài sản <b className="font-mono">{ma}</b> sẽ chuyển sang trạng thái ngừng khai thác. Toàn bộ
                lịch sử (sự cố, bảo dưỡng, hỏng hóc, bàn giao, kiểm kê) <b>được giữ nguyên</b> và vẫn tra cứu được.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">
              <div className="flex items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
                <div className="flex-1 space-y-0.5">
                  <Label htmlFor="thanh-ly-check" className="text-sm font-medium cursor-pointer">Thanh lý / loại biên</Label>
                  <p className="text-xs text-muted-foreground">Tài sản sẽ không còn trong danh mục sẵn dùng.</p>
                </div>
                <Switch id="thanh-ly-check" checked={thanhLy} onCheckedChange={setThanhLy} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ly-do-ngung">Lý do</Label>
                <Textarea id="ly-do-ngung" value={lyDo} onChange={(e) => setLyDo(e.target.value)} placeholder="Ví dụ: hết niên hạn, hư hỏng không sửa được…" rows={2} />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction onClick={() => retire.mutate()}>Xác nhận ngừng</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isAdmin && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={busy}>
              <Trash2 className="mr-1 h-4 w-4" /> Xoá vĩnh viễn
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xoá vĩnh viễn tài sản?</AlertDialogTitle>
              <AlertDialogDescription>
                Chỉ dùng cho <b>bản ghi nhập nhầm</b>. Thao tác chỉ thành công nếu tài sản <b>chưa phát sinh</b>
                {" "}sự cố, bảo dưỡng, hỏng hóc, bàn giao, kiểm kê, giấy phép hay phiếu nào — nếu đã có lịch sử,
                hệ thống sẽ từ chối và bạn nên dùng “Ngừng khai thác”. Không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Huỷ</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => purge.mutate()}>
                Xoá vĩnh viễn
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
