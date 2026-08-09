// ============================================================================
// ThietBiFormDialog — "Sửa nhanh / Thêm mới" 1 Tài sản (thiet_bi).
// GĐ3-06 refactor: dùng SchemaDialog để bỏ boilerplate FieldWrap/OptSelect.
// - Ép kiểu number (nam_san_xuat) qua SchemaDialog.
// - Mode "edit": khoá mã_thiet_bi.
// - Kế thừa Đơn vị/Vị trí đi qua thành phần hệ thống khi lắp — KHÔNG khai ở đây.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaDialog, type SchemaField, type SchemaOption } from "@/components/mirats/SchemaDialog";
import { CompatibilityManager, type CompatibilityItem } from "@/components/mirats/CompatibilityManager";
import { supabase } from "@/integrations/backend/client";
import type { DbDevice } from "@/lib/mirats/db-taxonomy";


const formSchema = z.object({
  ten_thiet_bi: z
    .string()
    .trim()
    .min(2, "Tên tài sản phải có ít nhất 2 ký tự")
    .max(200, "Tên tài sản tối đa 200 ký tự"),
  ma_thiet_bi: z.string().trim().max(80, "Mã tài sản tối đa 80 ký tự").optional(),
  ma_serial: z.string().trim().max(120, "Số serial tối đa 120 ký tự").optional(),
  model_id: z.string().optional(),
  trang_thai_id: z.string().optional(),
  he_thong_id: z.string().optional(),
  nhan_vien_id: z.string().optional(),
  nam_san_xuat: z
    .number()
    .int()
    .gte(1900, "Năm sản xuất không hợp lệ")
    .lte(2100, "Năm sản xuất không hợp lệ")
    .optional(),
  ghi_chu: z.string().trim().max(2000, "Ghi chú tối đa 2000 ký tự").optional(),
  he_thong_tuong_thich: z
    .array(
      z.object({
        he_thong_id: z.string(),
        phan_loai: z.string(),
        danh_gia: z.string(),
      })
    )
    .default([]),
});


type FormValues = z.infer<typeof formSchema>;

type OptTable = "dm_loai_thiet_bi" | "dm_model" | "dm_trang_thai_thiet_bi" | "dm_he_thong" | "nhan_vien";

function loadOpts(table: OptTable) {
  return {
    queryKey: ["tb-form-options", table] as unknown[],
    queryFn: async (): Promise<SchemaOption[]> => {
      const select = table === "nhan_vien" ? "id, ho_ten, ma_nhan_vien" : "id, ten, ma";
      const { data, error } = await supabase.from(table).select(select).order(table === "nhan_vien" ? "ho_ten" : "ten");
      if (error) throw error;
      return (data as any[] ?? []).map((row) => {

        const label = row.ho_ten ? (row.ma_nhan_vien ? `${row.ho_ten} · ${row.ma_nhan_vien}` : row.ho_ten)
          : (row.ma ? `${row.ten} · ${row.ma}` : row.ten!);
        return { value: row.id, label };
      });
    },
  };
}


