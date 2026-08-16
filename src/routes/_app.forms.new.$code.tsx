// ============================================================================
// _app.forms.new.$code.tsx — Lập biên bản mới theo mẫu (Form Designer 2.0).
// - Dùng compileField/compileSchema để đọc mọi metadata (unit, ngưỡng, columns,
//   ratings, formula, visible_if, col_span, nhom…).
// - Render qua FormFieldRuntime, chia grid 3 cột theo col_span.
// - Áp dụng visible_if động; ẩn field không hiển thị khỏi validate & data.
// - Chữ ký (canvas) lưu dataURL trong state, khi Submit sẽ upload PNG vào
//   bucket `form-attachments` rồi thay bằng FormAttachment; photo/file dùng
//   PhotoUpload upload trực tiếp trong lúc nhập.
// ============================================================================
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Send, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { compileField, compileSchema, type CompiledField, type RawFieldRow } from "@/lib/mirats/form-schema";
import { evalVisible } from "@/lib/mirats/form-visibility";
import { validateForm } from "@/lib/mirats/form-visibility";
import { FormFieldRuntime, useGridRows } from "@/components/mirats/FormFieldRuntime";
import { uploadSignatureDataUrl, type FormAttachment } from "@/lib/mirats/form-attachments";
import type { SignatureSlot } from "@/components/mirats/MultiSignatureFlow";
import { ChecklistRenderer } from "@/components/mirats/ChecklistRenderer";
import { fetchCompiledSectionsForTemplate, isChecklistTemplate } from "@/lib/mirats/checklist-repo";
import { buildItemResults, findChecklistError, type ItemInput } from "@/lib/mirats/checklist";

export const Route = createFileRoute("/_app/forms/new/$code")({
  head: () => ({ meta: [{ title: "Lập biên bản mới — MIRATS" }] }),
  component: NewSubmission,
});

