// ============================================================================
// GpktImportDialog — Nhập giấy phép khai thác từ PDF, dùng AI bóc tách các
// trường, cảnh báo trùng lặp, gán vào hệ thống và lưu bản ghi kèm file PDF.
// ============================================================================
import { useEffect, useMemo, useState } from "react";
import { Loader2, Upload, FileText, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/mirats/Combobox";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  parseGpktPdf, checkGpktDuplicate, saveGpktRecord,
  type GpktParsedFields, type GpktDuplicate,
} from "@/lib/mirats/gpkt-import.functions";
import { extractPdfText } from "@/lib/mirats/gpkt-pdf-text";
import {
  parseGpktText, validateFields,
  type FieldMeta, type FieldMetaMap,
} from "@/lib/mirats/gpkt-regex-parser";
import { GpktBulkImportDialog } from "@/components/mirats/GpktBulkImportDialog";
import { cn } from "@/lib/utils";

const BUCKET = "giay-phep-khai-thac";

const EMPTY: GpktParsedFields = {
  gp_so: "", gp_ngay: "", gp_han: "", gp_cu: "",
  ten_he_thong_theo_gp: "", nam_sx_gp: "", kieu_thiet_bi: "",
  so_san_xuat: "", noi_san_xuat: "", muc_dich: "", pham_vi: "",
  ma_dia_chi: "", dia_diem: "", thoi_gian: "", thanh_phan_theo_gp: "",
  don_vi: "", tram: "",
};

async function fetchHeThongOptions() {
  const { data, error } = await supabase
    .from("dm_he_thong")
    .select("id, ten, don_vi_id")
    .order("ten", { ascending: true })
    .limit(3000);
  if (error) throw error;
  return (data ?? []) as Array<{ id: string; ten: string; don_vi_id: string | null }>;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onerror = () => reject(new Error("Không đọc được tệp"));
    r.onload = () => {
      const s = String(r.result ?? "");
      const i = s.indexOf("base64,");
      resolve(i >= 0 ? s.slice(i + 7) : s);
    };
    r.readAsDataURL(file);
  });
}