export function ThietBiFormDialog({
  open,
  onOpenChange,
  mode,
  device,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: "create" | "edit";
  device?: DbDevice | null;
  onSaved?: (maThietBi: string) => void;
}) {
  const qc = useQueryClient();

  // Prefetch options song song để select mở nhanh
  useQuery(loadOpts("dm_model"));
  useQuery(loadOpts("dm_trang_thai_thiet_bi"));
  useQuery(loadOpts("dm_he_thong"));
  useQuery(loadOpts("nhan_vien"));

  const extra = (device ?? null) as unknown as {
    trang_thai_id?: string | null;
    nhan_vien_id?: string | null;
    ghi_chu?: string | null;
  } | null;


  const defaultValues = useMemo<Partial<FormValues>>(
    () => ({
      ten_thiet_bi: device?.ten ?? "",
      ma_thiet_bi: device?.ma_thiet_bi ?? "",
      ma_serial: device?.serial ?? "",
      model_id: device?._modelId ?? "",
      trang_thai_id: extra?.trang_thai_id ?? "",
      he_thong_id: device?._htId ?? "",
      nhan_vien_id: extra?.nhan_vien_id ?? "",
      nam_san_xuat: device?._namSanXuat ?? undefined,
      ghi_chu: extra?.ghi_chu ?? "",

    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [device, open],
  );

  const fields: SchemaField[] = useMemo(
    () => [
      {
        key: "ten_thiet_bi",
        type: "text",
        label: "Tên tài sản",
        required: true,
        placeholder: "VD: Máy phát VHF chính đài Nội Bài",
      },
      {
        key: "ma_thiet_bi",
        type: "text",
        label: "Mã tài sản",
        placeholder: mode === "create" ? "Bỏ trống để tự sinh (TB####)" : "",
        help:
          mode === "create"
            ? "Bỏ trống hệ thống sẽ tự sinh mã theo quy ước"
            : "Không đổi được sau khi tạo",
        disabled: mode === "edit",
      },
      { key: "ma_serial", type: "text", label: "Số serial (S/N)", placeholder: "SN-xxxx" },
      {
        key: "model_id",
        type: "select",
        label: "Model",
        placeholder: "Chọn model",
        help: "Chủng loại của tài sản được kế thừa từ model",
        emptyOptionLabel: "— Không chọn —",
        loadOptions: loadOpts("dm_model"),
      },
      {
        key: "trang_thai_id",
        type: "select",
        label: "Trạng thái",
        placeholder: "Chọn trạng thái",
        emptyOptionLabel: "— Không chọn —",
        loadOptions: loadOpts("dm_trang_thai_thiet_bi"),
      },
      {
        key: "he_thong_id",
        type: "combobox",
        label: "Hệ thống (khi gán ngay)",
        placeholder: "Để trống = tài sản độc lập",
        loadOptions: loadOpts("dm_he_thong"),
      },
      {
        key: "nhan_vien_id",
        type: "combobox",
        label: "Người sử dụng / quản lý",
        placeholder: "Chọn nhân viên...",
        loadOptions: loadOpts("nhan_vien"),
      },
      {
        key: "nam_san_xuat",

        type: "number",
        label: "Năm sản xuất",
        placeholder: "2024",
        min: 1900,
        max: 2100,
        step: 1,
      },
      { key: "ghi_chu", type: "textarea", label: "Ghi chú", placeholder: "Thông tin bổ sung…" },
    ],
    [mode],
  );

  const save = useMutation({
    mutationFn: async (d: FormValues) => {
      // Cảnh báo mềm: trùng số serial vẫn cho lưu
      const sn = (d.ma_serial ?? "").trim();
      if (sn) {
        const q = supabase
          .from("thiet_bi")
          .select("ma_thiet_bi, ten_thiet_bi")
          .eq("ma_serial", sn)
          .limit(3);
        const { data: dups } = mode === "edit" && device?.id
          ? await q.neq("id", device.id)
          : await q;
        if (dups && dups.length > 0) {
          const list = dups
            .map((r) => {
              const row = r as { ma_thiet_bi: string; ten_thiet_bi: string | null };
              return `${row.ma_thiet_bi}${row.ten_thiet_bi ? " · " + row.ten_thiet_bi : ""}`;
            })
            .join("; ");
          toast.warning(`Trùng số serial "${sn}" với: ${list}`, { duration: 6000 });
        }
      }
      // Chủng loại kế thừa từ model — tra cứu khi có model_id
      let inheritedLoaiId: string | null = null;
      if (d.model_id) {
        const { data: m } = await supabase
          .from("dm_model")
          .select("loai_thiet_bi_id")
          .eq("id", d.model_id)
          .maybeSingle();
        inheritedLoaiId = (m as { loai_thiet_bi_id?: string | null } | null)?.loai_thiet_bi_id ?? null;
      }
      const payload: Record<string, unknown> = {
        ten_thiet_bi: d.ten_thiet_bi,
        ma_serial: d.ma_serial || null,
        loai_thiet_bi_id: inheritedLoaiId,
        model_id: d.model_id || null,
        trang_thai_id: d.trang_thai_id || null,
        he_thong_id: d.he_thong_id || null,
        nhan_vien_id: d.nhan_vien_id || null,
        nam_san_xuat: d.nam_san_xuat ?? null,
        ghi_chu: d.ghi_chu || null,

      };
      if (mode === "create") {
        const genCode = () => {
          const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
          let out = "TB_";
          for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
          return out;
        };
        payload.ma_thiet_bi = d.ma_thiet_bi?.trim() || genCode();
        const { data: inserted, error } = await supabase
          .from("thiet_bi")
          .insert(payload as never)
          .select("ma_thiet_bi")
          .single();
        if (error) throw error;
        return (inserted as { ma_thiet_bi: string }).ma_thiet_bi;
      } else {
        if (!device?.id) throw new Error("Thiếu id tài sản");
        const { error } = await supabase
          .from("thiet_bi")
          .update(payload as never)
          .eq("id", device.id);
        if (error) throw error;
        return device.ma_thiet_bi;
      }
    },
    onSuccess: (ma) => {
      qc.invalidateQueries({ queryKey: ["db_taxonomy"] });
      toast.success(mode === "create" ? `Đã thêm tài sản ${ma}` : "Đã cập nhật tài sản");
      onSaved?.(ma);
      onOpenChange(false);
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Không lưu được tài sản"),
  });

  // Force remount SchemaDialog khi mở lại với device khác để reset defaults
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (open) setNonce((n) => n + 1);
  }, [open, device?.id]);

  if (!open) return null;
  return (
    <SchemaDialog<FormValues>
      key={nonce}
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Thêm tài sản mới" : "Sửa tài sản"}
      description={
        mode === "create"
          ? "Khai tài sản mới vào danh mục. Chỉ tên là bắt buộc — các trường khác có thể bổ sung sau."
          : "Cập nhật thông tin tài sản. Vị trí và đơn vị được kế thừa qua thành phần hệ thống khi lắp."
      }
      fields={fields}
      schema={formSchema}
      defaultValues={defaultValues}
      submitLabel={mode === "create" ? "Thêm tài sản" : "Lưu thay đổi"}
      maxWidth="2xl"
      onSubmit={async (v) => {
        await save.mutateAsync(v);
      }}
    />
  );
}