function makeDraftId(): string {
  return `d-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function NewSubmission() {
  const { code } = Route.useParams();
  const nav = useNavigate();
  const { session, profile, loading } = useSession();
  const qc = useQueryClient();

  const draftIdRef = useRef<string>(makeDraftId());
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [attachments, setAttachments] = useState<Record<string, FormAttachment[]>>({});
  const [checklist, setChecklist] = useState<Record<string, ItemInput>>({});
  const [tieuDe, setTieuDe] = useState("");
  const [kyBaoCao, setKyBaoCao] = useState("");
  const [selectedTb, setSelectedTb] = useState<string[]>([]);
  const [tbSearch, setTbSearch] = useState("");
  const [heThongId, setHeThongId] = useState<string | null>(null);
  const [heThongTouched, setHeThongTouched] = useState(false);
  const [heThongSearch, setHeThongSearch] = useState("");

  const { data: template } = useQuery({
    queryKey: ["template-by-code", code],
    enabled: !!session,
    queryFn: async () => {
      const { data: t, error } = await supabase
        .from("form_template")
        .select("id,code,ten,mo_ta,thiet_bi_mode,require_signature,version")
        .eq("code", code).eq("active", true).maybeSingle();
      if (error) throw error;
      if (!t) throw new Error("Không tìm thấy mẫu");
      const { data: f, error: fe } = await supabase
        .from("form_field").select("*").eq("template_id", t.id).order("position");
      if (fe) throw fe;
      const fields = ((f ?? []) as RawFieldRow[]).map((row, i) => compileField(row, i));
      return { t, fields };
    },
  });

  // Mẫu dạng bảng kiểm (form_check_item + form_section). Ưu tiên bản đã biên
  // dịch của version PUBLISHED, fallback đọc trực tiếp từ mẫu.
  const { data: checklistData } = useQuery({
    queryKey: ["template-checklist", template?.t.id],
    enabled: !!template?.t.id,
    queryFn: async () => fetchCompiledSectionsForTemplate(template!.t.id),
  });
  const checklistSections = checklistData?.sections ?? [];
  const isChecklist = isChecklistTemplate(checklistSections);

  const { data: donVi } = useQuery({
    queryKey: ["my-don-vi", profile?.don_vi],
    enabled: !!profile?.don_vi,
    queryFn: async () => {
      const { data } = await supabase.from("dm_don_vi").select("id,ma,ten")
        .eq("ma", profile!.don_vi!).maybeSingle();
      return data;
    },
  });

  const { data: thietBiList } = useQuery({
    queryKey: ["thiet-bi-picker", tbSearch],
    enabled: !!session && template?.t.thiet_bi_mode !== "none",
    queryFn: async () => {
      let q = supabase.from("thiet_bi").select("id,ma_thiet_bi,ten_thiet_bi,ma_serial,he_thong_id")
        .order("ma_thiet_bi").limit(50);
      if (tbSearch.trim()) q = q.or(`ma_thiet_bi.ilike.%${tbSearch}%,ten_thiet_bi.ilike.%${tbSearch}%`);
      const { data } = await q;
      return data ?? [];
    },
  });

  // Danh sách hệ thống để chọn hoặc suy ra từ tài sản. Nếu template có link
  // form_template_he_thong thì ưu tiên các hệ thống đó.
  const { data: templateHeThongIds } = useQuery({
    queryKey: ["form-template-he-thong", template?.t.id],
    enabled: !!template?.t.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("form_template_he_thong")
        .select("he_thong_id")
        .eq("template_id", template!.t.id);
      return (data ?? []).map((r) => r.he_thong_id as string);
    },
  });

  const { data: heThongList } = useQuery({
    queryKey: ["he-thong-picker", heThongSearch, templateHeThongIds?.join(",") ?? ""],
    enabled: !!session,
    queryFn: async () => {
      let q = supabase.from("dm_he_thong")
        .select("id,ma,ten,don_vi_id")
        .order("ma").limit(50);
      if (templateHeThongIds && templateHeThongIds.length > 0) {
        q = q.in("id", templateHeThongIds);
      }
      if (heThongSearch.trim()) {
        q = q.or(`ma.ilike.%${heThongSearch}%,ten.ilike.%${heThongSearch}%`);
      }
      const { data } = await q;
      return data ?? [];
    },
  });

  // Tự động suy ra hệ thống từ các tài sản đã chọn (khi tất cả cùng 1 hệ thống)
  // — chỉ áp dụng khi người dùng chưa tự chọn.
  const derivedHt = useMemo(() => {
    if (!thietBiList || selectedTb.length === 0) return null;
    const set = new Set<string>();
    for (const id of selectedTb) {
      const tb = thietBiList.find((x) => x.id === id);
      if (tb?.he_thong_id) set.add(tb.he_thong_id);
    }
    return set.size === 1 ? Array.from(set)[0] : null;
  }, [thietBiList, selectedTb]);
  const effectiveHeThongId = heThongTouched ? heThongId : (heThongId ?? derivedHt);
  const heThongInfo = useMemo(
    () => (effectiveHeThongId ? heThongList?.find((h) => h.id === effectiveHeThongId) ?? null : null),
    [heThongList, effectiveHeThongId],
  );

  // Lọc field hiển thị theo visible_if (đánh giá liên tục theo values).
  const visibleFields: CompiledField[] = useMemo(() => {
    if (!template) return [];
    return template.fields.filter((f) => evalVisible(f.visible_if, values));
  }, [template, values]);

  // Nhóm cho grid 3 cột.
  const rows = useGridRows(visibleFields);

  const saveM = useMutation({
    mutationFn: async (status: "draft" | "submitted") => {
      if (!template || !session) throw new Error("Chưa sẵn sàng");

      // Validate required + required_if + constraint_formula + min/max ngưỡng.
      if (status === "submitted") {
        const errs = validateForm(visibleFields, values);
        if (errs.length > 0) {
          throw new Error(errs.map((e) => `• ${e.message}`).join("\n"));
        }
        if (isChecklist) {
          const cErr = findChecklistError(checklistSections, checklist);
          if (cErr) throw new Error(cErr);
        }
        if (template.t.thiet_bi_mode === "single" && selectedTb.length !== 1)
          throw new Error("Cần chọn đúng 1 tài sản");
        if (template.t.thiet_bi_mode === "multi" && selectedTb.length === 0)
          throw new Error("Cần chọn ít nhất 1 tài sản");
      }


      // Upload chữ ký (dataURL -> PNG). Hỗ trợ cả single & multi-signer.
      const finalValues: Record<string, unknown> = { ...values };
      const allSignatures: Array<SignatureSlot & { field_key: string; field_label: string }> = [];
      for (const f of visibleFields) {
        if (f.kind !== "signature") continue;
        const v = finalValues[f.key];

        if (Array.isArray(v)) {
          const slots = v as SignatureSlot[];
          const out: SignatureSlot[] = [];
          for (const s of slots) {
            let saved = s;
            if (s.data_url && s.data_url.startsWith("data:image")) {
              try {
                const att = await uploadSignatureDataUrl(s.data_url, {
                  templateCode: template.t.code,
                  draftId: draftIdRef.current,
                  fieldKey: `${f.key}__${s.key}`,
                });
                saved = { ...s, data_url: att.path };
              } catch (e) {
                throw new Error(`Không lưu được chữ ký "${s.label}" (${f.label}): ${(e as Error).message}`);
              }
            }
            out.push(saved);
            if (saved.signed_at) allSignatures.push({ ...saved, field_key: f.key, field_label: f.label });
          }
          finalValues[f.key] = out;
          continue;
        }

        if (typeof v === "string" && v.startsWith("data:image")) {
          try {
            const att = await uploadSignatureDataUrl(v, {
              templateCode: template.t.code,
              draftId: draftIdRef.current,
              fieldKey: f.key,
            });
            finalValues[f.key] = att satisfies FormAttachment;
            allSignatures.push({
              key: f.key, label: f.label, data_url: att.path,
              signer_id: session.user.id,
              signer_name: profile?.ho_ten ?? session.user.email ?? null,
              signed_at: new Date().toISOString(),
              field_key: f.key, field_label: f.label,
            });
          } catch (e) {
            throw new Error(`Không lưu được chữ ký "${f.label}": ${(e as Error).message}`);
          }
        }
      }

      // Gắn sidecar đính kèm vào data để lưu cùng.
      finalValues.__attachments = attachments;

      // Snapshot cấu trúc mẫu tại thời điểm lập phiếu.
      const snapshot = compileSchema(template.t, template.fields);
      const { data: ins, error } = await supabase.from("form_submission").insert({
        template_id: template.t.id,
        template_code: template.t.code,
        template_version: template.t.version,
        template_snapshot: snapshot as never,
        don_vi_id: donVi?.id ?? null,
        created_by: session.user.id,
        status,
        data: finalValues as never,
        signatures: allSignatures as never,
        tieu_de: tieuDe.trim() || template.t.ten,
        ky_bao_cao: kyBaoCao.trim() || null,
        thiet_bi_id: template.t.thiet_bi_mode === "single" && selectedTb[0] ? selectedTb[0] : null,
        he_thong_id: effectiveHeThongId ?? null,
        submitted_at: status === "submitted" ? new Date().toISOString() : null,
      }).select("id").single();
      if (error) throw error;


      if (template.t.thiet_bi_mode === "multi" && selectedTb.length > 0) {
        const arr = selectedTb.map((tid) => ({ submission_id: ins.id, thiet_bi_id: tid }));
        await supabase.from("form_submission_thiet_bi").insert(arr);
      }

      // Lưu kết quả bảng kiểm (nếu mẫu dạng checklist).
      if (isChecklist) {
        const rows = buildItemResults(ins.id as string, checklistSections, checklist);
        if (rows.length > 0) {
          const { error: rErr } = await supabase
            .from("form_submission_item_result")
            .insert(rows as never);
          if (rErr) throw rErr;
        }
      }
      return ins.id as string;
    },
    onSuccess: (id, status) => {
      // Sync ngay Nhật ký khai thác của hệ thống liên quan
      if (effectiveHeThongId) {
        qc.invalidateQueries({ queryKey: ["he-thong-submissions", effectiveHeThongId] });
      }
      qc.invalidateQueries({ queryKey: ["my-submissions"] });
      qc.invalidateQueries({ queryKey: ["submissions-all"] });
      toast.success(status === "draft" ? "Đã lưu nháp" : "Đã gửi biên bản");
      nav({ to: "/forms/submissions/$id", params: { id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || !template) {
    return <div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }
  const { t } = template;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 lg:px-12">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/forms"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Link>
      </Button>

      <div className="mb-6">
        <div className="font-mono text-xs text-muted-foreground">{t.code}</div>
        <h1 className="text-2xl font-bold">{t.ten}</h1>
        {t.mo_ta && <p className="mt-1 text-sm text-muted-foreground">{t.mo_ta}</p>}
      </div>

      <Card className="mb-4">
        <CardHeader><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><Label>Tiêu đề biên bản</Label>
            <Input value={tieuDe} onChange={(e) => setTieuDe(e.target.value)} maxLength={200} placeholder={t.ten} /></div>
          <div><Label>Kỳ báo cáo (VD: Q1/2026)</Label>
            <Input value={kyBaoCao} onChange={(e) => setKyBaoCao(e.target.value)} maxLength={40} /></div>
          {profile?.don_vi && (
            <div className="text-xs text-muted-foreground md:col-span-2">
              Đơn vị: <Badge variant="outline">{profile.don_vi}</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {t.thiet_bi_mode !== "none" && (
        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">
            Tài sản liên quan ({t.thiet_bi_mode === "single" ? "chọn 1" : "chọn nhiều"})
          </CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Tìm mã hoặc tên tài sản…" value={tbSearch} onChange={(e) => setTbSearch(e.target.value)} />
            <div className="max-h-56 space-y-1 overflow-auto rounded border p-2">
              {(thietBiList ?? []).map((tb) => {
                const on = selectedTb.includes(tb.id);
                return (
                  <button type="button" key={tb.id}
                    onClick={() => {
                      if (t.thiet_bi_mode === "single") setSelectedTb([tb.id]);
                      else setSelectedTb(on ? selectedTb.filter((x) => x !== tb.id) : [...selectedTb, tb.id]);
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition ${on ? "bg-primary/10 text-primary" : "hover:bg-secondary"}`}>
                    <span><span className="font-mono text-xs">{tb.ma_thiet_bi}</span> — {tb.ten_thiet_bi}</span>
                    {on && <Badge variant="outline" className="text-meta">Đã chọn</Badge>}
                  </button>
                );
              })}
              {(thietBiList ?? []).length === 0 && <p className="p-2 text-xs text-muted-foreground">Không có tài sản.</p>}
            </div>
            <p className="text-xs text-muted-foreground">Đã chọn: {selectedTb.length}</p>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">Hệ thống liên kết</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Biên bản sẽ được lưu vào Sổ lý lịch của hệ thống này để phục vụ đánh giá về sau.
            {derivedHt && !heThongTouched && (
              <span className="ml-1 text-emerald-700">Tự động suy ra từ tài sản đã chọn.</span>
            )}
          </p>
          {heThongInfo ? (
            <div className="flex items-center justify-between rounded border bg-emerald-50/50 px-3 py-2 text-sm">
              <div>
                <span className="font-mono text-xs text-muted-foreground">{heThongInfo.ma}</span>
                <span className="ml-2 font-medium">{heThongInfo.ten}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setHeThongId(null); setHeThongTouched(true); }}>
                Đổi
              </Button>
            </div>
          ) : (
            <>
              <Input placeholder="Tìm mã hoặc tên hệ thống…" value={heThongSearch} onChange={(e) => setHeThongSearch(e.target.value)} />
              <div className="max-h-56 space-y-1 overflow-auto rounded border p-2">
                {(heThongList ?? []).map((h) => (
                  <button type="button" key={h.id}
                    onClick={() => { setHeThongId(h.id); setHeThongTouched(true); }}
                    className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition hover:bg-secondary">
                    <span><span className="font-mono text-xs">{h.ma}</span> — {h.ten}</span>
                  </button>
                ))}
                {(heThongList ?? []).length === 0 && <p className="p-2 text-xs text-muted-foreground">Không có hệ thống phù hợp.</p>}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Nội dung biên bản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {rows.length === 0 && !isChecklist && (
            <p className="text-sm text-muted-foreground">Mẫu này chưa có trường dữ liệu.</p>
          )}
          {rows.map((rowFields, ri) => (
            <div key={ri} className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {rowFields.map((f) => {
                const forceFull = ["heading", "divider", "note", "table"].includes(f.kind);
                const span = forceFull ? 3 : Math.max(1, Math.min(3, f.col_span || 3));
                return (
                  <div key={f.key} className={span === 3 ? "md:col-span-3" : span === 2 ? "md:col-span-2" : "md:col-span-1"}>
                    <FormFieldRuntime
                      field={f}
                      value={values[f.key]}
                      values={values}
                      onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                      templateCode={t.code}
                      draftId={draftIdRef.current}
                      attachments={attachments[f.key] ?? []}
                      onAttachmentsChange={(a) => setAttachments((prev) => ({ ...prev, [f.key]: a }))}
                    />
                  </div>
                );
              })}
            </div>
          ))}
          {isChecklist && (
            <ChecklistRenderer
              sections={checklistSections}
              values={checklist}
              onChange={setChecklist}
              templateCode={t.code}
              draftId={draftIdRef.current}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
            />
          )}
        </CardContent>
      </Card>

      <div className="sticky bottom-4 mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={() => saveM.mutate("draft")} disabled={saveM.isPending}>
          <Save className="mr-2 h-4 w-4" />Lưu nháp
        </Button>
        <Button onClick={() => saveM.mutate("submitted")} disabled={saveM.isPending}>
          {saveM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
          Gửi biên bản
        </Button>
      </div>
    </div>
  );
}
