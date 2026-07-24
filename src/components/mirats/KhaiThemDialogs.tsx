// ============================================================================
// Hai nút "Khai thêm" nhanh cho view Bảng thành phần hệ thống:
//   1) Khai thêm HỆ THỐNG mới (ghi thẳng dm_he_thong — cần nhóm cha + đơn vị QL)
//   2) Khai thêm THÀNH PHẦN cho một hệ thống có sẵn (ghi vào he_thong_thanh_phan)
// Logic đồng bộ với sidebar/treeview: trigger DB tự kế thừa phan_loai_id /
// don_vi_id, đơn vị quản lý là bắt buộc, mã tự sinh nếu để trống.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Plus, RefreshCw, Network, Component as ComponentIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Combobox } from "@/components/mirats/Combobox";
import { SchemaDialog, type SchemaField } from "@/components/mirats/SchemaDialog";
import { supabase } from "@/integrations/supabase/client";
import { useLuuViTri, useViTriChucNang } from "@/lib/mirats/he-thong-thanh-phan";
import { sinhMaThanhPhanDuyNhat } from "@/lib/mirats/ma-thiet-bi";
import { thongDiepLoi, kickNeuHetPhien } from "@/lib/mirats/errors";

function slugMa(name: string): string {
  const s = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return s.slice(0, 40) || "HT_" + Date.now().toString(36).toUpperCase();
}

// ---- Nút gộp: 2 dialog trong 1 cụm để nhúng vào toolbar ----
export function KhaiThemCumButtons({ size = "sm" }: { size?: "sm" | "default" }) {
  const [openHt, setOpenHt] = useState(false);
  const [openTp, setOpenTp] = useState(false);
  return (
    <>
      <Button size={size} variant="outline" className="gap-1.5" onClick={() => setOpenHt(true)}>
        <Network className="h-4 w-4" /> <Plus className="-ml-1 h-3.5 w-3.5" /> Khai thêm hệ thống
      </Button>
      <Button size={size} variant="outline" className="gap-1.5" onClick={() => setOpenTp(true)}>
        <ComponentIcon className="h-4 w-4" /> <Plus className="-ml-1 h-3.5 w-3.5" /> Khai thêm thành
        phần
      </Button>
      {openHt && <KhaiThemHeThongDialog onClose={() => setOpenHt(false)} />}
      {openTp && <KhaiThemThanhPhanDialog onClose={() => setOpenTp(false)} />}
    </>
  );
}

// ---- Dialog 1: Khai thêm HỆ THỐNG (refactored về SchemaDialog) --------------
const HeThongSchema = z.object({
  ten: z.string().trim().min(1, "Nhập tên hệ thống"),
  ma: z.string().trim().optional(),
  nhom_id: z.string().min(1, "Chọn nhóm hệ thống cha"),
  don_vi_id: z.string().min(1, "Chọn đơn vị quản lý"),
});
type HeThongValues = z.infer<typeof HeThongSchema>;

function KhaiThemHeThongDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();

  const fields: SchemaField[] = useMemo(
    () => [
      {
        key: "ten",
        type: "text",
        label: "Tên hệ thống",
        required: true,
        placeholder: "VD: Hệ thống xử lý ADS-B Đà Nẵng",
      },
      {
        key: "ma",
        type: "text",
        label: "Mã hệ thống",
        placeholder: "VD: ADS_B_DAD",
        help: "Tuỳ chọn — bỏ trống sẽ tự sinh từ tên",
      },
      {
        key: "nhom_id",
        type: "combobox",
        label: "Nhóm hệ thống cha",
        required: true,
        placeholder: "Chọn nhóm hệ thống",
        loadOptions: {
          queryKey: ["dm-nhom-he-thong-all"],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("dm_nhom_he_thong")
              .select("id, ma, ten")
              .order("thu_tu");
            if (error) throw error;
            return (data ?? []).map((n) => ({ value: n.id, label: `${n.ma} · ${n.ten}` }));
          },
        },
      },
      {
        key: "don_vi_id",
        type: "combobox",
        label: "Đơn vị quản lý",
        required: true,
        placeholder: "Chọn đơn vị quản lý",
        loadOptions: {
          queryKey: ["dm-don-vi-all"],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("dm_don_vi")
              .select("id, ten")
              .order("thu_tu");
            if (error) throw error;
            return (data ?? []).map((d) => ({ value: d.id, label: d.ten }));
          },
        },
      },
    ],
    [],
  );

  const luu = useMutation({
    mutationFn: async (v: HeThongValues) => {
      // Nhóm cha có thể chưa gán phan_loai — buộc phải kế thừa được.
      const { data: nRow } = await supabase
        .from("dm_nhom_he_thong")
        .select("phan_loai_id")
        .eq("id", v.nhom_id)
        .maybeSingle();
      const plId = (nRow as { phan_loai_id: string | null } | null)?.phan_loai_id ?? "";
      if (!plId)
        throw new Error("Nhóm hệ thống chưa gán Phân loại — hãy gán Phân loại cho nhóm trước");

      let ma = v.ma?.trim() ? slugMa(v.ma) : slugMa(v.ten);
      const { data: dup } = await supabase
        .from("dm_he_thong")
        .select("id")
        .eq("ma", ma)
        .maybeSingle();
      if (dup) ma = `${ma}_${Date.now().toString(36).toUpperCase()}`;

      const { data, error } = await supabase
        .from("dm_he_thong")
        .insert({
          ma,
          ten: v.ten.trim(),
          nhom_he_thong_id: v.nhom_id,
          phan_loai_id: plId,
          don_vi_id: v.don_vi_id,
        } as never)
        .select("id, ma, ten")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Đã khai thêm hệ thống");
      qc.invalidateQueries({ queryKey: ["thanh-phan-toan-cuc"] });
      qc.invalidateQueries({ queryKey: ["tai-san-thanh-phan-toan-cuc"] });
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      onClose();
    },
    onError: async (e) => {
      if (await kickNeuHetPhien(e)) return;
      toast.error(thongDiepLoi(e, "Không tạo được hệ thống"));
    },
  });

  return (
    <SchemaDialog<HeThongValues>
      open
      onOpenChange={(o) => !o && onClose()}
      title="Khai thêm hệ thống"
      description="Ghi thẳng vào cơ sở dữ liệu. Đơn vị quản lý là bắt buộc — Phân loại tự kế thừa từ nhóm cha."
      fields={fields}
      schema={HeThongSchema}
      submitLabel="Khai thêm"
      onSubmit={async (v) => {
        await luu.mutateAsync(v);
      }}
    />
  );
}
// ---- Dialog 2: Khai thêm THÀNH PHẦN (refactored về SchemaDialog) -----------
const ThanhPhanSchema = z.object({
  he_thong_id: z.string().min(1, "Chọn hệ thống cha"),
  ten: z.string().trim().min(1, "Nhập tên thành phần"),
  ma: z.string().trim().optional(),
  loai_thiet_bi_yeu_cau: z.string().optional(),
  thanh_phan_cha: z.string().optional(),
  bat_buoc: z.boolean().default(true),
  thu_tu: z.number().optional(),
  mo_ta: z.string().trim().optional(),
});
type ThanhPhanValues = z.infer<typeof ThanhPhanSchema>;

function KhaiThemThanhPhanDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [maDefault, setMaDefault] = useState<string>("");

  // Sinh sẵn mã 1 lần để prefill
  useEffect(() => {
    let alive = true;
    sinhMaThanhPhanDuyNhat()
      .then((m) => {
        if (alive) setMaDefault(m);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const fields: SchemaField[] = useMemo(
    () => [
      {
        key: "he_thong_id",
        type: "combobox",
        label: "Hệ thống cha",
        required: true,
        placeholder: "Chọn hệ thống",
        loadOptions: {
          queryKey: ["dm-he-thong-picker"],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("dm_he_thong")
              .select("id, ma, ten")
              .order("ten");
            if (error) throw error;
            return (data ?? []).map((h) => ({ value: h.id, label: `${h.ma} · ${h.ten}` }));
          },
        },
      },
      {
        key: "ma",
        type: "text",
        label: "Mã thành phần",
        placeholder: "Tự sinh",
        help: "Bỏ trống sẽ tự sinh mã duy nhất",
      },
      {
        key: "ten",
        type: "text",
        label: "Tên thành phần",
        required: true,
        placeholder: "VD: Cảm biến đo hướng & tốc độ gió",
      },
      {
        key: "loai_thiet_bi_yeu_cau",
        type: "combobox",
        label: "Chủng loại yêu cầu",
        placeholder: "Không ràng buộc loại",
        loadOptions: {
          queryKey: ["dm-loai-thiet-bi-picker"],
          queryFn: async () => {
            const { data, error } = await supabase
              .from("dm_loai_thiet_bi")
              .select("id, ten")
              .order("thu_tu");
            if (error) throw error;
            return (data ?? []).map((l) => ({ value: l.id, label: l.ten }));
          },
        },
      },
      {
        key: "thanh_phan_cha",
        type: "combobox",
        label: "Thuộc thành phần cha",
        placeholder: "Chọn hệ thống trước",
        loadOptions: {
          queryKey: ["vi-tri-chuc-nang-picker"],
          deps: ["he_thong_id"],
          queryFn: async (vals) => {
            const htId = (vals.he_thong_id as string) || "";
            if (!htId) return [];
            const { data, error } = await supabase
              .from("he_thong_thanh_phan")
              .select("id, ma_thanh_phan, ten")
              .eq("he_thong_id", htId)
              .order("thu_tu");
            if (error) throw error;
            return (data ?? []).map((v) => ({
              value: v.id,
              label: `${v.ma_thanh_phan} · ${v.ten}`,
            }));
          },
        },
      },
      { key: "thu_tu", type: "number", label: "Thứ tự", placeholder: "1", min: 0 },
      { key: "bat_buoc", type: "switch", label: "Thành phần bắt buộc" },
      { key: "mo_ta", type: "textarea", label: "Mô tả" },
    ],
    [],
  );

  const defaultValues = useMemo(
    () => ({ ma: maDefault, bat_buoc: true }) as Partial<ThanhPhanValues>,
    [maDefault],
  );

  // Mutation dùng lại useLuuViTri, nhưng cần he_thong_id động
  const luuMut = useMutation({
    mutationFn: async (v: ThanhPhanValues) => {
      let maFinal = (v.ma ?? "").trim();
      if (!maFinal) maFinal = await sinhMaThanhPhanDuyNhat();
      const { data, error } = await supabase.rpc("khai_them_thanh_phan_he_thong" as never, {
        p_he_thong_id: v.he_thong_id,
        p_ma_thanh_phan: maFinal,
        p_ten: v.ten,
        p_loai_thiet_bi_yeu_cau: v.loai_thiet_bi_yeu_cau || null,
        p_thanh_phan_cha: v.thanh_phan_cha || null,
        p_bat_buoc: v.bat_buoc,
        p_thu_tu: typeof v.thu_tu === "number" ? v.thu_tu : null,
        p_mo_ta: v.mo_ta || null,
      } as never);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Đã khai thêm thành phần");
      qc.invalidateQueries({ queryKey: ["thanh-phan-toan-cuc"] });
      qc.invalidateQueries({ queryKey: ["tai-san-thanh-phan-toan-cuc"] });
      qc.invalidateQueries({ queryKey: ["vi-tri-chuc-nang-picker"] });
      onClose();
    },
    onError: async (e) => {
      if (await kickNeuHetPhien(e)) return;
      toast.error(thongDiepLoi(e, "Lưu thất bại"));
    },
  });

  return (
    <SchemaDialog<ThanhPhanValues>
      open
      onOpenChange={(o) => !o && onClose()}
      title="Khai thêm thành phần"
      description="Chỉ khai chức năng của thành phần — chưa gán tài sản cụ thể. Đơn vị quản lý được kế thừa từ hệ thống cha."
      fields={fields}
      schema={ThanhPhanSchema}
      defaultValues={defaultValues}
      submitLabel="Khai thêm"
      onSubmit={async (v) => {
        await luuMut.mutateAsync(v);
      }}
    />
  );
}
