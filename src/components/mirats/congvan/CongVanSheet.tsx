import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, Plus, Save, Trash2, Upload, Eye, Link2, FileSearch, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/backend/client";
import { storage } from "@/lib/storage";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/mirats/Combobox";
import { DocViewerDialog } from "@/components/mirats/DocViewerDialog";
import { cn } from "@/lib/utils";
import {
  CV_BUCKET, LIEN_KET_META, LOAI_META, TRANG_THAI_META,
  type CongVanLienKetLoai, type CongVanLinkRow, type CongVanLoai, type CongVanRow,
  type CongVanTepRow, type CongVanTrangThai, extractCanCuSo, fmtDate,
} from "./types";

type Draft = {
  so_cong_van: string;
  loai: CongVanLoai;
  trich_yeu: string;
  co_quan_ban_hanh: string;
  co_quan_nhan: string;
  ngay_ban_hanh: string;
  ngay_tiep_nhan: string;
  han_phuc_dap: string;
  trang_thai: CongVanTrangThai;
  can_cu_text: string;
  ghi_chu: string;
};

const EMPTY: Draft = {
  so_cong_van: "", loai: "den", trich_yeu: "", co_quan_ban_hanh: "", co_quan_nhan: "",
  ngay_ban_hanh: "", ngay_tiep_nhan: "", han_phuc_dap: "", trang_thai: "moi",
  can_cu_text: "", ghi_chu: "",
};

