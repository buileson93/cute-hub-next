import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, LifeBuoy } from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { canManageHongHoc, normalizePhuongAn } from "@/lib/mirats/hong-hoc-state";
import { buildHongHocPayload } from "@/lib/mirats/ghi-payload";
import { ghiHongHocFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import type { KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";

const PHUONG_AN = [
  { code: "sua_chua", label: "Sửa chữa" },
  { code: "thay_the", label: "Thay thế" },
  { code: "thanh_ly", label: "Thanh lý" },
];

export interface HongHocMoiFormProps {
  defaultSuCo?: string;
  defaultHeThongId?: string;
  defaultThietBi?: string;
  embedded?: boolean;
  onDone?: () => void;
}

export function HongHocMoiForm({ defaultSuCo, defaultHeThongId, defaultThietBi, embedded, onDone }: HongHocMoiFormProps) {
  const { roles, profile } = useSession();
  const { suCo, heThong: heThongScope, inScope } = useScope();
  const suCoParam = defaultSuCo;
  const htParam = defaultHeThongId;
  void defaultThietBi;
  const qc = useQueryClient();

  const [suCoMa, setSuCoMa] = useState(suCoParam ?? "");
  const [heThongId, setHeThongId] = useState(htParam ?? "");
  const [thanhPhanId, setThanhPhanId] = useState<string>("");
  const [thietBiHongId, setThietBiHongId] = useState<string>("");
  const [thietBiThayTheId, setThietBiThayTheId] = useState<string>("");
  const [phuongAn, setPhuongAn] = useState<string>("sua_chua");
  const [ngayHong, setNgayHong] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [boPhan, setBoPhan] = useState<string>("");
  const [moTa, setMoTa] = useState<string>("");

  // Nếu vào từ nút "Ghi nhận hỏng hóc" của trang sự cố → điền sẵn từ sự cố.
  useEffect(() => {
    if (!suCoParam) return;
    const sc = suCo.find((x) => x.ma_su_co === suCoParam);
    if (!sc) return;
    const ht = heThongScope.find((h) => h.ma === sc.he_thong);
    if (ht && !heThongId) {
      // Lấy id từ danh sách taxonomy: heThong ở scope chỉ có `ma`, cần fetch riêng
    }
    if (!moTa) setMoTa(sc.hien_tuong);
  }, [suCoParam, suCo, heThongScope, heThongId, moTa]);

  // Danh sách hệ thống thuộc phạm vi (id + tên).
  const { data: htList } = useQuery({
    queryKey: ["dm_he_thong_min_for_hh"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_he_thong").select("id, ma, ten, don_vi_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const htOptions = useMemo(
    () => (htList ?? []).map((h) => ({ value: h.id, label: `${h.ma} — ${h.ten}` })),
    [htList],
  );

  // Danh sách thành phần thuộc hệ thống đã chọn.
  const { data: tpList } = useQuery({
    queryKey: ["he_thong_thanh_phan_for_hh", heThongId],
    queryFn: async () => {
      if (!heThongId) return [];
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten, vi_tri_id")
        .eq("he_thong_id", heThongId)
        .is("deleted_at", null)
        .order("thu_tu", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!heThongId,
  });
  const tpOptions = useMemo(
    () => (tpList ?? []).map((t) => ({ value: t.id, label: `${t.ma_thanh_phan ?? ""} — ${t.ten ?? ""}` })),
    [tpList],
  );

  // Tài sản hiện đang lắp tại thành phần đã chọn (den_ngay IS NULL) — tài sản hỏng.
  const { data: currentDevice } = useQuery({
    queryKey: ["gan_chuc_nang_hien_hanh", thanhPhanId],
    queryFn: async () => {
      if (!thanhPhanId) return null;
      const { data, error } = await supabase
        .from("gan_chuc_nang")
        .select("thiet_bi_id")
        .eq("thanh_phan_id", thanhPhanId)
        .is("den_ngay", null)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!thanhPhanId,
  });
  useEffect(() => {
    if (currentDevice?.thiet_bi_id && !thietBiHongId) setThietBiHongId(currentDevice.thiet_bi_id);
  }, [currentDevice, thietBiHongId]);

  // Tra ID nội bộ của tài sản (uuid) từ mã ma_thiet_bi hiển thị.
  const tbById = useMemo(() => {
    // thietBi (scope) không có id — cần fetch nhẹ để map.
    return new Map<string, { ma: string; ten: string }>();
  }, []);

  const { data: tbAll } = useQuery({
    queryKey: ["thiet_bi_min_for_hh"],
    queryFn: async () => {
      const { fetchAllRows } = await import("@/lib/mirats/paginate");
      const data = await fetchAllRows<{ id: string; ma_thiet_bi: string; ten_thiet_bi: string | null }>(
        (from, to) => supabase.from("thiet_bi").select("id, ma_thiet_bi, ten_thiet_bi").range(from, to),
      );
      return data;
    },
  });
  const tbOptions = useMemo(
    () => (tbAll ?? []).map((t) => ({ value: t.id, label: `${t.ma_thiet_bi} — ${t.ten_thiet_bi ?? ""}` })),
    [tbAll],
  );
  const tbByIdMap = useMemo(() => new Map((tbAll ?? []).map((t) => [t.id, t])), [tbAll]);

  useEffect(() => { void tbById; }, [tbById]);

  const scopedSuCoOptions = useMemo(
    () => suCo.filter((s) => inScope(s.don_vi)).map((s) => ({
      value: s.ma_su_co, label: `${s.ma_su_co} — ${s.hien_tuong.slice(0, 60)}`,
    })),
    [suCo, inScope],
  );

  const paNorm = normalizePhuongAn(phuongAn);
  const requireThayThe = paNorm === "thay_the";

  const [previewOpen, setPreviewOpen] = useState(false);
  const [maHongHocDraft, setMaHongHocDraft] = useState<string | null>(null);

  function validateBeforeSave(): string | null {
    if (!moTa.trim()) return "Vui lòng nhập mô tả hỏng hóc";
    if (!thietBiHongId) return "Vui lòng chọn tài sản hỏng";
    if (requireThayThe && !thietBiThayTheId) return "Phương án 'Thay thế' cần chọn tài sản thay thế";
    return null;
  }

  function openPreview() {
    const err = validateBeforeSave();
    if (err) { toast.error(err); return; }
    if (!maHongHocDraft) setMaHongHocDraft(`HH-${Date.now().toString(36).toUpperCase()}`);
    setPreviewOpen(true);
  }

  const previewInput: KhaiNghiepVuInput | null = useMemo(() => {
    if (!thietBiHongId) return null;
    const tb = tbByIdMap.get(thietBiHongId);
    return {
      loai: "HONG_HOC",
      thiet_bi_id: thietBiHongId,
      moTa: moTa,
      thoiGian: ngayHong,
      tenThietBi: tb?.ma_thiet_bi,
    };
  }, [thietBiHongId, moTa, ngayHong, tbByIdMap]);

  const save = useMutation({
    mutationFn: async () => {
      const err = validateBeforeSave();
      if (err) throw new Error(err);
      const maHH = maHongHocDraft ?? `HH-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildHongHocPayload({
        ma_hong_hoc: maHH,
        ngay_hong: ngayHong,
        mo_ta_hong_hoc: moTa,
        phuong_an: PHUONG_AN.find((p) => p.code === paNorm)?.label ?? phuongAn,
        thiet_bi_hong_ids: [thietBiHongId],
        thiet_bi_thay_the_id: thietBiThayTheId || null,
        he_thong_id: heThongId || null,
        thanh_phan_id: thanhPhanId || null,
        bo_phan_hong: boPhan || null,
        su_co: suCoMa || null,
        nguoi_thuc_hien: profile?.ho_ten ? [profile.ho_ten] : [],
      });
      const r = await ghiHongHocFull(payload);
      return { ma_hong_hoc: r.ma_hong_hoc };
    },
    onSuccess: async (created) => {
      toast.success("Đã tạo phiếu hỏng hóc");
      setPreviewOpen(false);
      setMaHongHocDraft(null);
      // Link su_co ↔ hong_hoc đã do RPC xử lý; đảm bảo view refresh.
      qc.invalidateQueries({ queryKey: ["operations_data"] });
      void created;
      if (onDone) onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canManageHongHoc(roles)) {
    return <AccessDenied backTo="/hong-hoc" backLabel="Về danh sách hỏng hóc" />;
  }

  return (
    <div className={embedded ? "space-y-4 p-4 pb-24" : "mx-auto max-w-3xl space-y-4 pb-24"}>
      {!embedded && (
        <FormPageHeader
          backTo="/hong-hoc"
          backLabel="Danh sách"
          icon={LifeBuoy}
          title="Tạo phiếu hỏng hóc"
          description="Ghi nhận phiếu hỏng hóc — có thể liên kết tới sự cố nguồn để đối chiếu và bàn giao xử lý."
        />
      )}


      <Card>
        <CardHeader><CardTitle className="text-base">Nguồn gốc</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Sự cố nguồn (tuỳ chọn)</Label>
            <Combobox
              value={suCoMa}
              onChange={setSuCoMa}
              placeholder="Chọn sự cố…"
              options={[{ value: "", label: "— Không —" }, ...scopedSuCoOptions]}
              searchPlaceholder="Tìm mã sự cố…"
            />
          </div>
          <div>
            <Label>Ngày hỏng</Label>
            <Input type="date" value={ngayHong} onChange={(e) => setNgayHong(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Hệ thống</Label>
            <Combobox
              value={heThongId}
              onChange={(v) => { setHeThongId(v); setThanhPhanId(""); setThietBiHongId(""); }}
              placeholder="Chọn hệ thống…"
              options={htOptions}
              searchPlaceholder="Tìm hệ thống…"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Vị trí / thành phần</Label>
            <Combobox
              value={thanhPhanId}
              onChange={(v) => { setThanhPhanId(v); setThietBiHongId(""); }}
              placeholder="Chọn thành phần…"
              options={tpOptions}
              searchPlaceholder="Tìm thành phần…"
            />
            {thanhPhanId && (
              <p className="mt-1 text-xs text-muted-foreground">
                {currentDevice?.thiet_bi_id
                  ? "Tài sản hiện lắp tại vị trí đã được điền sẵn ở ô 'Tài sản hỏng'."
                  : "Chưa có tài sản đang lắp — hãy chọn tài sản hỏng thủ công."}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tài sản & phương án</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div>
            <Label>Tài sản hỏng</Label>
            <Combobox
              value={thietBiHongId}
              onChange={setThietBiHongId}
              placeholder="Chọn tài sản hỏng…"
              options={tbOptions}
              searchPlaceholder="Tìm mã / tên tài sản…"
            />
          </div>
          <div>
            <Label>Phương án</Label>
            <Select value={phuongAn} onValueChange={setPhuongAn}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PHUONG_AN.map((p) => <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {requireThayThe && (
            <div className="md:col-span-2">
              <Label>Tài sản thay thế <span className="text-red-500">*</span></Label>
              <Combobox
                value={thietBiThayTheId}
                onChange={setThietBiThayTheId}
                placeholder="Chọn tài sản thay thế…"
                options={tbOptions}
                searchPlaceholder="Tìm mã / tên tài sản…"
              />
            </div>
          )}
          <div>
            <Label>Bộ phận hỏng</Label>
            <Input value={boPhan} onChange={(e) => setBoPhan(e.target.value)} placeholder="Bo mạch, quạt, ổ cứng…" />
          </div>
          <div className="md:col-span-2">
            <Label>Mô tả hỏng hóc</Label>
            <Textarea value={moTa} onChange={(e) => setMoTa(e.target.value)} rows={4} placeholder="Hiện tượng, nguyên nhân sơ bộ…" />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline"><Link to="/hong-hoc">Huỷ</Link></Button>
        <Button onClick={openPreview} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Lưu phiếu
        </Button>
      </div>

      <PreviewKhaiDialog
        open={previewOpen}
        input={previewInput}
        dangGhi={save.isPending}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={() => save.mutate()}
      />
    </div>
  );
}
