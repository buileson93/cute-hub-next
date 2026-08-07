// ============================================================================
// BanQuyenFormDialog — thêm/sửa một bản quyền phần mềm (phan_mem_ban_quyen).
// Dùng SchemaDialog để đồng bộ UX với các form khác trong hệ thống.
// ============================================================================
import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { SchemaDialog, type SchemaField, type SchemaOption } from "@/components/mirats/SchemaDialog";
import { supabase } from "@/integrations/backend/client";
import type { BanQuyenRow } from "@/lib/mirats/ban-quyen";

const schema = z.object({
  ma_ban_quyen: z.string().trim().max(60).optional(),
  ten_phan_mem: z.string().trim().min(2, "Tên phần mềm tối thiểu 2 ký tự").max(200),
  nha_phat_hanh: z.string().trim().max(160).optional(),
  phien_ban: z.string().trim().max(60).optional(),
  loai_ban_quyen_id: z.string().optional(),
  license_key: z.string().trim().max(400).optional(),
  so_ghe: z.number().int().gte(1, "Số ghế phải ≥ 1").lte(100000).optional(),
  ngay_mua: z.string().optional(),
  ngay_bat_dau: z.string().optional(),
  ngay_het_han: z.string().optional(),
  gia_tri: z.number().gte(0).optional(),
  so_hop_dong: z.string().trim().max(120).optional(),
  don_vi_id: z.string().optional(),
  nha_cung_cap_id: z.string().optional(),
  ghi_chu: z.string().trim().max(2000).optional(),
});
type Values = z.infer<typeof schema>;

function loadOpts(table: "dm_loai_ban_quyen" | "dm_don_vi" | "dm_nha_cung_cap") {
  return {
    queryKey: ["ban-quyen-opts", table] as unknown[],
    queryFn: async (): Promise<SchemaOption[]> => {
      const { data, error } = await supabase.from(table).select("id, ten, ma").order("ten");
      if (error) throw error;
      return (data ?? []).map((r) => {
        const row = r as { id: string; ten: string; ma?: string | null };
        return { value: row.id, label: row.ma ? `${row.ten} · ${row.ma}` : row.ten };
      });
    },
  };
}