export function CongVanSheet({
  open, onOpenChange, duAnId, editing, allCongVan, links, teps, canEdit, onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  duAnId: string;
  editing: CongVanRow | null;
  allCongVan: CongVanRow[];
  links: CongVanLinkRow[];
  teps: CongVanTepRow[];
  canEdit: boolean;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [linkTarget, setLinkTarget] = useState("");
  const [linkLoai, setLinkLoai] = useState<CongVanLienKetLoai>("tra_loi");
  const [viewer, setViewer] = useState<{ id: string; url: string | null; name: string; mime?: string | null } | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(editing ? {
      so_cong_van: editing.so_cong_van,
      loai: editing.loai,
      trich_yeu: editing.trich_yeu ?? "",
      co_quan_ban_hanh: editing.co_quan_ban_hanh ?? "",
      co_quan_nhan: editing.co_quan_nhan ?? "",
      ngay_ban_hanh: editing.ngay_ban_hanh ?? "",
      ngay_tiep_nhan: editing.ngay_tiep_nhan ?? "",
      han_phuc_dap: editing.han_phuc_dap ?? "",
      trang_thai: editing.trang_thai,
      can_cu_text: editing.can_cu_text ?? "",
      ghi_chu: editing.ghi_chu ?? "",
    } : EMPTY);
    setLinkTarget("");
  }, [open, editing]);

  const myTeps = useMemo(
    () => teps.filter((t) => editing && t.cong_van_id === editing.id),
    [teps, editing],
  );
  const byId = useMemo(() => new Map(allCongVan.map((c) => [c.id, c])), [allCongVan]);
  const preds = useMemo(
    () => (editing ? links.filter((l) => l.den_id === editing.id) : []),
    [links, editing],
  );
  const succs = useMemo(
    () => (editing ? links.filter((l) => l.tu_id === editing.id) : []),
    [links, editing],
  );

  // Tự nhận diện "Căn cứ theo công văn số …" → gợi ý công văn gốc.
  const goiYCanCu = useMemo(() => {
    const so = extractCanCuSo(draft.can_cu_text || draft.trich_yeu);
    if (!so) return null;
    const found = allCongVan.find(
      (c) => c.id !== editing?.id && c.so_cong_van.replace(/\s+/g, "").toLowerCase().startsWith(so.toLowerCase()),
    );
    return found ?? null;
  }, [draft.can_cu_text, draft.trich_yeu, allCongVan, editing]);

  async function save() {
    if (!draft.so_cong_van.trim()) { toast.error("Nhập số công văn"); return; }
    setSaving(true);
    try {
      const payload = {
        du_an_id: duAnId,
        so_cong_van: draft.so_cong_van.trim(),
        loai: draft.loai,
        trich_yeu: draft.trich_yeu || null,
        co_quan_ban_hanh: draft.co_quan_ban_hanh || null,
        co_quan_nhan: draft.co_quan_nhan || null,
        ngay_ban_hanh: draft.ngay_ban_hanh || null,
        ngay_tiep_nhan: draft.ngay_tiep_nhan || null,
        han_phuc_dap: draft.han_phuc_dap || null,
        trang_thai: draft.trang_thai,
        can_cu_text: draft.can_cu_text || null,
        ghi_chu: draft.ghi_chu || null,
      };
      if (editing) {
        const { error } = await supabase.from("du_an_cong_van").update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Đã lưu công văn");
      } else {
        const { data, error } = await supabase.from("du_an_cong_van").insert(payload).select("id").single();
        if (error) throw error;
        if (goiYCanCu && data?.id) {
          await supabase.from("du_an_cong_van_lien_ket")
            .insert({ tu_id: goiYCanCu.id, den_id: data.id, loai: "can_cu" });
        }
        toast.success("Đã thêm công văn");
        onOpenChange(false);
      }
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function addLink() {
    if (!editing || !linkTarget) return;
    const { error } = await supabase.from("du_an_cong_van_lien_ket")
      .insert({ tu_id: editing.id, den_id: linkTarget, loai: linkLoai });
    if (error) toast.error(error.message);
    else { toast.success("Đã nối công văn kế nhiệm"); setLinkTarget(""); onDone(); }
  }

  async function removeLink(id: string) {
    const { error } = await supabase.from("du_an_cong_van_lien_ket").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Đã gỡ liên kết"); onDone(); }
  }

  async function upload(file: File) {
    if (!editing) { toast.error("Lưu công văn trước khi đính kèm"); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error("Tệp vượt quá 20MB"); return; }
    setUploading(true);
    const path = `${duAnId}/${editing.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
    try {
      const up = await storage.from(CV_BUCKET).upload(path, file, { upsert: false, contentType: file.type });
      if (up.error) throw up.error;
      const { error } = await supabase.from("du_an_cong_van_tep").insert({
        cong_van_id: editing.id, bucket: CV_BUCKET, file_path: path,
        file_name: file.name, mime_type: file.type || null, kich_thuoc: file.size,
      });
      if (error) { await storage.from(CV_BUCKET).remove([path]); throw error; }
      toast.success("Đã đính kèm bản scan");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function removeTep(t: CongVanTepRow) {
    await storage.from(t.bucket).remove([t.file_path]);
    const { error } = await supabase.from("du_an_cong_van_tep").delete().eq("id", t.id);
    if (error) toast.error(error.message); else { toast.success("Đã xoá tệp"); onDone(); }
  }

  async function openTep(t: CongVanTepRow) {
    setViewer({ id: t.id, url: null, name: t.file_name, mime: t.mime_type });
    const { data } = await storage.from(t.bucket).createSignedUrl(t.file_path, 3600);
    setViewer({ id: t.id, url: (data as { signedUrl?: string } | null)?.signedUrl ?? null, name: t.file_name, mime: t.mime_type });
  }


  async function removeCongVan() {
    if (!editing) return;
    const { error } = await supabase.from("du_an_cong_van").delete().eq("id", editing.id);
    if (error) toast.error(error.message);
    else { toast.success("Đã xoá công văn"); onOpenChange(false); onDone(); }
  }

  const linkOptions = allCongVan
    .filter((c) => c.id !== editing?.id)
    .map((c) => ({ value: c.id, label: c.so_cong_van, hint: fmtDate(c.ngay_ban_hanh) }));

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto sm:max-w-xl">
          <SheetHeader className="pb-2">
            <SheetTitle className="flex items-center gap-2">
              {editing ? editing.so_cong_van : "Công văn mới"}
              <Badge variant="outline" className={cn("text-[10px]", LOAI_META[draft.loai].tone)}>
                {LOAI_META[draft.loai].short}
              </Badge>
            </SheetTitle>
            <SheetDescription>
              {editing ? "Chi tiết & liên kết theo dòng thời gian" : "Thêm công văn vào dòng thời gian dự án"}
            </SheetDescription>
          </SheetHeader>

          <div className="grid gap-3 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Số công văn">
                <Input value={draft.so_cong_van} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, so_cong_van: e.target.value })}
                  placeholder="12/CV-ĐT" />
              </Field>
              <Field label="Loại">
                <Select value={draft.loai} disabled={!canEdit}
                  onValueChange={(v) => setDraft({ ...draft, loai: v as CongVanLoai })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(LOAI_META).map(([k, m]) => (
                      <SelectItem key={k} value={k}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Trích yếu">
              <Textarea rows={2} value={draft.trich_yeu} disabled={!canEdit}
                onChange={(e) => setDraft({ ...draft, trich_yeu: e.target.value })} />
            </Field>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Cơ quan ban hành">
                <Input value={draft.co_quan_ban_hanh} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, co_quan_ban_hanh: e.target.value })} />
              </Field>
              <Field label="Cơ quan nhận">
                <Input value={draft.co_quan_nhan} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, co_quan_nhan: e.target.value })} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Ngày ban hành">
                <Input type="date" value={draft.ngay_ban_hanh} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, ngay_ban_hanh: e.target.value })} />
              </Field>
              <Field label="Ngày tiếp nhận">
                <Input type="date" value={draft.ngay_tiep_nhan} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, ngay_tiep_nhan: e.target.value })} />
              </Field>
              <Field label="Hạn phúc đáp">
                <Input type="date" value={draft.han_phuc_dap} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, han_phuc_dap: e.target.value })} />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Trạng thái">
                <Select value={draft.trang_thai} disabled={!canEdit}
                  onValueChange={(v) => setDraft({ ...draft, trang_thai: v as CongVanTrangThai })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRANG_THAI_META).map(([k, m]) => (
                      <SelectItem key={k} value={k}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Ghi chú">
                <Input value={draft.ghi_chu} disabled={!canEdit}
                  onChange={(e) => setDraft({ ...draft, ghi_chu: e.target.value })} />
              </Field>
            </div>

            <Field label='Căn cứ (VD: "Căn cứ theo công văn số 12/CV-ĐT…")'>
              <Textarea rows={2} value={draft.can_cu_text} disabled={!canEdit}
                onChange={(e) => setDraft({ ...draft, can_cu_text: e.target.value })} />
              {goiYCanCu && !editing && (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sẽ tự nối tới công văn gốc <b>{goiYCanCu.so_cong_van}</b>.
                </p>
              )}
            </Field>

            {canEdit && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void save()} disabled={saving}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                  Lưu
                </Button>
                {editing && (
                  <Button size="sm" variant="outline" className="text-rose-600" onClick={() => void removeCongVan()}>
                    <Trash2 className="mr-1.5 h-4 w-4" /> Xoá
                  </Button>
                )}
              </div>
            )}
          </div>

          {editing && (
            <>
              <Separator className="my-3" />
              <section className="space-y-2">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Link2 className="h-4 w-4" /> Liên kết dòng thời gian
                </h4>
                <div className="space-y-1 text-xs">
                  {preds.map((l) => (
                    <LinkRow key={l.id} text={`← ${byId.get(l.tu_id)?.so_cong_van ?? "?"} · ${LIEN_KET_META[l.loai].label}`}
                      canEdit={canEdit} onRemove={() => void removeLink(l.id)} />
                  ))}
                  {succs.map((l) => (
                    <LinkRow key={l.id} text={`→ ${byId.get(l.den_id)?.so_cong_van ?? "?"} · ${LIEN_KET_META[l.loai].label}`}
                      canEdit={canEdit} onRemove={() => void removeLink(l.id)} />
                  ))}
                  {!preds.length && !succs.length && (
                    <p className="text-muted-foreground">Chưa có liên kết nào.</p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Combobox
                      options={linkOptions}
                      value={linkTarget}
                      onChange={setLinkTarget}
                      placeholder="Chọn công văn kế nhiệm…"
                      searchPlaceholder="Tìm số công văn…"
                      emptyText="Không có công văn phù hợp"
                      className="h-8 w-[230px] text-sm"
                    />
                    <Select value={linkLoai} onValueChange={(v) => setLinkLoai(v as CongVanLienKetLoai)}>
                      <SelectTrigger className="h-8 w-[150px] text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(LIEN_KET_META).map(([k, m]) => (
                          <SelectItem key={k} value={k}>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" variant="outline" onClick={() => void addLink()} disabled={!linkTarget}>
                      <Plus className="mr-1 h-4 w-4" /> Nối
                    </Button>
                  </div>
                )}
              </section>

              <Separator className="my-3" />
              <section className="space-y-2 pb-6">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold">
                  <Paperclip className="h-4 w-4" /> Bản scan & OCR
                </h4>

                {myTeps.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs">
                    <span className="min-w-0 flex-1 truncate">{t.file_name}</span>
                    {(t.metadata as any)?.ocr_status === 'completed' && (
                      <Badge variant="outline" className="h-5 gap-1 border-emerald-200 bg-emerald-50 px-1 text-[9px] text-emerald-700">
                        <Sparkles className="h-2.5 w-2.5" /> OCR
                      </Badge>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => void openTep(t)}>

                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {canEdit && (
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-600" onClick={() => void removeTep(t)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
                {!myTeps.length && <p className="text-xs text-muted-foreground">Chưa có bản scan.</p>}
                {canEdit && (
                  <label className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs hover:bg-muted",
                    uploading && "pointer-events-none opacity-60",
                  )}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    Tải bản scan (PDF/ảnh)
                    <input type="file" className="hidden" accept=".pdf,image/*,.doc,.docx"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
                  </label>
                )}
              </section>
            </>
          )}
        </SheetContent>
      </Sheet>

      <DocViewerDialog
        open={!!viewer}
        onOpenChange={(v) => { if (!v) setViewer(null); }}
        url={viewer?.url ?? null}
        fileName={viewer?.name ?? ""}
        mimeType={viewer?.mime ?? null}
        tepId={viewer?.id}
        sourceType="du_an_cong_van"
        sourceId={editing?.id}

        isLoading={!!viewer && !viewer.url}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function LinkRow({ text, canEdit, onRemove }: { text: string; canEdit: boolean; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 rounded-md border px-2 py-1">
      <span className="min-w-0 flex-1 truncate">{text}</span>
      {canEdit && (
        <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-600" onClick={onRemove}>
          <Trash2 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}