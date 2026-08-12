import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Trash2, FileText, Loader2, Save, FileDown,
  Wand2, Bot, Sparkles, CheckCircle2, Layers, MapPin, Lock,
  ArrowRight, ArrowLeft, Mic, MicOff, AlertTriangle
} from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { toast } from "sonner";
import { rpcErrorToast } from "@/lib/mirats/rpc-error";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useDbTaxonomy, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { exportBaoCaoBanDauToWord } from "@/lib/incident-report-word.functions";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { parseIncidentText } from "@/lib/ai/incident-parse.functions";
import { detectSuCoAnomalies } from "@/lib/mirats/su-co-anomalies";
import { createVoiceRecognition, popVoiceDraft } from "@/lib/mirats/voice-recognition";
import { buildSuCoPayload } from "@/lib/mirats/ghi-payload";
import { ghiSuCoFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import { FormWizardSteps } from "@/components/mirats/FormWizardSteps";
import { cn } from "@/lib/utils";
import { AssetPicker } from "@/components/mirats/AssetPicker";
import { usePrefillKipTruc, usePrefillBienPhap } from "@/hooks/use-ambient-prefill";

const PHAN_LOAI = ["A", "B", "C", "D", "E"];
const MUC_BY_PL: Record<string, string> = { A: "Nghiêm trọng", B: "Cao", C: "Trung bình", D: "Thấp", E: "Thấp" };
const AH_OPTIONS = ["Không ảnh hưởng", "Ảnh hưởng một phần", "Có gián đoạn ĐHB"];
const DEFAULT_RECIPIENTS = ["Phòng An toàn - Chất lượng và An ninh.", "Ban Giám đốc Công ty.", "Phòng Kỹ thuật."];

function fmtDateTime(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} ngày ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface KipRow { ho_ten: string; chuc_vu: string; nang_dinh: string }
interface ThanhPhanRow { id: string; ma: string; ten: string; vi_tri_ten: string | null; he_thong_id: string }
interface MountedAsset { thanh_phan_id: string; device: DbDevice }

export interface SuCoMoiFormProps {
  defaultHeThongId?: string; defaultThietBi?: string; defaultFrom?: string; defaultVoice?: string; embedded?: boolean; onDone?: () => void;
}

export function SuCoMoiForm({ defaultHeThongId, defaultThietBi, defaultFrom, defaultVoice, embedded, onDone }: SuCoMoiFormProps) {
  const { profile } = useSession();
  const qc = useQueryClient();
  const { data: taxo } = useDbTaxonomy();
  const exportFn = useServerFn(exportBaoCaoBanDauToWord);
  const [hienTuong, setHienTuong] = useState("");
  const [kinhGui, setKinhGui] = useState("Phòng An toàn - Chất lượng và An ninh.");
  const [heThongId, setHeThongId] = useState(defaultHeThongId ?? "");
  const [heThongDichVu, setHeThongDichVu] = useState("");
  const [tomTat, setTomTat] = useState("");
  const [thoiGianBatDau, setThoiGianBatDau] = useState("");
  const [thoiGianKetThuc, setThoiGianKetThuc] = useState("");
  const [tinhTrangHT, setTinhTrangHT] = useState("");
  const [ngayPhatHien, setNgayPhatHien] = useState(new Date().toISOString().slice(0, 10));
  const [anhHuongDhb, setAnhHuongDhb] = useState("Không ảnh hưởng");
  const [tinhHinh, setTinhHinh] = useState("");
  const [ketQua, setKetQua] = useState("");
  const [nguyenNhan, setNguyenNhan] = useState("");
  const [bienPhap, setBienPhap] = useState("");
  const [phanLoai, setPhanLoai] = useState("E");
  const [vanDeId, setVanDeId] = useState<string>("");
  const [vanDeOptions, setVanDeOptions] = useState<ComboOption[]>([]);
  const [kip, setKip] = useState<KipRow[]>([{ ho_ten: "", chuc_vu: "", nang_dinh: "" }]);
  const [aiText, setAiText] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [tpList, setTpList] = useState<ThanhPhanRow[]>([]);
  const [selectedTpIds, setSelectedTpIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState<MountedAsset[]>([]);
  const [tpLoading, setTpLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [maNhomDraft, setMaNhomDraft] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [closingIntent, setClosingIntent] = useState(false);

  const kipAmbient = useAmbientApply<KipRow[]>({
    suggested: usePrefillKipTruc(profile?.ho_ten || "").data ?? null,
    isEmpty: (v) => !v || v.length === 0 || v.every((r) => !r.ho_ten.trim()),
    currentValue: kip,
    apply: (v) => setKip(v),
    clear: () => setKip([{ ho_ten: "", chuc_vu: "", nang_dinh: "" }]),
  });

  const selected = useMemo(() => Array.from(new Set(mounted.map(m => m.device.id))).map(id => mounted.find(m => m.device.id === id)!.device), [mounted]);

  useEffect(() => {
    supabase.from("v_van_de").select("id, ma_van_de, tieu_de, trang_thai").neq("trang_thai", "dong").order("created_at", { ascending: false }).then(({ data }) => {
      setVanDeOptions((data ?? []).map(v => ({ value: v.id!, label: v.tieu_de ?? "(không tiêu đề)", hint: v.ma_van_de ?? undefined })));
    });
  }, []);

  function nextStep() { if (step < 3) setStep(s => s + 1); }
  function prevStep() { if (step > 1) setStep(s => s - 1); }

  function validateBeforeSave(closing: boolean): string | null {
    if (!hienTuong.trim()) return "Vui lòng nhập tiêu đề / hiện tượng sự cố";
    if (!heThongDichVu.trim()) return "Vui lòng chọn hệ thống tài sản/dịch vụ bị sự cố";
    if (selectedTpIds.size === 0) return "Chọn ít nhất một thành phần hệ thống bị ảnh hưởng";
    if (selected.length === 0) return "Các thành phần đã chọn chưa lắp tài sản nào — không thể ghi sự cố";
    if (closing) {
      if (!thoiGianKetThuc) return "Đóng sự cố cần có Thời gian kết thúc";
      if (!tinhTrangHT.trim()) return "Đóng sự cố cần khai Tình trạng hệ thống sau xử lý";
      if (!nguyenNhan.trim()) return "Đóng sự cố cần khai Nguyên nhân";
      if (!bienPhap.trim()) return "Đóng sự cố cần khai Biện pháp xử lý";
    }
    return null;
  }

  const buildPayloadForSave = (maNhom: string, closing: boolean) => buildSuCoPayload({
      ma_nhom_bc: maNhom, ngay_phat_hien: ngayPhatHien, nguoi_bao_cao: profile?.ho_ten || profile?.email || "", muc_do: MUC_BY_PL[phanLoai] ?? "Thấp", anh_huong_dhb: anhHuongDhb, hien_tuong: hienTuong, nguyen_nhan: nguyenNhan || null, bien_phap_xu_ly: bienPhap || null,
      bao_cao_ban_dau: { kinh_gui: kinhGui, he_thong_dich_vu: heThongDichVu, tom_tat: tomTat, thoi_gian_bat_dau: fmtDateTime(thoiGianBatDau), thoi_gian_ket_thuc: thoiGianKetThuc ? fmtDateTime(thoiGianKetThuc) : "", dia_diem: "", kip_truc: kip, thanh_phan_list: tpList.filter(t => selectedTpIds.has(t.id)), tinh_trang_he_thong: tinhTrangHT, da_dong: closing, tinh_hinh_hien_tai: tinhHinh, ket_qua_khac_phuc: ketQua, phan_loai: phanLoai, nguyen_nhan: nguyenNhan, bien_phap_xu_ly: bienPhap, thiet_bi_list: selected.map(d => d.ma_thiet_bi), nguon: aiFilled ? "AI" : "Người dùng" },
      van_de_id: vanDeId || null, trang_thai: closing ? "hoan_thanh" : "bao_cao",
      devices: selected.map(d => ({ id: d.id, ma_thiet_bi: d.ma_thiet_bi, don_vi: d.don_vi ?? null, he_thong_id: d._htId ?? null, he_thong_ten: d._htTen ?? null }))
  });

  const save = useMutation({
    mutationFn: async () => {
      const maNhom = maNhomDraft ?? `BC-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildPayloadForSave(maNhom, closingIntent);
      const res = await ghiSuCoFull(payload);
      if (closingIntent && res?.ids?.length && thoiGianKetThuc) {
        await supabase.from("su_co").update({ thoi_diem_khac_phuc: new Date(thoiGianKetThuc).toISOString(), at_hoan_thanh: new Date(thoiGianKetThuc).toISOString(), trang_thai_moi: "hoan_thanh" }).in("id", res.ids);
      }
      return maNhom;
    },
    onSuccess: (maNhom) => { toast.success("Đã lưu sự cố"); setPreviewOpen(false); qc.invalidateQueries({ queryKey: ["operations_data"] }); if (onDone) onDone(); },
    onError: (e: Error) => toast.error(rpcErrorToast(e).title)
  });

  const steps = [{ id: 1, title: "Thông tin chung" }, { id: 2, title: "Thành phần" }, { id: 3, title: "Diễn biến & Đánh giá" }];

  return (
    <div className={embedded ? "flex h-full flex-col" : "mx-auto max-w-5xl space-y-3 pb-28"}>
       {!embedded && <FormPageHeader backTo="/su-co" backLabel="Nhật ký sự cố" icon={FileText} title="Báo cáo ban đầu" />}
       <FormWizardSteps steps={steps} currentStep={step} />
       <div className="flex-1 overflow-y-auto px-4">
         {step === 1 && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-primary">1. Thông tin chung</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Sự cố *</Label>
                    <Textarea value={hienTuong} onChange={e => setHienTuong(e.target.value)} placeholder="Mô tả ngắn gọn hiện tượng..." />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Hệ thống bị sự cố *</Label>
                    <Combobox options={(taxo?.htList ?? []).map(h => ({ value: h.id, label: h.ten }))} value={heThongId} onChange={v => setHeThongId(v)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tài sản chính liên quan *</Label>
                    <AssetPicker 
                      value={heThongDichVu} // Dùng cột chữ thiet_bi/he_thong_dich_vu làm nơi lưu ID tạm thời trong form
                      onChange={(id, ma, ten) => setHeThongDichVu(id)} 
                      heThongId={heThongId}
                    />
                    <p className="text-[10px] text-muted-foreground italic">
                      Lưu ý: Bạn vẫn có thể chọn nhiều thành phần ở bước tiếp theo.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
         )}
         {step === 2 && (
            <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-primary">2. Thành phần</CardTitle></CardHeader>
                <CardContent>
                  {tpList.map(tp => <div key={tp.id} className="flex items-center gap-2"><Checkbox checked={selectedTpIds.has(tp.id)} onCheckedChange={v => { const n = new Set(selectedTpIds); v ? n.add(tp.id) : n.delete(tp.id); setSelectedTpIds(n); }} /> {tp.ten}</div>)}
                </CardContent>
            </Card>
         )}
         {step === 3 && (
            <Card>
                <CardHeader><CardTitle className="text-sm font-semibold text-primary">3. Diễn biến</CardTitle></CardHeader>
                <CardContent>
                    <Label>Tóm tắt</Label><Textarea value={tomTat} onChange={e => setTomTat(e.target.value)} />
                </CardContent>
            </Card>
         )}
       </div>
       <div className="sticky bottom-0 flex items-center justify-between border-t p-4 bg-background">
         <Button variant="ghost" onClick={prevStep} disabled={step === 1}>Quay lại</Button>
         {step < 3 ? <Button onClick={nextStep}>Tiếp tục</Button> : <Button onClick={() => save.mutate()}>Ghi sự cố</Button>}
       </div>
    </div>
  );
}
