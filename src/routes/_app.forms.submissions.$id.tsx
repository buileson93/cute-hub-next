import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Download, Check, RotateCcw, Send, FileSignature, ShieldCheck, FileText, Radio } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { useServerFn } from "@tanstack/react-start";
import { exportSubmissionToWord } from "@/lib/form-word-export.functions";
import { exportSubmissionPdf } from "@/lib/form-pdf.functions";
import { signSubmission, requestSignOtp, signSubmissionWithOtp } from "@/lib/form-signing.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound } from "lucide-react";
import { compileField, parseCompiledSchema, resolveSubmissionFields } from "@/lib/mirats/form-schema";
import { ChecklistRenderer } from "@/components/mirats/ChecklistRenderer";
import { fetchSubmissionItemResults, sectionsFromResults, inputsFromResults } from "@/lib/mirats/checklist-repo";
import { shortHash } from "@/lib/mirats/sig-canonical";
import { SignatureSlotsView, SingleSignatureView } from "@/components/mirats/SignatureSlotsView";
import type { SignatureSlot } from "@/components/mirats/MultiSignatureFlow";

export const Route = createFileRoute("/_app/forms/submissions/$id")({
  head: () => ({ meta: [{ title: "Chi tiết biên bản — MIRATS" }] }),
  component: SubmissionDetail,
});

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: "Nháp", cls: "bg-slate-100 text-slate-700" },
  submitted: { label: "Chờ duyệt", cls: "bg-amber-100 text-amber-700" },
  approved: { label: "Đã duyệt", cls: "bg-emerald-100 text-emerald-700" },
  returned: { label: "Trả lại", cls: "bg-rose-100 text-rose-700" },
};

function SubmissionDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { session, hasRole, loading } = useSession();
  const canManage = hasRole("admin") || hasRole("phong_kt");
  const exportFn = useServerFn(exportSubmissionToWord);
  const exportPdfFn = useServerFn(exportSubmissionPdf);
  const signFn = useServerFn(signSubmission);
  const requestOtpFn = useServerFn(requestSignOtp);
  const signOtpFn = useServerFn(signSubmissionWithOtp);
  const [note, setNote] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState<string | null>(null);
  const [otpExpiresAt, setOtpExpiresAt] = useState<string | null>(null);
  const [otpRole, setOtpRole] = useState<"nguoi_thuc_hien" | "phu_trach" | "admin">("phu_trach");

  const { data: sigs } = useQuery({
    queryKey: ["submission-sigs", id],
    enabled: !!session,
    queryFn: async () => {
      const { data } = await supabase
        .from("form_submission_signature")
        .select("id, signer_name, signer_role, signed_at, content_hash, alg")
        .eq("submission_id", id)
        .order("signed_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["submission", id],
    enabled: !!session,
    queryFn: async () => {
      const { data: s, error } = await supabase.from("form_submission")
        .select("*, template:form_template(id,ten,thiet_bi_mode,require_signature), don_vi:dm_don_vi(ma,ten)")
        .eq("id", id).maybeSingle();
      if (error) throw error;
      if (!s) throw new Error("Không tìm thấy");
      const { data: currentFields } = await supabase.from("form_field").select("*").eq("template_id", s.template_id).order("position");
      let versionSchema = null;
      if (s.template_version_id) {
        const { data: ver } = await supabase.from("form_template_version").select("compiled_schema").eq("id", s.template_version_id).maybeSingle();
        versionSchema = parseCompiledSchema(ver?.compiled_schema);
      }
      const { fields } = resolveSubmissionFields({
        snapshot: parseCompiledSchema(s.template_snapshot),
        versionSchema,
        currentFields: (currentFields ?? []).map((f, i) => compileField(f, i)),
      });
      const { data: links } = await supabase.from("form_submission_thiet_bi")
        .select("thiet_bi:thiet_bi(id,ma_thiet_bi,ten_thiet_bi)")
        .eq("submission_id", id);
      let singleTb = null;
      if (s.thiet_bi_id) {
        const { data: tb } = await supabase.from("thiet_bi").select("id,ma_thiet_bi,ten_thiet_bi").eq("id", s.thiet_bi_id).maybeSingle();
        singleTb = tb;
      }
      let heThong: { id: string; ma: string | null; ten: string | null } | null = null;
      if (s.he_thong_id) {
        const { data: ht } = await supabase.from("dm_he_thong").select("id,ma,ten").eq("id", s.he_thong_id).maybeSingle();
        heThong = ht;
      }
      // Kết quả bảng kiểm (nếu mẫu dạng checklist) — dựng lại từ snapshot đã lưu.
      const itemResults = await fetchSubmissionItemResults(id);
      const chkSections = sectionsFromResults(itemResults);
      const chkValues = inputsFromResults(itemResults);
      return {
        s, fields,
        chkSections, chkValues,
        heThong,
        devices: [...(singleTb ? [singleTb] : []), ...(links ?? []).map((l) => l.thiet_bi).filter(Boolean)],
      };
    },
  });

  const statusM = useMutation({
    mutationFn: async ({ status, review_note }: { status: "approved" | "returned" | "submitted"; review_note?: string }) => {
      const patch: {
        status: "approved" | "returned" | "submitted";
        reviewed_by?: string; reviewed_at?: string;
        review_note?: string; submitted_at?: string;
      } = { status };
      if (status === "approved" || status === "returned") {
        patch.reviewed_by = session?.user.id;
        patch.reviewed_at = new Date().toISOString();
        if (review_note) patch.review_note = review_note;
      }
      if (status === "submitted") patch.submitted_at = new Date().toISOString();
      const { error } = await supabase.from("form_submission").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Đã cập nhật"); qc.invalidateQueries({ queryKey: ["submission", id] }); },
    onError: (e: Error) => toast.error(e.message),
  });


  const signM = useMutation({
    mutationFn: async (signer_role: "nguoi_thuc_hien" | "phu_trach" | "admin") =>
      signFn({ data: { submission_id: id, signer_role } }),
    onSuccess: () => {
      toast.success("Đã ký số Ed25519");
      qc.invalidateQueries({ queryKey: ["submission", id] });
      qc.invalidateQueries({ queryKey: ["submission-sigs", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestOtpM = useMutation({
    mutationFn: async () => requestOtpFn({ data: { submission_id: id, channel: "telegram", signer_role: otpRole } }),
    onSuccess: (r) => {
      setOtpSentTo(r.sent_to);
      setOtpExpiresAt(r.expires_at);
      toast.success(`Đã gửi OTP tới ${r.sent_to}. Có hạn 5 phút.`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOtpM = useMutation({
    mutationFn: async () => signOtpFn({ data: { submission_id: id, code: otpCode.trim() } }),
    onSuccess: () => {
      toast.success("Đã ký số bằng OTP");
      setOtpOpen(false);
      setOtpCode("");
      setOtpSentTo(null);
      setOtpExpiresAt(null);
      qc.invalidateQueries({ queryKey: ["submission", id] });
      qc.invalidateQueries({ queryKey: ["submission-sigs", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Realtime: khi biên bản có cập nhật (ký thêm slot, đổi status) hoặc có chữ ký
  // số mới, mọi người tham gia đều thấy trạng thái mới mà không cần reload.
  const [rtBeat, setRtBeat] = useState<number>(0);
  useEffect(() => {
    if (!session) return;
    const ch = supabase
      .channel(`submission-${id}`)
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "form_submission", filter: `id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["submission", id] });
          setRtBeat((n) => n + 1);
        })
      .on("postgres_changes",
        { event: "*", schema: "public", table: "form_submission_signature", filter: `submission_id=eq.${id}` },
        () => {
          qc.invalidateQueries({ queryKey: ["submission-sigs", id] });
          setRtBeat((n) => n + 1);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, session, qc]);

  const downloadBase64 = (base64: string, fileName: string, mime: string) => {
    const blob = new Blob([Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  };

  const exportM = useMutation({
    mutationFn: async () => exportFn({ data: { submission_id: id } }),
    onSuccess: (r) => {
      downloadBase64(r.base64, r.fileName, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      toast.success("Đã xuất Word");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportPdfM = useMutation({
    mutationFn: async (sign: boolean) =>
      exportPdfFn({ data: { submission_id: id, sign_before_export: sign, signer_role: "phu_trach" } }),
    onSuccess: (r) => {
      downloadBase64(r.base64, r.fileName, "application/pdf");
      toast.success(r.signatures > 0 ? `Đã xuất PDF (${r.signatures} chữ ký)` : "Đã xuất PDF");
      qc.invalidateQueries({ queryKey: ["submission", id] });
      qc.invalidateQueries({ queryKey: ["submission-sigs", id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loading || isLoading || !data) {
    return <><div className="flex h-96 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div></>;
  }
  const { s, fields, devices, chkSections, chkValues, heThong } = data;
  const isChecklist = chkSections.length > 0;
  const st = STATUS[s.status] ?? { label: s.status, cls: "" };
  const dataObj = (s.data ?? {}) as Record<string, unknown>;
  const isOwner = s.created_by === session?.user.id;
  const canSign = hasRole("admin") || hasRole("phong_kt") || hasRole("phu_trach_dv") || hasRole("to_truong");

  const fmt = (v: unknown) => {
    if (v == null || v === "") return <span className="text-muted-foreground">—</span>;
    if (Array.isArray(v)) return v.join(", ");
    if (typeof v === "boolean") return v ? "Có" : "Không";
    return String(v);
  };

  return (
    <>
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12">
        <Button asChild variant="ghost" size="sm" className="mb-4">
          <Link to="/forms"><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Link>
        </Button>

        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-muted-foreground">{s.template_code} · Kỳ {s.ky_bao_cao ?? "—"}</div>
            <h1 className="text-2xl font-bold">{s.tieu_de ?? s.template?.ten}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Badge className={st.cls} variant="outline">{st.label}</Badge>
              {s.don_vi && <Badge variant="outline">{s.don_vi.ten}</Badge>}
              {s.signed_at && <Badge className="bg-emerald-100 text-emerald-700" variant="outline">Đã ký {new Date(s.signed_at).toLocaleDateString("vi-VN")}</Badge>}
              <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground" title={`Realtime · ${rtBeat} cập nhật`}>
                <Radio className="h-3 w-3 text-emerald-500" />Live
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => exportM.mutate()} disabled={exportM.isPending}>
              {exportM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Xuất Word
            </Button>
            <Button variant="outline" onClick={() => exportPdfM.mutate(false)} disabled={exportPdfM.isPending}>
              {exportPdfM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Xuất PDF
            </Button>
            {canSign && (
              <Button onClick={() => exportPdfM.mutate(true)} disabled={exportPdfM.isPending}>
                {exportPdfM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                Ký &amp; Xuất PDF
              </Button>
            )}
          </div>
        </div>

        {devices.length > 0 && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Tài sản liên quan ({devices.length})</CardTitle></CardHeader>
            <CardContent>
              <ul className="space-y-1 text-sm">
                {devices.map((d) => d && (
                  <li key={d.id}><span className="font-mono text-xs">{d.ma_thiet_bi}</span> — {d.ten_thiet_bi}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {heThong && (
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-base">Hệ thống liên kết</CardTitle></CardHeader>
            <CardContent className="text-sm">
              <Link
                to="/he-thong/$id"
                params={{ id: heThong.id }}
                className="font-medium text-primary hover:underline"
              >
                <span className="font-mono text-xs text-muted-foreground">{heThong.ma}</span>
                <span className="ml-2">{heThong.ten}</span>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                Kết quả biên bản này được ghi vào Sổ lý lịch của hệ thống để phục vụ đánh giá về sau.
              </p>
            </CardContent>
          </Card>
        )}

        <Card className="mb-4">
          <CardHeader><CardTitle className="text-base">Nội dung</CardTitle></CardHeader>
          <CardContent>
            {isChecklist ? (
              <ChecklistRenderer sections={chkSections} values={chkValues} readOnly />
            ) : (
              <dl className="divide-y">
                {fields.map((f) => {
                  const v = dataObj[f.key];
                  const isSig = f.kind === "signature";
                  const isMultiSig = isSig && Array.isArray(v);
                  return (
                    <div key={f.key} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3">
                      <dt className="text-sm font-medium text-muted-foreground">{f.label}</dt>
                      <dd className="text-sm sm:col-span-2">
                        {isMultiSig ? (
                          <SignatureSlotsView slots={v as SignatureSlot[]} compact />
                        ) : isSig ? (
                          <SingleSignatureView value={v} signedAt={s.signed_at as string | null} />
                        ) : (
                          fmt(v)
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            )}
          </CardContent>
        </Card>



        {s.review_note && (
          <Card className="mb-4 border-amber-300 bg-amber-50/50">
            <CardHeader><CardTitle className="text-base">Ghi chú duyệt</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm">{s.review_note}</CardContent>
          </Card>
        )}

        {/* Actions */}
        <Card>
          <CardHeader><CardTitle className="text-base">Hành động</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {isOwner && (s.status === "draft" || s.status === "returned") && (
              <Button onClick={() => statusM.mutate({ status: "submitted" })} disabled={statusM.isPending}>
                <Send className="mr-2 h-4 w-4" />Gửi duyệt
              </Button>
            )}
            {canManage && s.status === "submitted" && (
              <>
                <Textarea placeholder="Ghi chú duyệt / trả lại (tuỳ chọn)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} />
                <div className="flex gap-2">
                  <Button onClick={() => statusM.mutate({ status: "approved", review_note: note })} disabled={statusM.isPending}>
                    <Check className="mr-2 h-4 w-4" />Duyệt
                  </Button>
                  <Button variant="outline" onClick={() => statusM.mutate({ status: "returned", review_note: note })} disabled={statusM.isPending}>
                    <RotateCcw className="mr-2 h-4 w-4" />Trả lại
                  </Button>
                </div>
              </>
            )}
            {canSign && (
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => signM.mutate("phu_trach")} disabled={signM.isPending}>
                  {signM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
                  Ký số (không xuất PDF)
                </Button>
                <Button variant="outline" onClick={() => { setOtpOpen(true); setOtpSentTo(null); setOtpCode(""); }}>
                  <KeyRound className="mr-2 h-4 w-4" />
                  Ký bằng OTP (Telegram)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {sigs && sigs.length > 0 && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Chữ ký số ({sigs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sigs.map((sg) => (
                <div key={sg.id} className="flex items-center justify-between rounded border p-2 text-sm">
                  <div>
                    <div className="font-medium">{sg.signer_name || "(không rõ)"} <Badge variant="outline" className="ml-1 text-[10px]">{sg.signer_role}</Badge></div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(sg.signed_at).toLocaleString("vi-VN")} · {sg.alg} · hash {shortHash(sg.content_hash)}
                    </div>
                  </div>
                </div>
              ))}
              <a href={`/verify/${id}`} target="_blank" rel="noreferrer" className="text-xs text-primary underline">
                Trang xác thực công khai →
              </a>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={otpOpen} onOpenChange={setOtpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Ký số bằng OTP</DialogTitle>
            <DialogDescription>
              Nhận mã 6 chữ số qua Telegram cá nhân đã liên kết. Mã có hiệu lực 5 phút.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Vai trò ký</Label>
              <select
                className="mt-1 w-full rounded border px-2 py-1.5 text-sm"
                value={otpRole}
                onChange={(e) => setOtpRole(e.target.value as typeof otpRole)}
                disabled={!!otpSentTo}
              >
                <option value="phu_trach">Phụ trách</option>
                <option value="nguoi_thuc_hien">Người thực hiện</option>
                <option value="admin">Quản trị</option>
              </select>
            </div>
            {!otpSentTo ? (
              <Button className="w-full" onClick={() => requestOtpM.mutate()} disabled={requestOtpM.isPending}>
                {requestOtpM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Gửi mã OTP qua Telegram
              </Button>
            ) : (
              <>
                <div className="rounded bg-emerald-50 p-2 text-xs text-emerald-800">
                  Đã gửi tới: <b>{otpSentTo}</b>
                  {otpExpiresAt && <> · Hết hạn: {new Date(otpExpiresAt).toLocaleTimeString("vi-VN")}</>}
                </div>
                <div>
                  <Label className="text-xs">Nhập mã 6 chữ số</Label>
                  <Input
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    className="mt-1 text-center font-mono text-lg tracking-widest"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            {otpSentTo && (
              <Button variant="ghost" onClick={() => requestOtpM.mutate()} disabled={requestOtpM.isPending}>
                Gửi lại mã
              </Button>
            )}
            <Button
              onClick={() => signOtpM.mutate()}
              disabled={!otpSentTo || otpCode.length !== 6 || signOtpM.isPending}
            >
              {signOtpM.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSignature className="mr-2 h-4 w-4" />}
              Xác nhận ký
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
