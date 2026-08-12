import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { useCayContext } from "./CayContext";
import { okey } from "./utils";
import { xoaThietBiAnToan, xemTruocXoaThietBi } from "@/lib/mirats/cay-delete";
import { useCayRpc } from "@/lib/mirats/cay-reorg";

export function useCayMutations() {
  const qc = useQueryClient();
  const { setEditMode } = useCayContext();
  const { hoanTac } = useCayRpc();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
    qc.invalidateQueries({ queryKey: ["thiet_bi_cay"] });
    qc.invalidateQueries({ queryKey: ["he_thong_thanh_phan_count"] });
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
  };

  const addGroup = useMutation({
    mutationFn: async ({ plId, ten, ma }: { plId: string; ten: string; ma: string }) => {
      // Check collision
      const { data: existing } = await supabase.from("dm_nhom_he_thong").select("id").eq("ma", ma).single();
      if (existing) throw new Error(`Mã nhóm ${ma} đã tồn tại`);

      const { error } = await supabase.from("dm_nhom_he_thong").insert({
        phan_loai_id: plId,
        ten,
        ma,
        active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm nhóm hệ thống");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const addSystem = useMutation({
    mutationFn: async ({ nhMa, plId, ten, donViId }: { nhMa: string; plId: string; ten: string; donViId: string }) => {
      // Get or create group
      let nhId: string;
      const { data: grp } = await supabase.from("dm_nhom_he_thong").select("id").eq("ma", nhMa).single();
      
      if (!grp) {
        const { data: newGrp, error: grpErr } = await supabase.from("dm_nhom_he_thong").insert({
          ma: nhMa,
          ten: `Nhóm ${nhMa}`,
          phan_loai_id: plId,
          active: true
        }).select().single();
        if (grpErr) throw grpErr;
        nhId = newGrp.id;
      } else {
        nhId = grp.id;
      }

      const { error } = await supabase.from("dm_he_thong").insert({
        nhom_he_thong_id: nhId,
        phan_loai_id: plId,
        ten,
        ma: `${nhMa}_${ten.toUpperCase().replace(/\s+/g, "_")}`, // Simple ma generation
        don_vi_id: donViId,
        active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm hệ thống");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const addDevice = useMutation({
    mutationFn: async ({ htId, plId, ten, ma }: { htId: string; plId: string; ten: string; ma: string }) => {
      const { error } = await supabase.from("thiet_bi").insert({
        dm_he_thong_id: htId,
        phan_loai_id: plId,
        ten,
        ma_thiet_bi: ma,
        trang_thai_id: (await supabase.from("dm_trang_thai_thiet_bi").select("id").eq("ma", "HOAT_DONG").single()).data?.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm tài sản");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const renameGroupCode = useMutation({
    mutationFn: async ({ oldMa, newMa }: { oldMa: string; newMa: string }) => {
      const { error: upErr } = await supabase.from("dm_nhom_he_thong").update({ ma: newMa }).eq("ma", oldMa);
      if (upErr) throw upErr;

      // Migrate cay_node_edit
      const { data: edits } = await supabase.from("cay_node_edit").select("*").in("kind", ["nh", "ht"]).like("ma", `${oldMa}%`);
      if (edits?.length) {
        for (const edit of edits) {
          const newEditMa = edit.ma.replace(oldMa, newMa);
          await supabase.from("cay_node_edit").upsert({ ...edit, ma: newEditMa }, { onConflict: "kind,ma" });
          await supabase.from("cay_node_edit").delete().match({ kind: edit.kind, ma: edit.ma });
        }
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã đổi mã nhóm và đồng bộ dữ liệu cây");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const deleteNode = useMutation({
    mutationFn: async ({ kind, ma, mas }: { kind: string; ma: string; mas?: string[] }) => {
      if (kind === "tb") {
        return xoaThietBiAnToan(mas || [ma]);
      }
      
      if (kind === "ht") {
        const { error } = await supabase.from("dm_he_thong").update({ active: false, deactivated_at: new Date().toISOString() }).eq("ma", ma);
        if (error) throw error;
      } else if (kind === "nh") {
        const { error } = await supabase.from("dm_nhom_he_thong").update({ active: false, deactivated_at: new Date().toISOString() }).eq("ma", ma);
        if (error) throw error;
      }
    },
    onSuccess: (res: any) => {
      invalidate();
      if (res?.retired?.length) {
        toast.success(`Đã ngừng khai thác ${res.retired.length} tài sản (giữ hồ sơ)`);
      } else {
        toast.success("Đã xoá thành công");
      }
    },
    onError: (e: any) => toast.error(e.message)
  });

  const setNhColor = useMutation({
    mutationFn: async ({ ma, mau }: { ma: string; mau: string }) => {
      const { error } = await supabase.from("cay_node_edit").upsert({
        kind: "nh",
        ma,
        du_lieu: { mau }
      }, { onConflict: "kind,ma" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã đổi màu nhóm");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const bulkSaveCell = useMutation({
    mutationFn: async ({ mas, field, value }: { mas: string[]; field: string; value: any }) => {
      const { error } = await supabase.from("thiet_bi").update({ [field]: value }).in("ma_thiet_bi", mas);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      invalidate();
      toast.success(`Đã cập nhật ${v.mas.length} tài sản`);
    },
    onError: (e: any) => toast.error(e.message)
  });

  const reorderSiblings = useMutation({
    mutationFn: async ({ parentKind, parentMa, order }: { parentKind: string; parentMa: string; order: string[] }) => {
      const { error } = await supabase.from("cay_node_edit").upsert({
        kind: parentKind,
        ma: parentMa,
        du_lieu: { thu_tu: order }
      }, { onConflict: "kind,ma" });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (e: any) => toast.error(e.message)
  });

  return {
    addGroup,
    addSystem,
    addDevice,
    renameGroupCode,
    deleteNode,
    setNhColor,
    bulkSaveCell,
    reorderSiblings,
    hoanTac
  };
}