export function BanQuyenFormDialog({
  open,
  onOpenChange,
  row,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  row?: BanQuyenRow | null;
}) {
  const qc = useQueryClient();
  const mode = row ? "edit" : "create";

  const defaultValues = useMemo<Partial<Values>>(
    () => ({
      ma_ban_quyen: row?.ma_ban_quyen ?? "",
      ten_phan_mem: row?.ten_phan_mem ?? "",
      nha_phat_hanh: row?.nha_phat_hanh ?? "",
      phien_ban: row?.phien_ban ?? "",
      loai_ban_quyen_id: row?.loai_ban_quyen_id ?? "",
      license_key: row?.license_key ?? "",
      so_ghe: row?.so_ghe ?? undefined,
      ngay_mua: row?.ngay_mua ?? "",
      ngay_bat_dau: row?.ngay_bat_dau ?? "",
      ngay_het_han: row?.ngay_het_han ?? "",
      gia_tri: row?.gia_tri ?? undefined,
      so_hop_dong: row?.so_hop_dong ?? "",
      don_vi_id: row?.don_vi_id ?? "",
      nha_cung_cap_id: row?.nha_cung_cap_id ?? "",
      ghi_chu: row?.ghi_chu ?? "",
    }),
    [row],
  );

  const fields: SchemaField[] = [
    { key: "ma_ban_quyen", type: "text", label: "Mã bản quyền", required: false, placeholder: "Bỏ trống để tự sinh (BQ_XXXXXXXX)", help: "Mã định danh duy nhất trong hệ thống" },
    { key: "ten_phan_mem", type: "text", label: "Tên phần mềm", required: true, placeholder: "VD: Windows 11 Pro" },
    { key: "nha_phat_hanh", type: "text", label: "Nhà phát hành", placeholder: "Microsoft, Autodesk…" },
    { key: "phien_ban", type: "text", label: "Phiên bản", placeholder: "2024, 11 Pro…" },
    {
      key: "loai_ban_quyen_id",
      type: "select",
      label: "Loại bản quyền",
      placeholder: "Chọn loại",
      emptyOptionLabel: "— Không chọn —",
      loadOptions: loadOpts("dm_loai_ban_quyen"),
    },
    { key: "so_ghe", type: "number", label: "Số ghế (seats)", help: "Bỏ trống = không giới hạn số máy cài", min: 1, step: 1 },
    { key: "license_key", type: "password", label: "License key / mã kích hoạt", placeholder: "••••••••••••", colSpan: 2, help: "Thông tin này được ẩn để bảo mật. Chỉ người quản lý mới có quyền xem." },
    
    // Group: Thời hạn
    { key: "ngay_mua", type: "date", label: "Ngày mua" },
    { key: "ngay_het_han", type: "date", label: "Ngày hết hạn", help: "Bỏ trống với bản quyền vĩnh viễn" },
    { key: "ngay_bat_dau", type: "date", label: "Ngày bắt đầu hiệu lực" },
    
    // Group: Tài chính & Đơn vị
    { key: "gia_tri", type: "number", label: "Giá trị (VND)", min: 0, step: 1000 },
    { key: "so_hop_dong", type: "text", label: "Số hợp đồng", placeholder: "HĐ số…" },
    {
      key: "don_vi_id",
      type: "combobox",
      label: "Đơn vị sở hữu",
      placeholder: "Chọn đơn vị",
      loadOptions: loadOpts("dm_don_vi"),
    },
    {
      key: "nha_cung_cap_id",
      type: "combobox",
      label: "Nhà cung cấp",
      placeholder: "Chọn nhà cung cấp",
      loadOptions: loadOpts("dm_nha_cung_cap"),
    },
    { key: "ghi_chu", type: "textarea", label: "Ghi chú", colSpan: 2 },
  ];

  const save = useMutation({
    mutationFn: async (v: Values) => {
      const payload: any = {
        ma_ban_quyen: v.ma_ban_quyen || undefined,
        ten_phan_mem: v.ten_phan_mem,
        nha_phat_hanh: v.nha_phat_hanh || null,
        phien_ban: v.phien_ban || null,
        loai_ban_quyen_id: v.loai_ban_quyen_id || null,
        license_key: v.license_key || null,
        so_ghe: v.so_ghe ?? null,
        ngay_mua: v.ngay_mua || null,
        ngay_bat_dau: v.ngay_bat_dau || null,
        ngay_het_han: v.ngay_het_han || null,
        gia_tri: v.gia_tri ?? null,
        so_hop_dong: v.so_hop_dong || null,
        don_vi_id: v.don_vi_id || null,
        nha_cung_cap_id: v.nha_cung_cap_id || null,
        ghi_chu: v.ghi_chu || null,
      };
      if (row) {
        const { error } = await supabase.from("phan_mem_ban_quyen").update(payload).eq("id", row.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("phan_mem_ban_quyen").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      toast.success(mode === "create" ? "Đã thêm bản quyền" : "Đã cập nhật bản quyền");
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Không lưu được bản quyền"),
  });

  if (!open) return null;
  return (
    <SchemaDialog<Values>
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Thêm bản quyền phần mềm" : "Sửa bản quyền phần mềm"}
      description="Quản lý chi tiết bản quyền: máy tính đang cài những gì, bản quyền đã gán và chưa gán thiết bị."
      fields={fields}
      schema={schema}
      defaultValues={defaultValues}
      submitLabel={mode === "create" ? "Thêm bản quyền" : "Lưu thay đổi"}
      maxWidth="2xl"
      onSubmit={async (v) => {
        await save.mutateAsync(v);
      }}
    />
  );
}