import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rpcErrorToast } from "@/lib/mirats/rpc-error";
import { Loader2, Save, Search, Wrench, FileText, CheckCircle2, ArrowRight, ArrowLeft, Trash2 } from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useDbTaxonomy, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { normalize } from "@/lib/mirats/global-search";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import {
  filterBaoTriTemplates,
  findMissingRequired,
  buildSubmissionInsert,
} from "@/lib/mirats/bao-tri-form";
import { ChecklistRenderer } from "@/components/mirats/ChecklistRenderer";
import { fetchCompiledSectionsForTemplate, isChecklistTemplate } from "@/lib/mirats/checklist-repo";
import { buildItemResults, findChecklistError, type ItemInput } from "@/lib/mirats/checklist";
import { buildBaoDuongPayload } from "@/lib/mirats/ghi-payload";
import { ghiBaoDuongFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import type { KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";
import { FormWizardSteps } from "@/components/mirats/FormWizardSteps";
import { AssetPicker } from "@/components/mirats/AssetPicker";
import { CollapsibleSection } from "@/components/mirats/CollapsibleSection";
import { DynamicFieldsForm } from "@/components/mirats/DynamicFieldsForm";
import type { FieldSpec } from "@/lib/mirats/registry";

const TT_OPTIONS = ["Kế hoạch", "Đang thực hiện", "Hoàn thành", "Hoãn"];
const LOAI_BT_OPTIONS = ["Định kỳ", "Đột xuất", "Khắc phục"];

type FieldRow = {
  id: string; key: string; label: string; kind: string; required: boolean; help_text: string | null; placeholder: string | null; options: string[] | null; position: number;
};

export interface BaoTriMoiFormProps {
  defaultHeThongId?: string; defaultVersion?: string; defaultCongViec?: string; embedded?: boolean; onDone?: () => void;
}

export function BaoTriMoiForm({ defaultHeThongId, defaultVersion, defaultCongViec, embedded, onDone }: BaoTriMoiFormProps) {
  const qc = useQueryClient();
  const { user, profile, hasRole } = useSession();
  const { data: taxo } = useDbTaxonomy();
  const canManage = hasRole("admin") || hasRole("phong_kt") || hasRole("ktv") || hasRole("to_truong");
  const [heThongId, setHeThongId] = useState(defaultHeThongId ?? "");
  const [heThongTen, setHeThongTen] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [selected, setSelected] = useState<DbDevice[]>([]);
  const [trangThai, setTrangThai] = useState("Hoàn thành");
  const [loaiBaoTri, setLoaiBaoTri] = useState("Định kỳ");
  const [donViThucHien, setDonViThucHien] = useState(profile?.don_vi ?? "");
  const [ngayBatDau, setNgayBatDau] = useState(new Date().toISOString().slice(0, 10));
  const [ngayHoanThanh, setNgayHoanThanh] = useState(new Date().toISOString().slice(0, 10));
  const [nguoiThucHien, setNguoiThucHien] = useState("");
  const [ketQua, setKetQua] = useState("");
  const [values, setValues] = useState<Record<string, string>>({});
  const [chkValues, setChkValues] = useState<Record<string, ItemInput>>({});
  const [step, setStep] = useState(1);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [maBaseDraft, setMaBaseDraft] = useState<string | null>(null);

  useEffect(() => {
    if (!defaultHeThongId || !taxo) return;
    const ht = (taxo.htList ?? []).find(h => h.id === defaultHeThongId);
    if (ht) { setHeThongId(ht.id); setHeThongTen(ht.ten); }
  }, [defaultHeThongId, taxo]);

  const { data: templates } = useQuery({
    queryKey: ["bao-tri-templates", heThongId],
    enabled: !!heThongId,
    queryFn: async () => {
      const { data, error } = await supabase.from("form_template_he_thong").select("template_id, form_template!inner(id,code,ten,mo_ta,version,active,nhom)").eq("he_thong_id", heThongId);
      if (error) throw error;
      return filterBaoTriTemplates((data ?? []) as any);
    }
  });

  const { data: fields } = useQuery({ queryKey: ["bao-tri-fields", templateId], enabled: !!templateId, queryFn: async () => {
    const { data, error } = await supabase.from("form_field").select("*").eq("template_id", templateId).order("position");
    return (data ?? []) as FieldRow[];
  }});

  const { data: sectionsData } = useQuery({ queryKey: ["bao-tri-sections", templateId], enabled: !!templateId, queryFn: () => fetchCompiledSectionsForTemplate(templateId) });
  const sections = sectionsData?.sections;
  const isChecklist = isChecklistTemplate(sections);

  const previewInput = useMemo<KhaiNghiepVuInput | null>(() => {
    if (!selected.length) return null;
    return {
      loai: "BAO_DUONG",
      thiet_bi_id: selected[0].id,
      moTa: templates?.find(t => t.id === templateId)?.ten ?? "Bảo trì định kỳ",
      thoiGian: ngayBatDau || new Date().toISOString(),
      tenThietBi: selected[0].ten
    };
  }, [selected, templateId, templates, ngayBatDau]);

  function nextStep() { if (step < 3) setStep(s => s + 1); }
  function prevStep() { if (step > 1) setStep(s => s - 1); }

  function validateBeforeSave(): string | null {
    if (!heThongId) return "Vui lòng chọn hệ thống";
    if (!templateId) return "Vui lòng chọn mẫu phiếu";
    if (selected.length === 0) return "Chọn ít nhất một tài sản";
    if (isChecklist) {
      const chkErr = findChecklistError(sections ?? [], chkValues);
      if (chkErr) return chkErr;
    }
    return null;
  }

  const save = useMutation({
    mutationFn: async () => {
      const maBase = maBaseDraft ?? `BD-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildBaoDuongPayload({
        submission: { 
          template_id: templateId, 
          he_thong_id: heThongId,
          tieu_de: templates?.find(t => t.id === templateId)?.ten ?? "", 
          data: values, 
          submitted_at: new Date().toISOString(), 
          template_code: templates?.find(t => t.id === templateId)?.code ?? "", 
          template_version: 1, 
          template_snapshot: {} 
        },

        ma_base: maBase, he_thong_ten: heThongTen, loai_bao_tri: "Định kỳ", ngay_bat_dau: ngayBatDau, ngay_hoan_thanh: ngayHoanThanh, ket_qua: "", trang_thai: trangThai, nguoi_thuc_hien: nguoiThucHien, don_vi_thuc_hien: profile?.don_vi ?? "", mo_ta_cong_viec: "",
        devices: selected.map(d => ({ id: d.id, ma_thiet_bi: d.ma_thiet_bi, don_vi: d.don_vi ?? null })),
        item_results: isChecklist ? buildItemResults("__placeholder__", sections ?? [], chkValues) as any : []
      });
      const r = await ghiBaoDuongFull(payload);
      return r.bao_tri_ids.length;
    },
    onSuccess: () => { toast.success("Đã lưu phiếu bảo dưỡng"); if (onDone) onDone(); }
  });

  if (!canManage) return <div className="p-8 text-center">Không có quyền truy cập.</div>;

  const steps = [{ id: 1, title: "Hệ thống & Mẫu" }, { id: 2, title: "Tài sản" }, { id: 3, title: "Nội dung phiếu" }];

  return (
    <div className={embedded ? "flex h-full flex-col" : "mx-auto max-w-5xl space-y-3 pb-28"}>
      {!embedded && <FormPageHeader backTo="/bao-tri" backLabel="Quay lại" icon={Wrench} title="Tạo phiếu bảo dưỡng" />}
      <FormWizardSteps steps={steps} currentStep={step} />
      <div className="flex-1 overflow-y-auto px-4">
        {step === 1 && (
          <div className="space-y-4">
            <CollapsibleSection
              formId="bao-tri-moi"
              sectionId="he-thong-mau"
              title="1. Hệ thống & Mẫu phiếu"
              defaultOpen
            >
              <div className="space-y-4">
                <Label>Hệ thống *</Label>
                <Combobox options={(taxo?.htList ?? []).map(h => ({ value: h.id, label: h.ten }))} value={heThongId} onChange={v => setHeThongId(v)} />
                {heThongId && (
                  <div className="space-y-2">
                    <Label>Mẫu phiếu *</Label>
                    {(templates ?? []).map(t => <Button key={t.id} variant={templateId === t.id ? "default" : "outline"} className="w-full justify-start" onClick={() => setTemplateId(t.id)}>{t.ten}</Button>)}
                  </div>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}
        {step === 2 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-primary">2. Chọn tài sản</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Chọn tài sản bảo dưỡng *</Label>
                <AssetPicker
                  value="" // AssetPicker này dùng để thêm vào danh sách `selected`
                  onChange={(id, ma, ten) => {
                    if (id && !selected.some(s => s.id === id)) {
                      // Fetch full data if needed, or assume partial suffices for this flow
                      setSelected([...selected, { id, ma_thiet_bi: ma, ten_thiet_bi: ten } as any]);
                    }
                  }}
                  heThongId={heThongId}
                />
                
                {selected.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase">Danh sách đã chọn ({selected.length})</Label>
                    <div className="border rounded-md divide-y max-h-40 overflow-y-auto">
                      {selected.map(d => (
                        <div key={d.id} className="flex items-center justify-between p-2 text-sm">
                          <span className="truncate">{d.ma_thiet_bi} — {d.ten}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-destructive"
                            onClick={() => setSelected(selected.filter(s => s.id !== d.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        {step === 3 && (
          <Card>
            <CardHeader><CardTitle className="text-sm font-semibold text-primary">3. Nội dung phiếu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Ngày bắt đầu</Label><Input type="date" value={ngayBatDau} onChange={e => setNgayBatDau(e.target.value)} /></div>
                <div><Label>Ngày hoàn thành</Label><Input type="date" value={ngayHoanThanh} onChange={e => setNgayHoanThanh(e.target.value)} /></div>
              </div>
              <Label>Người thực hiện</Label><Input value={nguoiThucHien} onChange={e => setNguoiThucHien(e.target.value)} />
              {isChecklist && sections && <ChecklistRenderer sections={sections} values={chkValues} onChange={setChkValues} />}
            </CardContent>
          </Card>
        )}
      </div>
      <div className="sticky bottom-0 flex items-center justify-between border-t p-4 bg-background">
        <Button variant="ghost" onClick={prevStep} disabled={step === 1}><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại</Button>
        <div className="flex gap-2">
           {step === 3 && <Button variant="secondary" onClick={() => setPreviewOpen(true)}>Xem trước</Button>}
           {step < 3 ? <Button onClick={nextStep}>Tiếp tục <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ghi phiếu"}</Button>}
        </div>
      </div>
      <PreviewKhaiDialog open={previewOpen} input={previewInput} dangGhi={save.isPending} onCancel={() => setPreviewOpen(false)} onConfirm={() => save.mutate()} />
    </div>
  );
}
