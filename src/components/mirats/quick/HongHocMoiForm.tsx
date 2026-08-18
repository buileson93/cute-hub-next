import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Loader2, LifeBuoy, ArrowRight, ArrowLeft } from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { toast } from "sonner";
import { rpcErrorToast } from "@/lib/mirats/rpc-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useScope } from "@/lib/mirats/scope";
import { AccessDenied } from "@/components/mirats/AccessDenied";
import { canManageHongHoc, normalizePhuongAn } from "@/lib/mirats/hong-hoc-state";
import { buildHongHocPayload } from "@/lib/mirats/ghi-payload";
import { ghiHongHocFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import type { KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";
import { FormWizardSteps } from "@/components/mirats/FormWizardSteps";
import { AssetPicker } from "@/components/mirats/AssetPicker";

const PHUONG_AN = [
  { code: "sua_chua", label: "Sửa chữa" },
  { code: "thay_the", label: "Thay thế" },
  { code: "thanh_ly", label: "Thanh lý" },
];

export interface HongHocMoiFormProps {
  defaultSuCo?: string; defaultHeThongId?: string; defaultThietBi?: string; embedded?: boolean; onDone?: () => void;
}

export function HongHocMoiForm({ defaultSuCo, defaultHeThongId, defaultThietBi, embedded, onDone }: HongHocMoiFormProps) {
  const { roles, profile } = useSession();
  const { suCo, heThong: heThongScope, inScope } = useScope();
  const qc = useQueryClient();
  const { data: htList } = useQuery({ queryKey: ["dm_he_thong_min_for_hh"], queryFn: async () => (await supabase.from("dm_he_thong").select("id, ma, ten")).data ?? [] });
  const { data: tbAll } = useQuery({ queryKey: ["thiet_bi_min_for_hh"], queryFn: async () => (await supabase.from("thiet_bi").select("id, ma_thiet_bi, ten_thiet_bi")).data ?? [] });
  
  const [step, setStep] = useState(1);
  const [suCoMa, setSuCoMa] = useState(defaultSuCo ?? "");
  const [heThongId, setHeThongId] = useState(defaultHeThongId ?? "");
  const [thanhPhanId, setThanhPhanId] = useState<string>("");
  const [thietBiHongId, setThietBiHongId] = useState<string>("");
  const [thietBiThayTheId, setThietBiThayTheId] = useState<string>("");
  const [phuongAn, setPhuongAn] = useState<string>("sua_chua");
  const [ngayHong, setNgayHong] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [boPhan, setBoPhan] = useState<string>("");
  const [moTa, setMoTa] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const previewInput = useMemo<KhaiNghiepVuInput | null>(() => {
    if (!thietBiHongId) return null;
    return {
      loai: "HONG_HOC",
      thiet_bi_id: thietBiHongId,
      moTa: moTa || "Báo cáo hỏng hóc",
      thoiGian: ngayHong || new Date().toISOString(),
      tenThietBi: tbAll?.find(d => d.id === thietBiHongId)?.ten_thiet_bi
    };
  }, [thietBiHongId, moTa, ngayHong, tbAll]);

  useEffect(() => {
    if (!defaultSuCo) return;
    const sc = suCo.find(x => x.ma_su_co === defaultSuCo);
    if (sc && !moTa) setMoTa(sc.hien_tuong);
  }, [defaultSuCo, suCo, moTa]);

  const { data: tpList } = useQuery({ queryKey: ["he_thong_thanh_phan_for_hh", heThongId], enabled: !!heThongId, queryFn: async () => (await supabase.from("he_thong_thanh_phan").select("id, ma_thanh_phan, ten").eq("he_thong_id", heThongId).is("deleted_at", null)).data ?? [] });

  const { data: currentDevice } = useQuery({
    queryKey: ["gan_chuc_nang_hien_hanh", thanhPhanId],
    enabled: !!thanhPhanId,
    queryFn: async () => (await supabase.from("gan_chuc_nang").select("thiet_bi_id").eq("thanh_phan_id", thanhPhanId).is("den_ngay", null).maybeSingle()).data
  });
  useEffect(() => { if (currentDevice?.thiet_bi_id) setThietBiHongId(currentDevice.thiet_bi_id); }, [currentDevice]);

  function nextStep() { if (step < 3) setStep(s => s + 1); }
  function prevStep() { if (step > 1) setStep(s => s - 1); }

  const validate = () => {
    if (step === 2) {
      if (!boPhan) { toast.error("Vui lòng nhập bộ phận hỏng"); return false; }
      if (!thietBiHongId) { toast.error("Vui lòng chọn tài sản hỏng"); return false; }
      if (phuongAn === "thay_the" && !thietBiThayTheId) { toast.error("Vui lòng chọn tài sản thay thế"); return false; }
    }
    return true;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!validate()) throw new Error("Validation failed");
      const maHH = `HH-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildHongHocPayload({ 
        ma_hong_hoc: maHH, 
        ngay_hong: ngayHong, 
        mo_ta_hong_hoc: moTa, 
        phuong_an: PHUONG_AN.find(p => p.code === phuongAn)?.label ?? phuongAn, 
        thiet_bi_hong_ids: [thietBiHongId], 
        thiet_bi_thay_the_id: thietBiThayTheId || null, 
        he_thong_id: heThongId || null, 
        thanh_phan_id: thanhPhanId || null, 
        bo_phan_hong: boPhan || null, 
        su_co: suCoMa || null, 
        nguoi_thuc_hien: profile?.ho_ten ? [profile.ho_ten] : [] 
      });
      await ghiHongHocFull(payload);
      return maHH;
    },
    onSuccess: () => { 
      toast.success("Đã ghi nhận hỏng hóc"); 
      qc.invalidateQueries({ queryKey: ["operations_data"] });
      qc.invalidateQueries({ queryKey: ["thiet_bi"] });
      if (onDone) onDone(); 
    }
  });


  if (!canManageHongHoc(roles)) return <AccessDenied backTo="/hong-hoc" backLabel="Về danh sách" />;

  const steps = [{ id: 1, title: "Nguồn gốc" }, { id: 2, title: "Tài sản & Phương án" }, { id: 3, title: "Mô tả chi tiết" }];

  return (
    <div className={embedded ? "flex h-full flex-col" : "mx-auto max-w-5xl space-y-3 pb-28"}>
      {!embedded && <FormPageHeader backTo="/hong-hoc" backLabel="Danh sách" icon={LifeBuoy} title="Tạo phiếu hỏng hóc" />}
      <FormWizardSteps steps={steps} currentStep={step} />
      <div className="flex-1 overflow-y-auto px-4">
        {step === 1 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-primary">1. Nguồn gốc</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Sự cố nguồn (tùy chọn)</Label>
              <Combobox options={suCo.map(s => ({ value: s.ma_su_co, label: s.ma_su_co }))} value={suCoMa} onChange={setSuCoMa} />
              <Label>Hệ thống</Label>
              <Combobox options={(htList ?? []).map(h => ({ value: h.id, label: h.ten }))} value={heThongId} onChange={v => { setHeThongId(v); setThanhPhanId(""); }} />
            </CardContent>
          </Card>
        )}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-primary">2. Tài sản & Phương án</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Vị trí / Thành phần</Label>
                <Combobox options={(tpList ?? []).map(t => ({ value: t.id, label: t.ten }))} value={thanhPhanId} onChange={setThanhPhanId} />
              </div>
              
              <div className="space-y-1.5">
                <Label>Bộ phận hỏng *</Label>
                <Input value={boPhan} onChange={e => setBoPhan(e.target.value)} placeholder="VD: Khối nguồn, Màn hình, Cáp tín hiệu..." />
              </div>

              <div className="space-y-1.5">
                <Label>Tài sản hỏng *</Label>
                <AssetPicker 
                  value={thietBiHongId} 
                  onChange={(id) => setThietBiHongId(id)}
                  heThongId={heThongId}
                  thanhPhanId={thanhPhanId}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Phương án xử lý *</Label>
                <Select value={phuongAn} onValueChange={setPhuongAn}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PHUONG_AN.map(p => <SelectItem key={p.code} value={p.code}>{p.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {phuongAn === "thay_the" && (
                <div className="space-y-1.5 pt-2 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-primary font-bold">Tài sản thay thế *</Label>
                  <AssetPicker 
                    value={thietBiThayTheId} 
                    onChange={(id) => setThietBiThayTheId(id)}
                    heThongId={heThongId}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Lưu ý: Tài sản thay thế phải có sẵn trong kho hoặc đang ở trạng thái sẵn sàng.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-primary">3. Mô tả chi tiết</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Label>Ngày hỏng</Label><Input type="date" value={ngayHong} onChange={e => setNgayHong(e.target.value)} />
              <Label>Mô tả hỏng hóc</Label><Textarea value={moTa} onChange={e => setMoTa(e.target.value)} rows={4} />
            </CardContent>
          </Card>
        )}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between border-t p-4 bg-background">
        <Button variant="ghost" onClick={prevStep} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button>
        <div className="flex gap-2">
           {step === 3 && <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Xem trước</Button>}
           {step < 3 ? <Button onClick={() => { if (validate()) nextStep(); }}>Tiếp tục <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ghi phiếu"}</Button>}
        </div>
      </div>
      <PreviewKhaiDialog open={previewOpen} input={previewInput} dangGhi={save.isPending} onCancel={() => setPreviewOpen(false)} onConfirm={() => save.mutate()} />
    </div>
  );
}
