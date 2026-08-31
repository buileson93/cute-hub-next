import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import React from "react";
import { CayContext } from "./CayContext";
import { xoaThietBiAnToan, xemTruocXoaThietBi } from "@/lib/mirats/cay-delete";
import { useCayRpc } from "@/lib/mirats/cay-reorg";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;



export function useCayMutations() {
  const qc = useQueryClient();
  const cayCtx = React.useContext(CayContext);
  const setEditMode = cayCtx?.setEditMode || (() => {});
  const { submit, hoanTac, submitMany } = useCayRpc();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cay_node_edit"] });
    qc.invalidateQueries({ queryKey: ["thiet_bi_cay"] });
    qc.invalidateQueries({ queryKey: ["he_thong_thanh_phan_count"] });
    qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
    qc.invalidateQueries({ queryKey: ["cay_thay_doi"] });
  };

  const addGroup = useMutation({
    mutationFn: async ({ plId, ten, ma }: { plId: string; ten: string; ma: string }) => {
      const tenSach = ten.trim();
      const maSach = ma.trim().toUpperCase();
      if (!tenSach) throw new Error("Tên nhóm không được để trống");
      if (!maSach) throw new Error("Mã nhóm không được để trống");
      if (!UUID_RE.test(plId)) throw new Error("Thiếu phân loại hợp lệ cho nhóm hệ thống");

      // Check collision
      const { data: existing } = await supabase
        .from("dm_nhom_he_thong")
        .select("id")
        .eq("ma", maSach)
        .maybeSingle();
      if (existing) throw new Error(`Mã nhóm ${maSach} đã tồn tại`);

      const { error } = await supabase.from("dm_nhom_he_thong").insert({
        phan_loai_id: plId,
        ten: tenSach,
        ma: maSach,
        active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm nhóm hệ thống");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addSystem = useMutation({
    mutationFn: async ({
      nhMa,
      plId,
      ten,
      donViId,
    }: {
      nhMa: string;
      plId: string;
      ten: string;
      donViId: string;
    }) => {
      const tenSach = ten.trim();
      if (!tenSach) throw new Error("Tên hệ thống không được để trống");

      // Lấy nhóm hiện có (kèm phân loại) — nguồn chuẩn cho phan_loai_id.
      const { data: grp, error: grpFindErr } = await supabase
        .from("dm_nhom_he_thong")
        .select("id, phan_loai_id")
        .eq("ma", nhMa)
        .maybeSingle();
      if (grpFindErr) throw grpFindErr;

      let nhId: string;
      let phanLoaiId = grp?.phan_loai_id ?? (UUID_RE.test(plId) ? plId : "");

      if (!grp) {
        if (!UUID_RE.test(phanLoaiId))
          throw new Error("Không xác định được phân loại của nhóm hệ thống");
        const { data: newGrp, error: grpErr } = await supabase
          .from("dm_nhom_he_thong")
          .insert({
            ma: nhMa,
            ten: `Nhóm ${nhMa}`,
            phan_loai_id: phanLoaiId,
            active: true,
          } as any)
          .select("id")
          .single();
        if (grpErr) throw grpErr;
        nhId = newGrp.id;
      } else {
        nhId = grp.id;
      }
      if (!UUID_RE.test(phanLoaiId))
        throw new Error("Không xác định được phân loại của nhóm hệ thống");

      // Sinh mã hệ thống duy nhất (tránh lỗi trùng khoá & rác dữ liệu).
      const base = `${nhMa}_${tenSach.toUpperCase().replace(/\s+/g, "_")}`.slice(0, 48);
      let maHt = base;
      for (let i = 2; i <= 20; i++) {
        const { data: dup } = await supabase
          .from("dm_he_thong")
          .select("id")
          .eq("ma", maHt)
          .maybeSingle();
        if (!dup) break;
        maHt = `${base}_${i}`;
        if (i === 20) throw new Error(`Mã hệ thống ${base} đã tồn tại`);
      }

      const { error } = await supabase.from("dm_he_thong").insert({
        nhom_he_thong_id: nhId,
        phan_loai_id: phanLoaiId,
        ten: tenSach,
        ma: maHt,
        don_vi_id: donViId || null,
        active: true,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm hệ thống");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const addDevice = useMutation({
    mutationFn: async ({
      htId,
      plId,
      ten,
      ma,
    }: {
      htId: string;
      plId?: string;
      ten: string;
      ma?: string;
    }) => {
      const tenSach = ten.trim();
      if (!tenSach) throw new Error("Tên tài sản không được để trống");
      if (!UUID_RE.test(htId)) throw new Error("Chỉ có thể thêm tài sản vào hệ thống thật");

      // Phân loại luôn lấy từ hệ thống cha (nguồn chuẩn).
      const { data: ht, error: htErr } = await supabase
        .from("dm_he_thong")
        .select("id, phan_loai_id")
        .eq("id", htId)
        .maybeSingle();
      if (htErr) throw htErr;
      if (!ht) throw new Error("Không tìm thấy hệ thống cha");
      const phanLoaiId = ht.phan_loai_id ?? plId ?? null;

      // Sinh mã tài sản duy nhất nếu người dùng không nhập.
      const base = (ma?.trim() || `TS_${tenSach.toUpperCase().replace(/\s+/g, "_")}`)
        .toUpperCase()
        .slice(0, 48);
      let maSach = base;
      for (let i = 2; i <= 20; i++) {
        const { data: dup } = await supabase
          .from("thiet_bi")
          .select("ma_thiet_bi")
          .eq("ma_thiet_bi", maSach)
          .maybeSingle();
        if (!dup) break;
        if (ma?.trim()) throw new Error(`Mã tài sản ${maSach} đã tồn tại`);
        maSach = `${base}_${i}`;
        if (i === 20) throw new Error(`Mã tài sản ${base} đã tồn tại`);
      }

      const { error } = await supabase.from("thiet_bi").insert({
        he_thong_id: htId,
        phan_loai_id: phanLoaiId,
        ten_thiet_bi: tenSach,
        ma_thiet_bi: maSach,
        che_do_kd_hc: "N/A",
        trang_thai_cap_phat: "Sẵn sàng",
      } as any);
      if (error) throw error;
    },

    onSuccess: () => {
      invalidate();
      toast.success("Đã thêm tài sản");
    },
    onError: (e: any) => toast.error(e.message),
  });


  const deleteNode = useMutation({
    mutationFn: async ({
      kind,
      ma,
      mas,
      userRoles,
    }: {
      kind: string;
      ma: string;
      mas?: string[];
      userRoles: string[];
    }) => {
      if (kind === "tb") {
        return xoaThietBiAnToan(mas || [ma]);
      }

      // Hệ thống bị ngừng: tài sản KHÔNG bị xoá, vẫn giữ nguyên liên kết và
      // hồ sơ. Đếm trước để thông báo rõ ràng cho người dùng.
      let soTaiSan = 0;
      if (kind === "ht" && UUID_RE.test(ma)) {
        const { count } = await supabase
          .from("thiet_bi")
          .select("ma_thiet_bi", { count: "exact", head: true })
          .eq("he_thong_id", ma);
        soTaiSan = count ?? 0;
      }

      const { saveEntityFieldSecurely } = await import("@/lib/mirats/ui/save-entity-securely");
      // For groups/systems, we set active = false
      const res = await saveEntityFieldSecurely({
        kind: kind as any,
        id: ma,
        field: "active",
        value: false,
        userRoles,
      });
      return { ...(res as any), soTaiSan };
    },
    onSuccess: (res: any) => {
      invalidate();
      if (res?.retired?.length) {
        toast.success(`Đã ngừng khai thác ${res.retired.length} tài sản (giữ hồ sơ)`);
      } else if (res?.soTaiSan > 0) {
        toast.success(
          `Đã ẩn hệ thống. ${res.soTaiSan} tài sản vẫn được giữ nguyên hồ sơ và liên kết — hãy điều chuyển sang hệ thống khác nếu cần.`,
        );
      } else {
        toast.success("Đã xoá thành công");
      }

    },
    onError: (e: any) => toast.error(e.message),
  });

  const setNhColor = useMutation({
    mutationFn: async ({ ma, mau }: { ma: string; mau: string }) => {
      const { error } = await supabase.from("cay_node_edit").upsert(
        {
          kind: "nh",
          ma,
          du_lieu: { mau },
        } as any,
        { onConflict: "kind,ma" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã đổi màu nhóm");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const bulkSaveCell = useMutation({
    mutationFn: async ({ mas, field, value }: { mas: string[]; field: string; value: any }) => {
      const { error } = await supabase
        .from("thiet_bi")
        .update({ [field]: value } as any)
        .in("ma_thiet_bi", mas);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      invalidate();
      toast.success(`Đã cập nhật ${v.mas.length} tài sản`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const reorderSiblings = useMutation({
    mutationFn: async ({
      parentKind,
      parentMa,
      order,
    }: {
      parentKind: string;
      parentMa: string;
      order: string[];
    }) => {
      const { error } = await supabase.from("cay_node_edit").upsert(
        {
          kind: parentKind,
          ma: parentMa,
          du_lieu: { thu_tu: order },
        } as any,
        { onConflict: "kind,ma" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const moveSystem = useMutation({
    mutationFn: async (req: {
      heThongId: string;
      tenHeThong: string;
      toNhomId: string;
      toLvId: string;
      toNhKey: string;
      toNhTen: string;
    }) => {
      return submit.mutateAsync({
        loai: "move_system",
        he_thong_id: req.heThongId,
        mo_ta: `Di chuyển hệ thống "${req.tenHeThong}" sang nhóm "${req.toNhTen}"`,
        payload: {
          to_nhom_id: req.toNhomId,
          to_lv_id: req.toLvId,
          to_nh_key: req.toNhKey,
        },
      });
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const moveDevice = useMutation({
    mutationFn: async (req: {
      maThietBi: string;
      tenThietBi: string;
      toHtId: string;
      toHtTen: string;
    }) => {
      return submit.mutateAsync({
        loai: "move_device",
        he_thong_id: req.toHtId, // target system
        mo_ta: `Di chuyển tài sản "${req.tenThietBi}" sang hệ thống "${req.toHtTen}"`,
        payload: {
          ma_thiet_bi: req.maThietBi,
        },
      });
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const renameGroupCode = useMutation({
    mutationFn: async ({ ma, newMa }: { ma: string; newMa: string }) => {
      if (!newMa || newMa === ma) return;
      const { data: existing } = await supabase
        .from("dm_nhom_he_thong")
        .select("id")
        .eq("ma", newMa)
        .maybeSingle();
      if (existing) throw new Error(`Mã nhóm ${newMa} đã tồn tại`);
      const { error } = await supabase
        .from("dm_nhom_he_thong")
        .update({ ma: newMa } as any)
        .eq("ma", ma);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Đã đổi mã nhóm thành công");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return {
    addGroup,
    addSystem,
    addDevice,
    deleteNode,
    setNhColor,
    bulkSaveCell,
    reorderSiblings,
    moveSystem,
    moveDevice,
    hoanTac,
    renameGroupCode,
    renameEntity: useMutation({
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
    }),
    saveCell: useMutation({
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
        if (res && res.mode === "proposed")
          toast.success("Đã tạo đề xuất cập nhật (chờ phê duyệt)");
        else toast.success("Đã lưu thành công");
      },
      onError: (e: any) => toast.error(e.message),
    }),
  };
}
