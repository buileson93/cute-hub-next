import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Save, AlertTriangle, Loader2, ArrowLeftRight } from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { supabase } from "@/integrations/backend/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";

import { useScope } from "@/lib/mirats/scope";
import { detectHoldingConflict, type DangLapRow } from "@/lib/mirats/ban-giao-validate";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_app/ban-giao/moi")({
  head: () => ({ meta: [{ title: "Bàn giao mới — MIRATS 2.0" }] }),
  component: BanGiaoMoiPage,
});

const LOAI_OPTS = ["Cấp phát", "Thu hồi", "Luân chuyển", "Mượn tạm"] as const;

interface NhanVienRow { id: string; ma_nhan_vien: string; ho_ten: string; don_vi: string | null; chuc_vu: string | null }

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function BanGiaoMoiPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { thietBi, donVi } = useScope();

  const [nhanVien, setNhanVien] = useState<NhanVienRow[]>([]);
  const [dangLap, setDangLap] = useState<DangLapRow[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(true);

  const [form, setForm] = useState({
    loai_ban_giao: "Cấp phát" as (typeof LOAI_OPTS)[number],
    thiet_bi_id: "",
    nguoi_giao_id: "",
    nguoi_nhan_id: "",
    don_vi_nhan: "",
    ngay_nhan: todayStr(),
    tinh_trang_khi_nhan: "",
    ghi_chu: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingLookup(true);
      const { fetchAllRows } = await import("@/lib/mirats/paginate");
      const [nvRes, glRows] = await Promise.all([
        supabase.from("nhan_vien").select("id,ma_nhan_vien,ho_ten,don_vi,chuc_vu").eq("hoat_dong", true).order("ho_ten"),
        fetchAllRows<{ thiet_bi_id: string; thanh_phan_id: string; he_thong_thanh_phan?: { ten_vi_tri?: string | null } | null }>(
          (from, to) => supabase.from("gan_chuc_nang")
            .select("thiet_bi_id,thanh_phan_id,he_thong_thanh_phan(ten_vi_tri)" as never)
            .is("den_ngay", null)
            .range(from, to) as never,
        ),
      ]);
      if (nvRes.data) setNhanVien(nvRes.data as NhanVienRow[]);
      setDangLap(
        glRows.map((r) => ({
          thiet_bi_id: r.thiet_bi_id,
          ten_vi_tri: r.he_thong_thanh_phan?.ten_vi_tri ?? "",
        })),
      );
      setLoadingLookup(false);
    })();
  }, []);

  const selectedTB = useMemo(
    () => thietBi.find((t) => t.ma_thiet_bi === form.thiet_bi_id),
    [thietBi, form.thiet_bi_id],
  );

  // thiet_bi_id trên UI đang là mã (ma_thiet_bi); cần map sang UUID để so với gan_chuc_nang.thiet_bi_id
  // gan_chuc_nang.thiet_bi_id là UUID; ThietBi.ma_thiet_bi là mã tự sinh. Không đối soát được trực tiếp
  // → dùng tài sản.id (uuid) qua trường thiet_bi.id nếu có; fallback so khớp ma_thiet_bi.
  const tbIdUUID = (selectedTB as unknown as { id?: string } | undefined)?.id ?? form.thiet_bi_id;

  const conflict = useMemo(
    () =>
      detectHoldingConflict(
        {
          thiet_bi_id: tbIdUUID,
          ngay_nhan: form.ngay_nhan,
          is_return: form.loai_ban_giao === "Thu hồi",
        },
        dangLap,
      ),
    [tbIdUUID, form.ngay_nhan, form.loai_ban_giao, dangLap],
  );

  async function handleSave() {
    if (!form.thiet_bi_id) { toast.error("Chọn tài sản"); return; }
    if (!form.nguoi_nhan_id) { toast.error("Chọn người nhận"); return; }
    setSaving(true);
    try {
      const nvGiao = nhanVien.find((n) => n.id === form.nguoi_giao_id);
      const nvNhan = nhanVien.find((n) => n.id === form.nguoi_nhan_id);
      const ma = `BG-${Date.now().toString(36).toUpperCase()}`;
      const payload = {
        ma_ban_giao: ma,
        loai_ban_giao: form.loai_ban_giao,
        thiet_bi: form.thiet_bi_id,
        thiet_bi_id: (selectedTB as unknown as { id?: string } | undefined)?.id ?? null,
        nguoi_giao_id: form.nguoi_giao_id || null,
        nguoi_nhan_id: form.nguoi_nhan_id || null,
        nguoi_giao: nvGiao?.ho_ten ?? null,
        nguoi_nhan: nvNhan?.ho_ten ?? null,
        don_vi_nhan: form.don_vi_nhan || nvNhan?.don_vi || null,
        ngay_nhan: form.ngay_nhan,
        tinh_trang_khi_nhan: form.tinh_trang_khi_nhan || null,
        ghi_chu: form.ghi_chu || null,
        trang_thai: form.loai_ban_giao === "Thu hồi" ? "Đã trả" : "Đang giữ",
      };
      const { error } = await supabase.from("ban_giao").insert(payload);
      if (error) throw error;
      toast.success(`Đã tạo phiếu bàn giao ${ma}`);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
      navigate({ to: "/ban-giao" });
    } catch (e) {
      toast.error(`Lỗi: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-3xl">
      <FormPageHeader
        backTo="/ban-giao"
        backLabel="Danh sách"
        icon={ArrowLeftRight}
        title="Bàn giao mới"
        description="Lập phiếu bàn giao tài sản — chọn nhân viên từ danh mục để đối soát chính xác người giữ."
      />


      {conflict && (
        <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 text-destructive" />
          <div>
            <div className="font-semibold text-destructive">Cảnh báo đối soát</div>
            <div className="text-muted-foreground">
              Tài sản này đang được lắp tại vị trí <strong>{conflict.viTri || "(không rõ)"}</strong>
              {conflict.nguoiGiu ? <> — người giữ hiện tại: <strong>{conflict.nguoiGiu}</strong></> : null}.
              Nếu vẫn tiếp tục bàn giao cho người khác, hãy đảm bảo đã cập nhật trạng thái lắp trước đó.
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Thông tin phiếu</CardTitle>
          <CardDescription>Nhân viên tham chiếu từ danh mục — không nhập tay để đảm bảo đối soát chính xác.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Loại bàn giao</Label>
            <Select value={form.loai_ban_giao} onValueChange={(v) => setForm((f) => ({ ...f, loai_ban_giao: v as typeof form.loai_ban_giao }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOAI_OPTS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Ngày nhận</Label>
            <Input type="date" value={form.ngay_nhan} onChange={(e) => setForm((f) => ({ ...f, ngay_nhan: e.target.value }))} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Tài sản</Label>
            <Combobox
              value={form.thiet_bi_id}
              onChange={(v) => setForm((f) => ({ ...f, thiet_bi_id: v }))}
              placeholder="Chọn tài sản…"
              searchPlaceholder="Tìm mã / tên…"
              options={thietBi.map((t) => ({ value: t.ma_thiet_bi, label: `${t.ma_thiet_bi} — ${t.ten}` }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Người giao</Label>
            <Combobox
              value={form.nguoi_giao_id}
              onChange={(v) => setForm((f) => ({ ...f, nguoi_giao_id: v }))}
              placeholder={loadingLookup ? "Đang tải…" : "Chọn nhân viên…"}
              searchPlaceholder="Tìm nhân viên…"
              options={nhanVien.map((n) => ({ value: n.id, label: `${n.ma_nhan_vien} — ${n.ho_ten}${n.don_vi ? ` (${n.don_vi})` : ""}` }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Người nhận</Label>
            <Combobox
              value={form.nguoi_nhan_id}
              onChange={(v) => {
                const nv = nhanVien.find((n) => n.id === v);
                setForm((f) => ({ ...f, nguoi_nhan_id: v, don_vi_nhan: f.don_vi_nhan || nv?.don_vi || "" }));
              }}
              placeholder={loadingLookup ? "Đang tải…" : "Chọn nhân viên…"}
              searchPlaceholder="Tìm nhân viên…"
              options={nhanVien.map((n) => ({ value: n.id, label: `${n.ma_nhan_vien} — ${n.ho_ten}${n.don_vi ? ` (${n.don_vi})` : ""}` }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Đơn vị nhận</Label>
            <Combobox
              value={form.don_vi_nhan}
              onChange={(v) => setForm((f) => ({ ...f, don_vi_nhan: v }))}
              placeholder="Chọn đơn vị…"
              searchPlaceholder="Tìm đơn vị…"
              options={donVi.map((d) => ({ value: d.ma, label: `${d.ma} — ${d.ten}` }))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Tình trạng khi nhận</Label>
            <Input value={form.tinh_trang_khi_nhan} onChange={(e) => setForm((f) => ({ ...f, tinh_trang_khi_nhan: e.target.value }))} placeholder="Nguyên vẹn, hoạt động bình thường…" />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Ghi chú</Label>
            <Textarea rows={3} value={form.ghi_chu} onChange={(e) => setForm((f) => ({ ...f, ghi_chu: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild><Link to="/ban-giao">Huỷ</Link></Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Lưu phiếu
        </Button>
      </div>
    </div>
  );
}