function similarity(a: string, b: string): number {
  const norm = (x: string) => x.toLowerCase().replace(/\s+/g, " ").trim();
  const A = norm(a), B = norm(b);
  if (!A || !B) return 0;
  if (A === B) return 1;
  if (A.includes(B) || B.includes(A)) return 0.85;
  const wa = new Set(A.split(/[\s\-_/.,()]+/).filter((w) => w.length > 2));
  const wb = new Set(B.split(/[\s\-_/.,()]+/).filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return 0;
  let hit = 0;
  wa.forEach((w) => { if (wb.has(w)) hit++; });
  return hit / Math.max(wa.size, wb.size);
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function GpktImportDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [fields, setFields] = useState<GpktParsedFields>(EMPTY);
  const [heThongId, setHeThongId] = useState<string>("");
  const [duplicates, setDuplicates] = useState<GpktDuplicate[]>([]);
  const [overwriteId, setOverwriteId] = useState<string | null>(null);
  const [parseMethod, setParseMethod] = useState<"regex" | "ai" | null>(null);
  const [perField, setPerField] = useState<FieldMetaMap>(() => validateFields(EMPTY, "empty"));
  const [bulkOpen, setBulkOpen] = useState(false);

  const htQ = useQuery({ queryKey: ["dm_he_thong_all"], queryFn: fetchHeThongOptions, staleTime: 60_000, enabled: open });

  // Reset khi đóng
  useEffect(() => {
    if (!open) {
      setFile(null); setFields(EMPTY); setHeThongId("");
      setDuplicates([]); setOverwriteId(null); setParseMethod(null);
      setPerField(validateFields(EMPTY, "empty"));
    }
  }, [open]);

  // Auto suggest hệ thống theo tên bóc tách
  useEffect(() => {
    if (heThongId || !fields.ten_he_thong_theo_gp || !htQ.data) return;
    const scored = htQ.data
      .map((h) => ({ h, s: similarity(fields.ten_he_thong_theo_gp, h.ten) }))
      .sort((a, b) => b.s - a.s);
    if (scored[0] && scored[0].s >= 0.5) setHeThongId(scored[0].h.id);
  }, [fields.ten_he_thong_theo_gp, htQ.data, heThongId]);

  const parseM = useMutation({
    mutationFn: async (f: File) => {
      // Tầng-1: trích text trên trình duyệt + regex parser (nhanh, không tốn AI credit).
      try {
        const txt = await extractPdfText(f);
        if (txt && txt.length > 200) {
          const r = parseGpktText(txt);
          // đạt >=8/17 trường và có số GP → dùng luôn kết quả regex
          if (r.fields.gp_so && r.filledCount >= 8) {
            return { fields: r.fields, method: "regex" as const, filled: r.filledCount, perField: r.perField };
          }
        }
      } catch (e) {
        console.warn("[GPKT] regex tầng-1 lỗi, fallback AI:", e);
      }
      // Tầng-2: AI (PDF scan/không có text-layer hoặc regex ra quá ít trường).
      const base64 = await fileToBase64(f);
      const fields = await parseGpktPdf({
        data: { base64, filename: f.name, mime: f.type || "application/pdf" },
      });
      return { fields, method: "ai" as const, filled: 0, perField: validateFields(fields, "ai") };
    },
    onSuccess: (r) => {
      setFields(r.fields);
      setParseMethod(r.method);
      setPerField(r.perField);
      if (r.method === "regex") {
        toast.success(`Bóc tách nhanh xong (${r.filled}/17 trường). Kiểm tra và bổ sung nếu cần.`);
      } else {
        toast.success("Đã bóc tách bằng AI. Kiểm tra và bổ sung nếu cần.");
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  // Nút "Bóc tách lại bằng AI" — bắt buộc gọi AI khi regex chưa đủ.
  const reparseAiM = useMutation({
    mutationFn: async (f: File) => {
      const base64 = await fileToBase64(f);
      return parseGpktPdf({
        data: { base64, filename: f.name, mime: f.type || "application/pdf" },
      });
    },
    onSuccess: (fields) => {
      setFields(fields);
      setParseMethod("ai");
      setPerField(validateFields(fields, "ai"));
      toast.success("Đã bóc tách lại bằng AI.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  // Sửa tay 1 trường → tính lại meta cho trường đó, giữ nhãn "manual".
  function updateField<K extends keyof GpktParsedFields>(k: K, v: string) {
    const next = { ...fields, [k]: v };
    setFields(next);
    const rev = validateFields(next, "manual");
    // giữ nguyên source của các trường không đổi để badge phản ánh đúng
    setPerField((prev) => {
      const out: FieldMetaMap = { ...prev };
      (Object.keys(rev) as Array<keyof GpktParsedFields>).forEach((key) => {
        if (key === k) out[key] = rev[key];
        else out[key] = { ...prev[key], needsCheck: rev[key].needsCheck, reason: rev[key].reason };
      });
      return out;
    });
  }

  // Tổng số trường bắt buộc/warn cần chú ý
  const needsCheckCount = useMemo(
    () => (Object.values(perField) as FieldMeta[]).filter((m) => m.needsCheck).length,
    [perField],
  );

  // Kiểm tra trùng khi gp_so hoặc he_thong_id đổi
  useEffect(() => {
    const gp = fields.gp_so.trim();
    if (!gp) { setDuplicates([]); return; }
    let cancel = false;
    checkGpktDuplicate({ data: { gp_so: gp, he_thong_id: heThongId || null } })
      .then((rs) => { if (!cancel) setDuplicates(rs); })
      .catch(() => {});
    return () => { cancel = true; };
  }, [fields.gp_so, heThongId]);

  const dupGpSo = duplicates.find((d) => d.match === "gp_so");
  const dupHeThong = duplicates.filter((d) => d.match === "he_thong_active");

  const canSave = !!file && !!fields.gp_so.trim();

  const saveM = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Chưa chọn tệp PDF");
      // Upload file trước
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${new Date().getFullYear()}/${Date.now()}_${safe}`;
      const { compressForUpload } = await import("@/lib/storage/compress");
      const c = await compressForUpload(file);
      const up = await supabase.storage.from(BUCKET).upload(path, c.blob, {
        contentType: c.contentType || "application/pdf",
        upsert: false,
      });
      if (up.error) throw new Error("Tải PDF thất bại: " + up.error.message);
      // Signed URL dài hạn (~10 năm) để lưu vào file_gpkt
      const sig = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
      const fileUrl = sig.data?.signedUrl ?? null;
      const targetOverwriteId = overwriteId || (dupGpSo ? dupGpSo.id : null);
      const res = await saveGpktRecord({
        data: {
          fields,
          he_thong_id: heThongId || null,
          file_gpkt: fileUrl,
          overwrite_id: targetOverwriteId,
        },
      });
      return { id: res.id, replaced: !!targetOverwriteId };
    },
    onSuccess: (r) => {
      toast.success(r.replaced ? "Đã cập nhật GPKT trùng số" : "Đã lưu giấy phép khai thác");
      qc.invalidateQueries({ queryKey: ["licenses_data"] });
      onOpenChange(false);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : String(e)),
  });

  const heThongOpts = useMemo(
    () => (htQ.data ?? []).map((h) => ({ value: h.id, label: h.ten })),
    [htQ.data],
  );

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Nhập giấy phép khai thác từ PDF
          </DialogTitle>
          <DialogDescription>
            Ưu tiên bóc tách nhanh bằng mẫu chuẩn GP-CHK (không tốn AI credit).
            Nếu PDF là ảnh scan hoặc mẫu lạ, hệ thống tự chuyển sang AI. Bạn có thể
            bấm "Bóc tách lại bằng AI" để kiểm tra chéo.
          </DialogDescription>
        </DialogHeader>

        {/* Upload */}
        <div className="rounded-md border border-dashed p-4 flex flex-col gap-3">
          <FileInput
            label="Tệp giấy phép (PDF)"
            description="Chấp nhận .pdf (tối đa 20MB). Ưu tiên bản scan rõ chữ hoặc PDF gốc."
            accept="application/pdf,.pdf"
            maxSizeMb={20}
            value={file ? [file] : []}
            onFilesChange={(fs) => {
              const f = fs[0] ?? null;
              setFile(f);
              if (f) parseM.mutate(f);
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!file || parseM.isPending}
            onClick={() => file && parseM.mutate(file)}
          >
            {parseM.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Bóc tách lại
          </Button>
          <Button
            variant="outline"
            disabled={!file || reparseAiM.isPending}
            onClick={() => file && reparseAiM.mutate(file)}
            title="Ép dùng AI ngay cả khi Tầng-1 đã bóc được"
          >
            {reparseAiM.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
            Bóc tách bằng AI
          </Button>
        </div>

        {/* Cảnh báo trùng */}
        {dupGpSo && (
          <div className="rounded-md border border-red-300 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10 p-3 text-sm text-red-900 dark:text-red-100 flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <div className="font-medium">Số giấy phép đã tồn tại</div>
              <div>
                Đã có bản ghi với số <b>{dupGpSo.gp_so}</b>
                {dupGpSo.he_thong_ten ? <> — hệ thống <b>{dupGpSo.he_thong_ten}</b></> : null}
                {dupGpSo.gp_han ? <> (hết hạn {dupGpSo.gp_han})</> : null}.
              </div>
              <label className="mt-2 flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={overwriteId === dupGpSo.id}
                  onCheckedChange={(checked) => setOverwriteId(checked ? dupGpSo.id : null)}
                />
                <span>Ghi đè bản ghi trùng số GP</span>
              </label>
            </div>
          </div>
        )}
        {dupHeThong.length > 0 && (
          <div className="rounded-md border border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100 flex gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <div className="font-medium">Hệ thống đã có {dupHeThong.length} GPKT còn hiệu lực</div>
              {dupHeThong.slice(0, 5).map((d) => (
                <div key={d.id}>• <b>{d.gp_so}</b>{d.gp_han ? ` — hết hạn ${d.gp_han}` : ""}</div>
              ))}
              <div className="text-xs text-muted-foreground pt-1">
                Kiểm tra kỹ tránh khai trùng cho cùng một hệ thống.
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        {/* Bảng tóm tắt review */}
        {parseMethod && (
          <div className="rounded-md border bg-muted/30 p-2.5 text-xs flex items-center gap-3 flex-wrap">
            <span className="font-medium">Review nhập liệu:</span>
            {parseMethod === "regex" && <Badge variant="outline" className="border-emerald-500 text-emerald-700">Regex</Badge>}
            {parseMethod === "ai" && <Badge variant="outline" className="border-primary text-primary">AI</Badge>}
            <span className="text-muted-foreground">
              {needsCheckCount === 0
                ? "Tất cả trường hợp lệ."
                : <><b className="text-amber-600">{needsCheckCount}</b> trường cần bạn kiểm tra (viền vàng).</>}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Số giấy phép *" meta={perField.gp_so}>
            <Input value={fields.gp_so} onChange={(e) => updateField("gp_so", e.target.value)} placeholder="622/GP-CHK" className={cn(inputCn(perField.gp_so))} />
          </Field>
          <Field label="Số GP cũ (thay thế)" meta={perField.gp_cu}>
            <Input value={fields.gp_cu} onChange={(e) => updateField("gp_cu", e.target.value)} className={cn(inputCn(perField.gp_cu))} />
          </Field>
          <Field label="Ngày cấp" meta={perField.gp_ngay}>
            <Input type="date" value={fields.gp_ngay} onChange={(e) => updateField("gp_ngay", e.target.value)} className={cn(inputCn(perField.gp_ngay))} />
          </Field>
          <Field label="Ngày hết hạn" meta={perField.gp_han}>
            <Input type="date" value={fields.gp_han} onChange={(e) => updateField("gp_han", e.target.value)} className={cn(inputCn(perField.gp_han))} />
          </Field>
          <Field label="Tên hệ thống theo GP" meta={perField.ten_he_thong_theo_gp}>
            <Input value={fields.ten_he_thong_theo_gp} onChange={(e) => updateField("ten_he_thong_theo_gp", e.target.value)} className={cn(inputCn(perField.ten_he_thong_theo_gp))} />
          </Field>
          <Field label="Gán hệ thống (CSDL) *">
            <Combobox
              value={heThongId}
              onChange={setHeThongId}
              options={heThongOpts}
              placeholder="Chọn hệ thống…"
              searchPlaceholder="Tìm hệ thống…"
            />
          </Field>
          <Field label="Đơn vị" meta={perField.don_vi}>
            <Input value={fields.don_vi} onChange={(e) => updateField("don_vi", e.target.value)} className={cn(inputCn(perField.don_vi))} />
          </Field>
          <Field label="Trạm" meta={perField.tram}>
            <Input value={fields.tram} onChange={(e) => updateField("tram", e.target.value)} className={cn(inputCn(perField.tram))} />
          </Field>
          <Field label="Kiểu thiết bị" meta={perField.kieu_thiet_bi}>
            <Input value={fields.kieu_thiet_bi} onChange={(e) => updateField("kieu_thiet_bi", e.target.value)} className={cn(inputCn(perField.kieu_thiet_bi))} />
          </Field>
          <Field label="Số sản xuất" meta={perField.so_san_xuat}>
            <Input value={fields.so_san_xuat} onChange={(e) => updateField("so_san_xuat", e.target.value)} className={cn(inputCn(perField.so_san_xuat))} />
          </Field>
          <Field label="Nơi sản xuất" meta={perField.noi_san_xuat}>
            <Input value={fields.noi_san_xuat} onChange={(e) => updateField("noi_san_xuat", e.target.value)} className={cn(inputCn(perField.noi_san_xuat))} />
          </Field>
          <Field label="Năm SX" meta={perField.nam_sx_gp}>
            <Input value={fields.nam_sx_gp} onChange={(e) => updateField("nam_sx_gp", e.target.value)} className={cn(inputCn(perField.nam_sx_gp))} />
          </Field>
          <Field label="Địa điểm" meta={perField.dia_diem}>
            <Input value={fields.dia_diem} onChange={(e) => updateField("dia_diem", e.target.value)} className={cn(inputCn(perField.dia_diem))} />
          </Field>
          <Field label="Mã địa chỉ" meta={perField.ma_dia_chi}>
            <Input value={fields.ma_dia_chi} onChange={(e) => updateField("ma_dia_chi", e.target.value)} className={cn(inputCn(perField.ma_dia_chi))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Mục đích" meta={perField.muc_dich}>
              <Textarea rows={2} value={fields.muc_dich} onChange={(e) => updateField("muc_dich", e.target.value)} className={cn(inputCn(perField.muc_dich))} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Phạm vi" meta={perField.pham_vi}>
              <Textarea rows={2} value={fields.pham_vi} onChange={(e) => updateField("pham_vi", e.target.value)} className={cn(inputCn(perField.pham_vi))} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Thành phần theo GP" meta={perField.thanh_phan_theo_gp}>
              <Textarea rows={3} value={fields.thanh_phan_theo_gp} onChange={(e) => updateField("thanh_phan_theo_gp", e.target.value)} className={cn(inputCn(perField.thanh_phan_theo_gp))} />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Thời gian khai thác" meta={perField.thoi_gian}>
              <Input value={fields.thoi_gian} onChange={(e) => updateField("thoi_gian", e.target.value)} className={cn(inputCn(perField.thoi_gian))} />
            </Field>
          </div>
        </div>

        {!parseM.isPending && fields.gp_so && !dupGpSo && (
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <CheckCircle2 className="h-4 w-4" />
            Không phát hiện số GP trùng.
            {heThongId && dupHeThong.length === 0 ? " Hệ thống chưa có GPKT nào còn hiệu lực." : ""}
          </div>
        )}

        <DialogFooter className="gap-2">
          <div className="mr-auto text-xs text-muted-foreground flex items-center gap-2">
            {(parseM.isPending || reparseAiM.isPending) && <><Loader2 className="h-3 w-3 animate-spin" /> Đang bóc tách…</>}
            {file && !parseM.isPending && !reparseAiM.isPending && (
              <>
                <Badge variant="secondary">PDF: {(file.size / 1024).toFixed(0)} KB</Badge>
                {parseMethod === "regex" && <Badge variant="outline" className="border-emerald-500 text-emerald-700">Bóc tách nhanh</Badge>}
                {parseMethod === "ai" && <Badge variant="outline" className="border-primary text-primary">AI</Badge>}
                {needsCheckCount > 0 && (
                  <Badge variant="outline" className="border-amber-500 text-amber-700">Cần kiểm tra: {needsCheckCount}</Badge>
                )}
              </>
            )}
          </div>
          <Button variant="outline" onClick={() => { onOpenChange(false); setBulkOpen(true); }}>
            Nhập nhiều PDF…
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button disabled={!canSave || saveM.isPending} onClick={() => saveM.mutate()}>
            {saveM.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {overwriteId ? "Ghi đè & lưu file" : "Tạo GPKT & lưu file"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <GpktBulkImportDialog open={bulkOpen} onOpenChange={setBulkOpen} />
    </>
  );
}

function inputCn(meta?: FieldMeta): string {
  if (!meta) return "";
  if (meta.needsCheck) return "border-amber-500 focus-visible:ring-amber-500";
  if (meta.source === "manual") return "border-sky-400";
  return "";
}

function Field({ label, meta, children }: { label: string; meta?: FieldMeta; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
        {meta && (
          <span className="flex items-center gap-1">
            {meta.source === "regex" && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-emerald-500 text-emerald-700">regex</Badge>}
            {meta.source === "ai" && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-primary text-primary">AI</Badge>}
            {meta.source === "manual" && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-sky-400 text-sky-700">sửa tay</Badge>}
            {meta.needsCheck && (
              <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500 text-amber-700" title={meta.reason ?? "Cần kiểm tra"}>
                cần KT
              </Badge>
            )}
          </span>
        )}
      </div>
      {children}
      {meta?.needsCheck && meta.reason && (
        <p className="text-[11px] text-amber-600">{meta.reason}</p>
      )}
    </div>
  );
}