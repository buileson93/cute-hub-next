// ============================================================================
// BanQuyenFormDialog — thêm/sửa một bản quyền phần mềm (phan_mem_ban_quyen).
// Dùng SchemaDialog để đồng bộ UX với các form khác trong hệ thống.
// Giai đoạn nâng cấp: Cho phép cấp phát ngay khi tạo mới bản quyền.
// ============================================================================
import { useMemo, useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Laptop, Calendar, User, Info, X } from "lucide-react";
import { SchemaDialog, type SchemaField, type SchemaOption } from "@/components/mirats/SchemaDialog";
import { supabase } from "@/integrations/backend/client";
import type { BanQuyenRow } from "@/lib/mirats/ban-quyen";
import { useSession } from "@/hooks/use-session";
import { Combobox } from "@/components/mirats/Combobox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

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
  const { session, profile } = useSession();
  const mode = row ? "edit" : "create";

  // State cho việc cấp phát ngay khi tạo mới
  const [assignDevices, setAssignDevices] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));
  const [assigner, setAssigner] = useState("");

  // Tự động điền người cài từ profile
  useEffect(() => {
    if (open && profile?.ho_ten) {
      setAssigner(profile.ho_ten);
    }
    if (!open) {
      setAssignDevices([]);
      setAssignSearch("");
    }
  }, [open, profile]);

  // Query lấy danh sách máy tính cho Combobox
  const { data: tbOptions = [], isLoading: loadingTb } = useQuery({
    queryKey: ["ban_quyen", "thiet-bi-options", assignSearch],
    queryFn: async () => {
      let query = supabase
        .from("thiet_bi")
        .select("id, ma_thiet_bi, ten_thiet_bi, dm_loai_thiet_bi!inner(ten, la_may_tinh)")
        .eq("dm_loai_thiet_bi.la_may_tinh", true)
        .order("ten_thiet_bi")
        .limit(50);

      if (assignSearch) {
        query = query.or(`ten_thiet_bi.ilike.%${assignSearch}%,ma_thiet_bi.ilike.%${assignSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return (data ?? []).map((r) => ({
        value: r.id,
        label: `${r.ten_thiet_bi ?? r.ma_thiet_bi} · ${r.ma_thiet_bi}`,
      }));
    },
    enabled: open && mode === "create",
  });

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
        await import("@/lib/mirats/ban-quyen-detail").then((m) =>
          m.logBanQuyenAudit(row.id, "UPDATE", `Cập nhật thông tin bản quyền ${v.ten_phan_mem}`),
        );
      } else {
        // Tạo mới bản quyền
        const { data: bq, error: bqErr } = await supabase
          .from("phan_mem_ban_quyen")
          .insert(payload)
          .select("id, ten_phan_mem")
          .single();
        if (bqErr) throw bqErr;

        if (bq) {
          await import("@/lib/mirats/ban-quyen-detail").then((m) =>
            m.logBanQuyenAudit(bq.id, "CREATE", `Tạo mới bản quyền ${v.ten_phan_mem}`),
          );

          // Cấp phát ngay nếu có chọn thiết bị
          if (assignDevices.length > 0) {
            const capPhatRows = assignDevices.map((tbId) => ({
              ban_quyen_id: bq.id,
              thiet_bi_id: tbId,
              ngay_cai_dat: assignDate,
              nguoi_cai: assigner || null,
            }));

            const { error: cpErr } = await supabase.from("phan_mem_ban_quyen_cap_phat").insert(capPhatRows);
            if (cpErr) {
              // Nếu lỗi cấp phát (vd: hết ghế), ta vẫn giữ bản quyền nhưng báo lỗi
              toast.error(`Bản quyền đã tạo nhưng không thể cấp phát: ${cpErr.message}`);
            } else {
              // Ghi audit cho từng máy
              const m = await import("@/lib/mirats/ban-quyen-detail");
              for (const tbId of assignDevices) {
                await m.logBanQuyenAudit(bq.id, "ASSIGN", `Cấp phát ngay khi tạo mới cho thiết bị ID: ${tbId}`);
              }
              toast.success(`Đã tạo bản quyền và cấp phát cho ${assignDevices.length} máy`);
            }
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ban_quyen"] });
      qc.invalidateQueries({ queryKey: ["ban_quyen", "detail"] });
      qc.invalidateQueries({ queryKey: ["ban_quyen", "cap-phat-list-unified"] });
      if (mode === "edit" || assignDevices.length === 0) {
        toast.success(mode === "create" ? "Đã thêm bản quyền" : "Đã cập nhật bản quyền");
      }
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
      footerExtra={
        mode === "create" && (
          <div className="mt-6 space-y-4 border-t pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Laptop className="h-4 w-4" />
              Cấp phát ngay (tuỳ chọn)
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs">Chọn thiết bị (Máy tính/Máy chủ)</Label>
                <Combobox
                  options={tbOptions}
                  loading={loadingTb}
                  onSearchChange={setAssignSearch}
                  value=""
                  onChange={(val) => {
                    if (val && !assignDevices.includes(val)) {
                      setAssignDevices((prev) => [...prev, val]);
                    }
                  }}
                  placeholder="Tìm và thêm máy tính..."
                />
                {assignDevices.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {assignDevices.map((id) => {
                      const opt = tbOptions.find((o) => o.value === id);
                      return (
                        <Badge key={id} variant="secondary" className="gap-1 pr-1">
                          {opt?.label?.split(" · ")[0] ?? id}
                          <button
                            type="button"
                            onClick={() => setAssignDevices((prev) => prev.filter((x) => x !== id))}
                            className="rounded-full p-0.5 hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs">Người cài đặt</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      value={assigner}
                      onChange={(e) => setAssigner(e.target.value)}
                      placeholder="Họ tên người cài..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ngày cài đặt</Label>
                  <div className="relative">
                    <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={assignDate}
                      onChange={(e) => setAssignDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <p>
                  Bản quyền sẽ được tạo trước, sau đó hệ thống sẽ tự động gán vào các máy tính đã chọn. 
                  Nếu số máy vượt quá "Số ghế", hệ thống sẽ báo lỗi khi lưu.
                </p>
              </div>
            </div>
          </div>
        )
      }
    />
  );
}