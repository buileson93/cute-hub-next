import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { xoaThietBiAnToan } from "@/lib/mirats/cay-delete";

/**
 * Hook mutation chuyên biệt cho trang Chi tiết thiết bị.
 * Tách biệt khỏi useCayMutations để tránh phụ thuộc vào CayProvider (context của trang Hệ Thống).
 */
export function useThietBiDetailMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["thiet-bi"] });
    qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
  };

  const renameEntity = useMutation({
    mutationFn: async ({
      kind,
      id,
      ten,
      draft,
      userRoles,
    }: {
      kind: any;
      id: string;
      ten: string;
      draft?: boolean;
      userRoles: string[];
    }) => {
      if (draft) {
        const { renameEntity: renameCore } = await import("@/lib/mirats/rename-entity");
        return renameCore({ kind, id, ten, draft: true });
      }
      const { saveEntityFieldSecurely } = await import("@/lib/mirats/ui/save-entity-securely");
      return saveEntityFieldSecurely({ kind, id, field: "ten", value: ten, userRoles });
    },
    onSuccess: (res) => {
      invalidate();
      if (res && (res as any).mode === "proposed")
        toast.success("Đã tạo đề xuất đổi tên (chờ phê duyệt)");
      else toast.success("Đã đổi tên thành công");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const saveCell = useMutation({
    mutationFn: async ({
      ma,
      col,
      value,
      userRoles,
    }: {
      ma: string;
      col: string;
      value: any;
      userRoles: string[];
    }) => {
      const { saveEntityFieldSecurely } = await import("@/lib/mirats/ui/save-entity-securely");
      return saveEntityFieldSecurely({ kind: "tb", id: ma, field: col, value, userRoles });
    },
    onSuccess: (res: any) => {
      invalidate();
      if (res && res.mode === "proposed") toast.success("Đã tạo đề xuất cập nhật (chờ phê duyệt)");
      else toast.success("Đã lưu thành công");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteDevice = useMutation({
    mutationFn: async ({ ma }: { ma: string }) => {
      return xoaThietBiAnToan([ma]);
    },
    onSuccess: (res: any) => {
      invalidate();
      if (res?.retired?.length) {
        toast.success(`Đã ngừng khai thác tài sản (giữ hồ sơ)`);
      } else {
        toast.success("Đã xoá thành công");
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    renameEntity,
    saveCell,
    deleteDevice,
  };
}
