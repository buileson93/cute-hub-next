import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Trash2, FileText, Loader2, Save, FileDown,
  Wand2, Bot, Sparkles, CheckCircle2, Layers, MapPin, Lock,
  ArrowRight, ArrowLeft, Mic, MicOff, AlertTriangle, Info
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
import { Switch } from "@/components/ui/switch";
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
import { type KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";
import { FormWizardSteps } from "@/components/mirats/FormWizardSteps";
import { cn } from "@/lib/utils";
import { AssetPicker } from "@/components/mirats/AssetPicker";
import { usePrefillKipTruc, usePrefillBienPhap } from "@/hooks/use-ambient-prefill";
import { AutoFilledBadge, useAmbientApply } from "@/components/mirats/AutoFilledBadge";
import { CollapsibleSection } from "@/components/mirats/CollapsibleSection";
import { VisionImageHint } from "@/components/mirats/VisionImageHint";



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
interface ThanhPhanRow { id: string; ma_thanh_phan: string; ten: string; he_thong_id: string }
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
  const [bienPhapXuLy, setBienPhapXuLy] = useState("");
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
    suggested: (usePrefillKipTruc(profile?.ho_ten || "").data as KipRow[]) ?? null,
    isEmpty: (v) => !v || v.length === 0 || v.every((r) => !r.ho_ten.trim()),
    currentValue: kip,
    apply: (v) => setKip(v),
    clear: () => setKip([{ ho_ten: "", chuc_vu: "", nang_dinh: "" }]),
  });


  const selected = useMemo(() => Array.from(new Set(mounted.map(m => m.device.id))).map(id => mounted.find(m => m.device.id === id)!.device), [mounted]);

  const anomalies = useMemo(() => detectSuCoAnomalies({
    thoiGianBatDau, thoiGianKetThuc, phanLoai, anhHuongDhb,
    heThongId, selectedTpCount: selectedTpIds.size, mountedAssetsCount: selected.length
  }), [thoiGianBatDau, thoiGianKetThuc, phanLoai, anhHuongDhb, heThongId, selectedTpIds, selected]);

  const previewInput = useMemo<KhaiNghiepVuInput | null>(() => {
    if (!heThongDichVu) return null;
    const found = selected.find(d => d.id === heThongDichVu);
    return {
      loai: "SU_CO",
      thiet_bi_id: heThongDichVu,
      moTa: hienTuong,
      thoiGian: thoiGianBatDau || new Date().toISOString(),
      tenThietBi: found?.ten ?? ""
    };
  }, [heThongDichVu, hienTuong, thoiGianBatDau, selected]);

  const parseFn = useServerFn(parseIncidentText);
  const parseMutation = useMutation({
    mutationFn: async (text: string) => parseFn({ data: { text } }),
    onSuccess: (p) => {
      setHienTuong(p.hien_tuong);
      setHeThongDichVu(p.he_thong_goi_y);
      setTomTat(p.tom_tat);
      setThoiGianBatDau(p.thoi_gian_bat_dau);
      setAnhHuongDhb(p.anh_huong_dhb);
      setNguyenNhan(p.nguyen_nhan);
      setBienPhapXuLy(p.bien_phap_xu_ly);
      setTinhHinh(p.tinh_hinh_hien_tai);
      setKetQua(p.ket_qua_khac_phuc);
      setPhanLoai(p.phan_loai);
      setAiFilled(true);
      toast.success("Đã bóc tách thông tin sự cố");
    },
    onError: (e: Error) => toast.error(e.message)
  });

  const [voiceActive, setVoiceActive] = useState(false);
  const voice = useMemo(() => createVoiceRecognition({
    onTranscript: (text, isFinal) => { setAiText(text); if (isFinal) parseMutation.mutate(text); },
    onEnd: () => setVoiceActive(false),
    onError: (m) => { setVoiceActive(false); toast.error("Lỗi voice: " + m); }
  }), [parseMutation]);

  useEffect(() => {
    if (voiceActive) {
      voice?.start();
    } else {
      voice?.stop();
    }
  }, [voiceActive, voice]);

  useEffect(() => {
    const d = popVoiceDraft();
    if (d?.transcript) { setAiText(d.transcript); parseMutation.mutate(d.transcript); }
    if (defaultVoice) { setAiText(defaultVoice); parseMutation.mutate(defaultVoice); }
  }, [defaultVoice, parseMutation]);

  useEffect(() => {
    supabase.from("v_van_de").select("id, ma_van_de, tieu_de, trang_thai").neq("trang_thai", "dong").order("created_at", { ascending: false }).then(({ data }) => {
      setVanDeOptions((data ?? []).map(v => ({ value: v.id!, label: v.tieu_de ?? "(không tiêu đề)", hint: v.ma_van_de ?? undefined })));
    });
  }, []);

  useEffect(() => {
    if (!heThongId) { setTpList([]); return; }
    setTpLoading(true);
    supabase.from("he_thong_thanh_phan").select("id, ma_thanh_phan, ten, he_thong_id").eq("he_thong_id", heThongId).is("deleted_at", null).then(({ data }) => {
      setTpList((data ?? []) as ThanhPhanRow[]);
      setTpLoading(false);
    });
  }, [heThongId]);

  useEffect(() => {
    if (tpList.length === 0 || selectedTpIds.size === 0) { setMounted([]); return; }
    const tps = Array.from(selectedTpIds);
    supabase.from("gan_chuc_nang").select("thanh_phan_id, thiet_bi(*)").in("thanh_phan_id", tps).is("den_ngay", null).then(({ data }) => {
      const list: MountedAsset[] = (data ?? []).filter(d => d.thiet_bi).map(d => ({ thanh_phan_id: d.thanh_phan_id!, device: d.thiet_bi as unknown as DbDevice }));
      setMounted(list);
    });
  }, [tpList, selectedTpIds]);

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
      if (!bienPhapXuLy.trim()) return "Đóng sự cố cần khai Biện pháp xử lý";
    }
    return null;
  }

  const buildPayloadForSave = (maNhom: string, closing: boolean) => buildSuCoPayload({
      ma_nhom_bc: maNhom, ngay_phat_hien: ngayPhatHien, nguoi_bao_cao: profile?.ho_ten || profile?.email || "", muc_do: MUC_BY_PL[phanLoai] ?? "Thấp", anh_huong_dhb: anhHuongDhb, hien_tuong: hienTuong, nguyen_nhan: nguyenNhan || null, bien_phap_xu_ly: bienPhapXuLy || null,
      bao_cao_ban_dau: { kinh_gui: kinhGui, he_thong_dich_vu: heThongDichVu, tom_tat: tomTat, thoi_gian_bat_dau: fmtDateTime(thoiGianBatDau), thoi_gian_ket_thuc: thoiGianKetThuc ? fmtDateTime(thoiGianKetThuc) : "", dia_diem: "", kip_truc: kip, thanh_phan_list: tpList.filter(t => selectedTpIds.has(t.id)), tinh_trang_he_thong: tinhTrangHT, da_dong: closing, tinh_hinh_hien_tai: tinhHinh, ket_qua_khac_phuc: ketQua, phan_loai: phanLoai, nguyen_nhan: nguyenNhan, bien_phap_xu_ly: bienPhapXuLy, thiet_bi_list: selected.map(d => d.ma_thiet_bi), nguon: aiFilled ? "AI" : "Người dùng" },
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
    onSuccess: (maNhom) => { 
      toast.success("Đã lưu sự cố"); 
      setPreviewOpen(false); 
      qc.invalidateQueries({ queryKey: ["operations_data"] }); 
      
      // Mở file word sau khi lưu thành công
      if (maNhom) {
        exportFn({ data: { ma_nhom_bc: maNhom } }).then(res => {
          if (res?.base64) {
            const link = document.createElement("a");
            link.href = `data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,${res.base64}`;
            link.download = res.fileName || `BaoCaoSuCo_${maNhom}.docx`;
            link.click();
          }
        }).catch(err => console.error("Export word failed:", err));

      }


      if (onDone) onDone(); 
    },

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
              <CollapsibleSection
                formId="su-co-moi"
                sectionId="kinh-gui"
                title="Kính gửi (Thông tin chung)"
                defaultOpen={false}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Kính gửi</Label>
                    <Combobox 
                      options={DEFAULT_RECIPIENTS.map(r => ({ value: r, label: r }))} 
                      value={kinhGui} 
                      onChange={setKinhGui}
                      allowCustom
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Ngày phát hiện *</Label>
                    <Input type="date" value={ngayPhatHien} onChange={e => setNgayPhatHien(e.target.value)} />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                formId="su-co-moi"
                sectionId="khai-bao-nhanh"
                title="1. Khai báo nhanh & AI"
                defaultOpen
                action={
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setVoiceActive(!voiceActive)} className={voiceActive ? "bg-red-50 text-red-600" : ""}>
                      {voiceActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => parseMutation.mutate(aiText)}>
                      <Sparkles className="h-4 w-4 mr-1" /> AI Bóc tách
                    </Button>
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Sự cố / Hiện tượng *</Label>
                    <Textarea value={hienTuong} onChange={e => setHienTuong(e.target.value)} placeholder="Mô tả hiện tượng..." className="min-h-[100px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Hệ thống bị sự cố *</Label>
                      <Combobox options={(taxo?.htList ?? []).map(h => ({ value: h.id, label: h.ten }))} value={heThongId} onChange={v => setHeThongId(v)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Phân loại mức độ (A-E) *</Label>
                      <Select value={phanLoai} onValueChange={setPhanLoai}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PHAN_LOAI.map(l => (
                            <SelectItem key={l} value={l}>
                              <div className="flex items-center gap-2">
                                <Badge variant={l === "A" || l === "B" ? "destructive" : "outline"} className="w-6 justify-center">{l}</Badge>
                                <span>{MUC_BY_PL[l]}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Tài sản chính liên quan *</Label>
                    <AssetPicker value={heThongDichVu} onChange={(id) => setHeThongDichVu(id)} heThongId={heThongId} />
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection
                formId="su-co-moi"
                sectionId="hien-truong"
                title="Ảnh hiện trường & AI"
                defaultOpen={false}
              >
                <VisionImageHint 
                  onApplyDescription={(text: string) => setHienTuong(prev => prev ? prev + "\n" + text : text)}
                  onApplyCategory={(cat: "A" | "B" | "C" | "D" | "E") => setPhanLoai(cat)}
                  onApplyKeywords={(keywords: string[]) => setTomTat(prev => prev ? prev + "\n" + keywords.join(", ") : keywords.join(", "))}
                />
              </CollapsibleSection>

              {anomalies.length > 0 && (
                <Card className="border-amber-200 bg-amber-50/50">
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 mb-1">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Cảnh báo bất thường ({anomalies.length})</span>
                    </div>
                    <ul className="space-y-1">
                      {anomalies.map((a, i) => (
                        <li key={i} className="flex gap-2 text-[12px] leading-relaxed">
                          <span className={cn(
                            "mt-1.5 h-1 w-1 shrink-0 rounded-full",
                            a.severity === "error" ? "bg-red-500" : "bg-amber-500"
                          )} />
                          <div className="flex flex-col">
                            <span className={cn("font-medium", a.severity === "error" ? "text-red-700" : "text-amber-800")}>
                              {a.message}
                            </span>
                            {a.hint && <span className="text-muted-foreground/80">{a.hint}</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

            </div>

          )}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-primary">2. Chọn thành phần hệ thống & Tài sản</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2">
                  {tpLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto" /> : tpList.length === 0 ? (
                    <p className="text-center text-xs text-muted-foreground py-8">Hệ thống chưa có thành phần nào.</p>
                  ) : (
                    tpList.map(tp => (
                      <div key={tp.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md transition-colors">
                        <Checkbox id={`tp-${tp.id}`} checked={selectedTpIds.has(tp.id)} onCheckedChange={v => { const n = new Set(selectedTpIds); v ? n.add(tp.id) : n.delete(tp.id); setSelectedTpIds(n); }} />
                        <Label htmlFor={`tp-${tp.id}`} className="flex-1 cursor-pointer">{tp.ten}</Label>
                      </div>
                    ))
                  )}
                </div>
                {selected.length > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/10 rounded-md">
                    <div className="flex items-center gap-2 text-primary font-medium text-xs mb-1">
                      <Layers className="h-3.5 w-3.5" />
                      <span>Tài sản liên quan ({selected.length})</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2">
                      {selected.map(d => d.ma_thiet_bi).join(", ")}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          {step === 3 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-primary">3. Diễn biến & Đánh giá</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Tóm tắt sự cố</Label>
                    <Textarea value={tomTat} onChange={e => setTomTat(e.target.value)} placeholder="Tóm tắt ngắn gọn diễn biến..." />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Bắt đầu *</Label>
                      <Input type="datetime-local" value={thoiGianBatDau.slice(0, 16)} onChange={e => setThoiGianBatDau(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Kết thúc {closingIntent && "*"}</Label>
                      <Input type="datetime-local" value={thoiGianKetThuc.slice(0, 16)} onChange={e => setThoiGianKetThuc(e.target.value)} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Ảnh hưởng ĐHB *</Label>
                      <Select value={anhHuongDhb} onValueChange={setAnhHuongDhb}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AH_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Vấn đề liên quan (RCA)</Label>
                      <Combobox options={vanDeOptions} value={vanDeId} onChange={setVanDeId} placeholder="— Chọn vấn đề —" />
                    </div>
                  </div>

                  <div className="pt-4 space-y-4">
                    <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="closing-intent" className="text-sm font-semibold text-primary">Chốt đóng sự cố ngay</Label>
                        <p className="text-xs text-muted-foreground">Tự động điền thời gian kết thúc và chuyển trạng thái hoàn thành.</p>
                      </div>
                      <Switch id="closing-intent" checked={closingIntent} onCheckedChange={(v: boolean) => setClosingIntent(!!v)} />
                    </div>

                    {closingIntent && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-1.5">
                          <Label>Tình hình hiện tại *</Label>
                          <Textarea value={tinhHinh} onChange={e => setTinhHinh(e.target.value)} placeholder="Trạng thái hệ thống/tài sản sau khi xử lý..." />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Nguyên nhân *</Label>
                          <Textarea value={nguyenNhan} onChange={e => setNguyenNhan(e.target.value)} placeholder="Kết luận nguyên nhân..." />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Biện pháp xử lý *</Label>
                          <Textarea value={bienPhapXuLy} onChange={e => setBienPhapXuLy(e.target.value)} placeholder="Các bước đã thực hiện để khắc phục..." />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Kết quả / Kết luận *</Label>
                          <Textarea value={ketQua} onChange={e => setKetQua(e.target.value)} placeholder="Đánh giá hiệu quả sau xử lý..." />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 flex items-center justify-between border-t p-4 bg-background">
          <Button variant="ghost" onClick={prevStep} disabled={step === 1}>Quay lại</Button>
          <div className="flex gap-2">
             <Button variant="secondary" onClick={() => setPreviewOpen(true)}><FileDown className="h-4 w-4 mr-1" /> Xem trước</Button>
             {step < 3 ? <Button onClick={nextStep}>Tiếp tục</Button> : <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ghi sự cố"}</Button>}
          </div>
        </div>
        <PreviewKhaiDialog open={previewOpen} input={previewInput} dangGhi={save.isPending} onCancel={() => setPreviewOpen(false)} onConfirm={() => save.mutate()} />
    </div>
  );
}
