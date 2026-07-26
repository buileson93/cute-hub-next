import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Search, Wrench, FileText, CheckCircle2 } from "lucide-react";
import { FormPageHeader } from "@/components/mirats/FormPageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { usePersistentCollapse } from "@/hooks/use-persistent-collapse";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useDbTaxonomy, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { normalize } from "@/lib/mirats/global-search";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import {
  filterBaoTriTemplates,
  findMissingRequired,
  buildSubmissionInsert,
  type MatchedTemplate,
} from "@/lib/mirats/bao-tri-form";
import { ChecklistRenderer } from "@/components/mirats/ChecklistRenderer";
import { fetchCompiledSectionsForTemplate, isChecklistTemplate } from "@/lib/mirats/checklist-repo";
import { buildItemResults, findChecklistError, type ItemInput } from "@/lib/mirats/checklist";
import { buildBaoDuongPayload } from "@/lib/mirats/ghi-payload";
import { ghiBaoDuongFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import type { KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";

const LOAI_OPTIONS = ["Định kỳ", "Đột xuất", "Hiệu chuẩn", "Nâng cấp"];
const TT_OPTIONS = ["Kế hoạch", "Đang thực hiện", "Hoàn thành", "Hoãn"];

type FieldRow = {
  id: string;
  key: string;
  label: string;
  kind: string;
  required: boolean;
  help_text: string | null;
  placeholder: string | null;
  options: string[] | null;
  position: number;
};




export interface BaoTriMoiFormProps {
  defaultHeThongId?: string;
  defaultVersion?: string;
  defaultCongViec?: string;
  embedded?: boolean;
  onDone?: () => void;
}

export function BaoTriMoiForm({ defaultHeThongId, defaultVersion, defaultCongViec, embedded, onDone }: BaoTriMoiFormProps) {
  const qc = useQueryClient();
  const { user, profile, hasRole } = useSession();
  const { data: taxo } = useDbTaxonomy();

  const canManage = hasRole("admin") || hasRole("phong_kt") || hasRole("ktv") || hasRole("to_truong");

  const heThongParam = defaultHeThongId;
  const versionParam = defaultVersion;
  void defaultCongViec;
  const [heThongId, setHeThongId] = useState(heThongParam ?? "");
  const [heThongTen, setHeThongTen] = useState("");
  const [templateId, setTemplateId] = useState("");

  // Khi vào từ 1 hệ thống cụ thể (nút trên node) → điền sẵn tên hệ thống.
  useEffect(() => {
    if (!heThongParam || !taxo) return;
    const ht = (taxo.htList ?? []).find((h) => h.id === heThongParam);
    if (ht) { setHeThongId(ht.id); setHeThongTen(ht.ten); }
  }, [heThongParam, taxo]);

  // Khi vào từ 1 phiếu công việc (WO) → phân giải phiên bản mẫu đã ghim thành template_id.
  const { data: pinnedTemplateId } = useQuery({
    queryKey: ["bao-tri-version-template", versionParam],
    enabled: !!versionParam,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template_version")
        .select("template_id")
        .eq("id", versionParam as string)
        .maybeSingle();
      if (error) throw error;
      return (data?.template_id as string | undefined) ?? null;
    },
  });


  const [selected, setSelected] = useState<DbDevice[]>([]);
  const [devQuery, setDevQuery] = useState("");

  const [loaiBaoTri, setLoaiBaoTri] = useState("Định kỳ");
  const [trangThai, setTrangThai] = useState("Hoàn thành");
  const [ngayBatDau, setNgayBatDau] = useState(new Date().toISOString().slice(0, 10));
  const [ngayHoanThanh, setNgayHoanThanh] = useState(new Date().toISOString().slice(0, 10));
  const [nguoiThucHien, setNguoiThucHien] = useState("");
  const [donViThucHien, setDonViThucHien] = useState(profile?.don_vi ?? "");
  const [ketQua, setKetQua] = useState("");
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [chkValues, setChkValues] = useState<Record<string, ItemInput>>({});
  const [showChkErr, setShowChkErr] = useState(false);

  const heThongOptions: ComboOption[] = useMemo(
    () => (taxo?.htList ?? []).map((h) => ({ value: h.id, label: h.ten, hint: h.ma })),
    [taxo],
  );

  function onPickHeThong(v: string) {
    const ht = (taxo?.htList ?? []).find((h) => h.id === v);
    setHeThongId(ht ? ht.id : "");
    setHeThongTen(ht ? ht.ten : "");
    setTemplateId("");
    setValues({});
    if (ht) setSelected((s) => s.filter((d) => d._htId === ht.id));
    else setSelected([]);
  }

  // Mẫu phiếu bảo dưỡng đã gắn với hệ thống đã chọn.
  const { data: templates, isFetching: loadingTpl } = useQuery({
    queryKey: ["bao-tri-templates", heThongId],
    enabled: !!heThongId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_template_he_thong")
        .select("template_id, form_template!inner(id,code,ten,mo_ta,version,active,nhom)")
        .eq("he_thong_id", heThongId);
      if (error) throw error;
      return filterBaoTriTemplates(
        (data ?? []) as unknown as Parameters<typeof filterBaoTriTemplates>[0],
      );
    },
  });

  // Điền sẵn mẫu theo phiên bản đã ghim của phiếu công việc (nếu có trong danh sách mẫu của hệ thống).
  useEffect(() => {
    if (!pinnedTemplateId || !templates || templateId) return;
    if (templates.some((t) => t.id === pinnedTemplateId)) setTemplateId(pinnedTemplateId);
  }, [pinnedTemplateId, templates, templateId]);


  const selectedTemplate = useMemo(
    () => (templates ?? []).find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  // Các trường của mẫu đã chọn.
  const { data: fields } = useQuery({
    queryKey: ["bao-tri-fields", templateId],
    enabled: !!templateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("form_field")
        .select("*")
        .eq("template_id", templateId)
        .order("position");
      if (error) throw error;
      return (data ?? []) as FieldRow[];
    },
  });

  // Section/hạng mục (checklist) của mẫu — ưu tiên bản đã BIÊN DỊCH (giải include,
  // VD PL04 = PL02 + PL03 + PL01 + phần riêng); fallback section riêng của mẫu.
  const { data: sectionsData } = useQuery({
    queryKey: ["bao-tri-sections", templateId],
    enabled: !!templateId,
    queryFn: () => fetchCompiledSectionsForTemplate(templateId),
  });
  const sections = sectionsData?.sections;
  const sectionVersionId = sectionsData?.versionId ?? null;
  const isChecklist = isChecklistTemplate(sections);

  const devMatches = useMemo(() => {
    const q = normalize(devQuery);
    const chosen = new Set(selected.map((d) => d.ma_thiet_bi));
    let pool = (taxo?.devices ?? []).filter((d) => !chosen.has(d.ma_thiet_bi));
    if (heThongId) pool = pool.filter((d) => d._htId === heThongId);
    if (!heThongId) return [];
    return pool
      .filter((d) => !q || normalize(d.ma_thiet_bi).includes(q) || normalize(d.ten).includes(q))
      .slice(0, 20);
  }, [devQuery, taxo, selected, heThongId]);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [maBaseDraft, setMaBaseDraft] = useState<string | null>(null);

  function validateBeforeSave(): string | null {
    if (!user) return "Chưa đăng nhập";
    if (!heThongId) return "Vui lòng chọn hệ thống";
    if (!templateId || !selectedTemplate) return "Vui lòng chọn mẫu phiếu bảo dưỡng";
    if (selected.length === 0) return "Chọn ít nhất một tài sản được bảo dưỡng";
    if (isChecklist) {
      const chkErr = findChecklistError(sections ?? [], chkValues);
      if (chkErr) { setShowChkErr(true); return chkErr; }
    } else {
      const missing = findMissingRequired(fields ?? [], values);
      if (missing) return `Thiếu trường bắt buộc: ${missing}`;
    }
    return null;
  }

  function openPreview() {
    const err = validateBeforeSave();
    if (err) { toast.error(err); return; }
    if (!maBaseDraft) setMaBaseDraft(`BD-${Date.now().toString(36).toUpperCase()}`);
    setPreviewOpen(true);
  }

  const previewInput: KhaiNghiepVuInput | null = useMemo(() => {
    if (selected.length === 0) return null;
    const d = selected[0];
    return {
      loai: "BAO_DUONG",
      thiet_bi_id: d.id,
      moTa: selectedTemplate?.ten ?? "Bảo dưỡng",
      thoiGian: ngayBatDau,
      tenThietBi: d.ma_thiet_bi,
    };
  }, [selected, selectedTemplate, ngayBatDau]);

  const save = useMutation({
    mutationFn: async () => {
      const err = validateBeforeSave();
      if (err) throw new Error(err);
      if (!user || !selectedTemplate) throw new Error("Thiếu context");

      const submissionBase = buildSubmissionInsert({
        template: selectedTemplate,
        heThongId,
        heThongTen,
        userId: user.id,
        values,
        submittedAt: new Date().toISOString(),
        fields: fields ?? [],
      });

      // buildItemResults trả về mảng đầy đủ; RPC sẽ override submission_id.
      const itemResults = isChecklist
        ? buildItemResults("__placeholder__", sections ?? [], chkValues)
        : [];

      const maBase = maBaseDraft ?? `BD-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildBaoDuongPayload({
        submission: {
          template_id: submissionBase.template_id,
          template_code: submissionBase.template_code,
          template_version: submissionBase.template_version,
          template_snapshot: submissionBase.template_snapshot,
          template_version_id: sectionVersionId ?? null,
          he_thong_id: submissionBase.he_thong_id,
          tieu_de: submissionBase.tieu_de,
          data: submissionBase.data,
          submitted_at: submissionBase.submitted_at,
        },
        ma_base: maBase,
        he_thong_ten: heThongTen,
        loai_bao_tri: loaiBaoTri,
        ngay_bat_dau: ngayBatDau,
        ngay_hoan_thanh: ngayHoanThanh,
        ket_qua: ketQua,
        trang_thai: trangThai,
        nguoi_thuc_hien: nguoiThucHien,
        don_vi_thuc_hien: donViThucHien || profile?.don_vi || "",
        mo_ta_cong_viec: selectedTemplate.ten,
        devices: selected.map((d) => ({
          id: d.id, ma_thiet_bi: d.ma_thiet_bi, don_vi: d.don_vi ?? null,
        })),
        item_results: itemResults as unknown as Record<string, unknown>[],
      });

      const r = await ghiBaoDuongFull(payload);
      return r.bao_tri_ids.length;
    },
    onSuccess: (n) => {
      toast.success(`Đã lập phiếu bảo dưỡng & ghi vào sổ lý lịch (${n} tài sản)`);
      setPreviewOpen(false);
      setMaBaseDraft(null);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
      if (onDone) onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!canManage) {
    return (
      <div className="mx-auto max-w-md py-24 text-center">
        <Wrench className="mx-auto h-10 w-10 text-rose-500" />
        <p className="mt-4 font-semibold">Chỉ phòng kỹ thuật / KTV mới lập được phiếu bảo dưỡng.</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/bao-tri">Quay lại</Link>
        </Button>
      </div>
    );
  }

  const renderField = (f: FieldRow) => {
    const v = values[f.key];
    const set = (val: unknown) => setValues((prev) => ({ ...prev, [f.key]: val }));
    switch (f.kind) {
      case "textarea":
        return <Textarea value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} rows={3} maxLength={2000} placeholder={f.placeholder ?? ""} />;
      case "number":
        return <Input type="number" value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} />;
      case "date":
        return <Input type="date" value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} />;
      case "datetime":
        return <Input type="datetime-local" value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} />;
      case "checkbox":
        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={!!v} onCheckedChange={(c) => set(!!c)} />
            <span className="text-sm text-muted-foreground">{f.placeholder ?? "Đánh dấu nếu có"}</span>
          </div>
        );
      case "select":
        return (
          <Select value={(v as string) ?? ""} onValueChange={set}>
            <SelectTrigger><SelectValue placeholder="Chọn..." /></SelectTrigger>
            <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
          </Select>
        );
      case "multiselect":
        return (
          <div className="flex flex-wrap gap-2">
            {(f.options ?? []).map((o) => {
              const list = (v as string[]) ?? [];
              const on = list.includes(o);
              return (
                <button
                  key={o}
                  type="button"
                  onClick={() => set(on ? list.filter((x) => x !== o) : [...list, o])}
                  className={`rounded-full border px-3 py-1 text-xs transition ${on ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-secondary"}`}
                >
                  {o}
                </button>
              );
            })}
          </div>
        );
      default:
        return <Input value={(v as string) ?? ""} onChange={(e) => set(e.target.value)} maxLength={500} placeholder={f.placeholder ?? ""} />;
    }
  };

  return (
    <div className={embedded ? "px-4 py-4" : "mx-auto max-w-3xl px-6 py-6 lg:px-12"}>
      {!embedded && (
        <>
          <FormPageHeader
            backTo="/bao-tri"
            backLabel="Quay lại"
            icon={Wrench}
            title="Tạo phiếu bảo dưỡng"
            description="Chọn hệ thống để hiện các mẫu phiếu phù hợp. Khi lưu, phiếu được ghi vào sổ lý lịch của từng tài sản và của hệ thống."
          />
          <div className="mt-4" />
        </>
      )}


      {/* 1. Hệ thống */}
      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">1. Hệ thống <span className="text-rose-600">*</span></CardTitle></CardHeader>
        <CardContent>
          <Combobox
            options={heThongOptions}
            value={heThongId}
            onChange={onPickHeThong}
            placeholder="Chọn hệ thống…"
            searchPlaceholder="Tìm hệ thống…"
          />
        </CardContent>
      </Card>

      {/* 2. Mẫu phiếu */}
      {heThongId && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">2. Mẫu phiếu bảo dưỡng <span className="text-rose-600">*</span></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {loadingTpl ? (
              <div className="flex h-16 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
            ) : (templates ?? []).length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Hệ thống này chưa có mẫu phiếu bảo dưỡng.{" "}
                {(hasRole("admin") || hasRole("phong_kt")) && (
                  <Link to="/admin/forms" className="text-primary underline">Tạo/gắn mẫu tại đây</Link>
                )}
              </div>
            ) : (
              (templates ?? []).map((t) => {
                const on = t.id === templateId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setTemplateId(t.id); setValues({}); }}
                    className={`flex w-full items-start gap-3 rounded-md border p-3 text-left transition ${on ? "border-primary bg-primary/5" : "hover:bg-secondary"}`}
                  >
                    <FileText className={`mt-0.5 h-4 w-4 ${on ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.ten}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">{t.code}</Badge>
                      </div>
                      {t.mo_ta && <p className="text-xs text-muted-foreground">{t.mo_ta}</p>}
                    </div>
                    {on && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Tài sản */}
      {heThongId && templateId && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">3. Tài sản được bảo dưỡng <span className="text-rose-600">*</span></CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((d) => (
                  <Badge key={d.id} variant="secondary" className="gap-1">
                    <span className="font-mono text-[10px]">{d.ma_thiet_bi}</span> {d.ten}
                    <button type="button" className="ml-1 text-muted-foreground hover:text-foreground" onClick={() => setSelected((s) => s.filter((x) => x.id !== d.id))}>×</button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={devQuery} onChange={(e) => setDevQuery(e.target.value)} placeholder="Tìm tài sản trong hệ thống…" className="pl-9" />
            </div>
            <div className="max-h-56 space-y-1 overflow-auto rounded border p-2">
              {devMatches.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setSelected((s) => [...s, d]); setDevQuery(""); }}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm hover:bg-secondary"
                >
                  <span><span className="font-mono text-xs">{d.ma_thiet_bi}</span> — {d.ten}</span>
                </button>
              ))}
              {devMatches.length === 0 && <p className="p-2 text-xs text-muted-foreground">Không còn tài sản phù hợp.</p>}
            </div>
            <p className="text-xs text-muted-foreground">Đã chọn: {selected.length} tài sản</p>
          </CardContent>
        </Card>
      )}

      {/* 4. Nội dung phiếu */}
      {heThongId && templateId && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">4. Nội dung phiếu</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <MetadataCollapse
              loaiBaoTri={loaiBaoTri} setLoaiBaoTri={setLoaiBaoTri}
              trangThai={trangThai} setTrangThai={setTrangThai}
              ngayBatDau={ngayBatDau} setNgayBatDau={setNgayBatDau}
              ngayHoanThanh={ngayHoanThanh} setNgayHoanThanh={setNgayHoanThanh}
              nguoiThucHien={nguoiThucHien} setNguoiThucHien={setNguoiThucHien}
              donViThucHien={donViThucHien} setDonViThucHien={setDonViThucHien}
            />


            {isChecklist ? (
              <div className="space-y-3 border-t pt-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Bảng kiểm bảo dưỡng theo mẫu</p>
                <ChecklistRenderer
                  sections={sections ?? []}
                  values={chkValues}
                  onChange={setChkValues}
                  showErrors={showChkErr}
                />
              </div>
            ) : (fields ?? []).length > 0 && (
              <div className="space-y-3 border-t pt-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">Nội dung theo mẫu</p>
                {(fields ?? []).map((f) => (
                  <div key={f.id}>
                    <Label>{f.label}{f.required && <span className="ml-1 text-rose-600">*</span>}</Label>
                    {renderField(f)}
                    {f.help_text && <p className="mt-1 text-xs text-muted-foreground">{f.help_text}</p>}
                  </div>
                ))}
              </div>
            )}


            <div>
              <Label>Kết quả / kết luận</Label>
              <Textarea value={ketQua} onChange={(e) => setKetQua(e.target.value)} rows={3} maxLength={2000} placeholder="Tóm tắt kết quả bảo dưỡng…" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <Button
          size="lg"
          onClick={openPreview}
          disabled={save.isPending || !heThongId || !templateId || selected.length === 0}
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Lưu phiếu bảo dưỡng
        </Button>
      </div>

      {previewInput && (
        <PreviewKhaiDialog
          open={previewOpen}
          input={previewInput}
          dangGhi={save.isPending}
          onCancel={() => setPreviewOpen(false)}
          onConfirm={() => save.mutate()}
        />
      )}
    </div>
  );
}

// GĐ1-03 — thu gọn nhóm metadata không bắt buộc của phiếu bảo dưỡng.
function MetadataCollapse(props: {
  loaiBaoTri: string; setLoaiBaoTri: (v: string) => void;
  trangThai: string; setTrangThai: (v: string) => void;
  ngayBatDau: string; setNgayBatDau: (v: string) => void;
  ngayHoanThanh: string; setNgayHoanThanh: (v: string) => void;
  nguoiThucHien: string; setNguoiThucHien: (v: string) => void;
  donViThucHien: string; setDonViThucHien: (v: string) => void;
}) {
  const [open, setOpen] = usePersistentCollapse("bao-tri-moi", "sec-4-meta", false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
      <CollapsibleTrigger
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium"
        aria-expanded={open}
      >
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
        Thông tin phiếu (không bắt buộc)
        <span className="ml-auto text-xs text-muted-foreground">Loại · Trạng thái · Ngày · Người / Đơn vị</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="grid grid-cols-1 gap-3 border-t p-3 sm:grid-cols-2">
          <div>
            <Label>Loại bảo dưỡng</Label>
            <Select value={props.loaiBaoTri} onValueChange={props.setLoaiBaoTri}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{LOAI_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Trạng thái</Label>
            <Select value={props.trangThai} onValueChange={props.setTrangThai}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TT_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ngày bắt đầu</Label>
            <Input type="date" value={props.ngayBatDau} onChange={(e) => props.setNgayBatDau(e.target.value)} />
          </div>
          <div>
            <Label>Ngày hoàn thành</Label>
            <Input type="date" value={props.ngayHoanThanh} onChange={(e) => props.setNgayHoanThanh(e.target.value)} />
          </div>
          <div>
            <Label>Người thực hiện (phân tách bởi dấu phẩy)</Label>
            <Input value={props.nguoiThucHien} onChange={(e) => props.setNguoiThucHien(e.target.value)} placeholder="VD: Nguyễn A, Trần B" />
          </div>
          <div>
            <Label>Đơn vị thực hiện</Label>
            <Input value={props.donViThucHien} onChange={(e) => props.setDonViThucHien(e.target.value)} />
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

