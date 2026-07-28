// Dialog: Nhập báo cáo tuần (DOCX) → xem trước → tạo N sự cố + M hỏng-tồn dạng nháp.
//
// HITL 100%: user duyệt từng dòng, chọn hệ thống (fuzzy top-3), sửa dữ liệu
// trước khi bấm "Tạo". Không ghi tự động, không gọi AI.

import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Loader2, Sparkles, CheckCircle2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  parseWeeklyReportDocx,
  parseWeeklyReportText,
  fuzzyMatchHeThong,
  type WeeklyReportParsed,
  type WeeklyIncidentRow,
  type WeeklyHongHocRow,
  type HeThongCandidate,
} from "@/lib/mirats/weekly-report-parser";
import { classifyWeeklyReportFile, classifyTextForWeeklyReport, type DetectResult } from "@/lib/mirats/weekly-report-detector";

interface Props { trigger?: React.ReactNode; onImported?: () => void }

interface IncidentDraft extends WeeklyIncidentRow {
  key: string;
  selected: boolean;
  he_thong_id: string;
  candidates: HeThongCandidate[];
  hien_tuong: string;
}

interface HongHocDraft extends WeeklyHongHocRow {
  key: string;
  selected: boolean;
  he_thong_id: string;
  candidates: HeThongCandidate[];
}

function genMa(prefix: string, i: number): string {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const seq = String(i).padStart(3, "0");
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${prefix}-${yy}${mm}${dd}-${seq}${rand}`;
}

function ConfidenceBadge({ value }: { value: number }) {
  if (value >= 0.8) return <Badge variant="default" className="bg-emerald-600">Cao {(value * 100).toFixed(0)}%</Badge>;
  if (value >= 0.6) return <Badge variant="secondary">TB {(value * 100).toFixed(0)}%</Badge>;
  return <Badge variant="destructive">Thấp {(value * 100).toFixed(0)}%</Badge>;
}

export function WeeklyReportImportDialog({ trigger, onImported }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [parsed, setParsed] = useState<WeeklyReportParsed | null>(null);
  const [incidents, setIncidents] = useState<IncidentDraft[]>([]);
  const [hongs, setHongs] = useState<HongHocDraft[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [fileMeta, setFileMeta] = useState<{ name: string; size: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { profile } = useSession();
  const qc = useQueryClient();

  const systemsQ = useQuery({
    queryKey: ["dm_he_thong_min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("dm_he_thong").select("id, ten").order("ten");
      if (error) throw error;
      return (data ?? []) as { id: string; ten: string }[];
    },
    staleTime: 60_000,
  });

  const systems = systemsQ.data ?? [];

  async function runFile(file: File) {
    setBusy(true);
    setFileMeta({ name: file.name, size: file.size });
    try {
      // Bước 1: Nhận diện xem có phải "báo cáo tuần sự cố" không.
      const detect = await classifyWeeklyReportFile(file);
      if (detect.verdict === "reject") {
        toast.error(`Bỏ qua file "${file.name}": ${detect.reason}`);
        return;
      }
      if (detect.verdict === "suspect") {
        const ok = window.confirm(
          `File "${file.name}" không chắc là báo cáo tuần sự cố ` +
          `(score ${Math.round(detect.score * 100)}%): ${detect.reason}.\n\nVẫn tiếp tục phân tích?`
        );
        if (!ok) return;
      }
      const buf = await file.arrayBuffer();
      const p = await parseWeeklyReportDocx(buf);
      applyParsed(p);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Không đọc được DOCX: ${msg}. File .doc cũ cần Save As sang .docx trước.`);
    } finally { setBusy(false); }
  }

  function runText() {
    if (!pasteText.trim()) { toast.error("Chưa có nội dung dán"); return; }
    const detect = classifyTextForWeeklyReport(pasteText);
    if (detect.verdict === "reject") {
      toast.error(`Nội dung không phải báo cáo tuần: ${detect.reason}`);
      return;
    }
    if (detect.verdict === "suspect") {
      const ok = window.confirm(
        `Nội dung dán có vẻ không phải báo cáo tuần (score ${Math.round(detect.score * 100)}%). Vẫn phân tích?`
      );
      if (!ok) return;
    }
    setBusy(true);
    try {
      const p = parseWeeklyReportText(pasteText);
      applyParsed(p);
    } finally { setBusy(false); }
  }

  function applyParsed(p: WeeklyReportParsed) {
    setParsed(p);
    const inc: IncidentDraft[] = p.incidents.map((r, i) => {
      const cands = fuzzyMatchHeThong(r.he_thong_hint, r.thiet_bi, systems, 5);
      return {
        ...r,
        key: `inc-${i}`,
        selected: r.confidence >= 0.6,
        he_thong_id: cands[0]?.score >= 0.4 ? cands[0].id : "",
        candidates: cands,
        hien_tuong: r.tinh_trang.split(/\.\s|\n/)[0].slice(0, 140) || `Sự cố ${r.he_thong_hint}`.trim(),
      };
    });
    const hh: HongHocDraft[] = p.hong_hoc.map((r, i) => {
      const cands = fuzzyMatchHeThong("", r.thiet_bi, systems, 5);
      return { ...r, key: `hh-${i}`, selected: true, he_thong_id: cands[0]?.score >= 0.4 ? cands[0].id : "", candidates: cands };
    });
    setIncidents(inc);
    setHongs(hh);
    if (inc.length + hh.length === 0) toast.warning("Không phát hiện dòng dữ liệu nào — kiểm tra lại cấu trúc file");
    else toast.success(`Bóc được ${inc.length} sự cố, ${hh.length} hỏng-tồn`);
  }

  const createBatch = useMutation({
    mutationFn: async () => {
      const chosenInc = incidents.filter((r) => r.selected);
      const chosenHH = hongs.filter((r) => r.selected);
      let created = 0;
      let createdInc = 0;
      let createdHH = 0;
      const nguoiBc = profile?.ho_ten || profile?.email || "";

      const logImport = async (status: string, err?: string) => {
        await supabase.from("weekly_report_import").insert({
          don_vi: parsed?.header.don_vi ?? null,
          so_van_ban: parsed?.header.so_van_ban ?? null,
          ngay_ky: parsed?.header.ngay_ky ?? null,
          tuan_tu_ngay: parsed?.header.tuan_tu_ngay ?? null,
          tuan_den_ngay: parsed?.header.tuan_den_ngay ?? null,
          tieu_de: parsed?.header.tieu_de ?? null,
          file_name: fileMeta?.name ?? null,
          file_size: fileMeta?.size ?? null,
          n_incidents_detected: incidents.length,
          n_hong_hoc_detected: hongs.length,
          n_incidents_created: createdInc,
          n_hong_hoc_created: createdHH,
          status,
          error_message: err ?? null,
          created_by: profile?.id ?? null,
          created_by_name: nguoiBc || null,
        } as never);
      };

      // 1) Sự cố (draft)
      if (chosenInc.length) {
        const rows = chosenInc.map((r, i) => {
          const heThongTen = systems.find((s) => s.id === r.he_thong_id)?.ten ?? r.he_thong_hint;
          return {
            ma_su_co: genMa("BC", i + 1),
            thiet_bi: r.thiet_bi || heThongTen || "(chưa xác định)",
            he_thong: heThongTen || null,
            he_thong_id: r.he_thong_id || null,
            ngay_phat_hien: r.thoi_gian_bat_dau ? new Date(r.thoi_gian_bat_dau).toISOString() : new Date().toISOString(),
            nguoi_bao_cao: nguoiBc,
            muc_do: r.phan_loai === "A" ? "Nghiêm trọng" : r.phan_loai === "B" ? "Cao" : r.phan_loai === "C" ? "Trung bình" : "Thấp",
            anh_huong_dhb: r.anh_huong_dhb,
            hien_tuong: r.hien_tuong,
            trang_thai: "Mới",
            bao_cao_ban_dau: {
              nguon: "Import báo cáo tuần",
              don_vi_bao_cao: parsed?.header.don_vi ?? "",
              so_van_ban: parsed?.header.so_van_ban ?? "",
              tuan: `${parsed?.header.tuan_tu_ngay} - ${parsed?.header.tuan_den_ngay}`,
              vi_tri: r.vi_tri,
              sl_hong: r.sl_hong,
              tinh_trang_kt: r.tinh_trang,
              vat_tu_thay_the: r.vat_tu,
              ghi_chu: r.ghi_chu,
              thoi_diem_raw: r.thoi_diem_raw,
              thoi_gian_ket_thuc: r.thoi_gian_ket_thuc || null,
              phan_loai: r.phan_loai,
              he_thong_hint: r.he_thong_hint,
              confidence: r.confidence,
            },
          };
        });
        const { error } = await supabase.from("su_co").insert(rows as never);
        if (error) { await logImport("failed", `Lỗi tạo sự cố: ${error.message}`); throw new Error(`Lỗi tạo sự cố: ${error.message}`); }
        created += rows.length; createdInc = rows.length;
      }

      // 2) Hỏng-tồn (hong_hoc)
      if (chosenHH.length) {
        const rows = chosenHH.map((r, i) => ({
          ma_hong_hoc: genMa("HH", i + 1),
          thiet_bi_hong: r.thiet_bi,
          he_thong_id: r.he_thong_id || null,
          ngay_hong: r.ngay_hong_iso ? r.ngay_hong_iso.slice(0, 10) : new Date().toISOString().slice(0, 10),
          mo_ta_hong_hoc: r.tinh_trang,
          don_vi_thuc_hien: r.don_vi_sc || null,
          trang_thai: "Đang xử lý",
          nguoi_thuc_hien: nguoiBc ? [nguoiBc] : [],
        }));
        const { error } = await supabase.from("hong_hoc").insert(rows as never);
        if (error) { await logImport("failed", `Lỗi tạo hỏng hóc: ${error.message}`); throw new Error(`Lỗi tạo hỏng hóc: ${error.message}`); }
        created += rows.length; createdHH = rows.length;
      }

      await logImport("success");
      return created;
    },
    onSuccess: (n) => {
      toast.success(`Đã tạo ${n} bản ghi nháp — hãy bổ sung chi tiết trong danh sách`);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
      qc.invalidateQueries({ queryKey: ["weekly_report_import"] });
      setOpen(false);
      setParsed(null); setIncidents([]); setHongs([]); setPasteText(""); setFileMeta(null);
      onImported?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const nChosenInc = incidents.filter((r) => r.selected).length;
  const nChosenHH = hongs.filter((r) => r.selected).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" className="gap-2">
            <FileText className="h-4 w-4" /> Nhập báo cáo tuần
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Nhập báo cáo tuần
          </DialogTitle>
          <DialogDescription>
            Nhận file <code>.docx</code> hoặc dán nội dung bảng. Parser sẽ bóc tách 2 bảng
            (sự cố trong tuần + thiết bị đang sửa chữa). Bạn duyệt từng dòng và bấm tạo — không có gì được ghi tự động.
          </DialogDescription>
        </DialogHeader>

        {!parsed && (
          <Tabs defaultValue="file" className="flex-1">
            <TabsList>
              <TabsTrigger value="file">Tải file DOCX</TabsTrigger>
              <TabsTrigger value="paste">Dán nội dung</TabsTrigger>
            </TabsList>
            <TabsContent value="file" className="space-y-3 pt-4">
              <input ref={fileRef} type="file" accept=".docx" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void runFile(f); }} />
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">Chọn file báo cáo tuần định dạng <code>.docx</code></p>
                <Button onClick={() => fileRef.current?.click()} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Chọn file
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  File <code>.doc</code> cũ (Word 97-2003) không được hỗ trợ — hãy mở trong Word và <b>Save As → .docx</b>.
                </p>
              </div>
            </TabsContent>
            <TabsContent value="paste" className="space-y-3 pt-4">
              <Textarea rows={12} placeholder="Dán nội dung bảng từ Word (Ctrl+A → Ctrl+C trong Word rồi dán vào đây)"
                value={pasteText} onChange={(e) => setPasteText(e.target.value)} />
              <Button onClick={runText} disabled={busy || !pasteText.trim()}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Phân tích
              </Button>
            </TabsContent>
          </Tabs>
        )}

        {parsed && (
          <div className="flex-1 flex flex-col gap-3 overflow-hidden">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {parsed.header.don_vi || "(không rõ đơn vị)"} — {parsed.header.tieu_de}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground pt-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>Số VB: <b>{parsed.header.so_van_ban || "—"}</b></div>
                <div>Ngày ký: <b>{parsed.header.ngay_ky || "—"}</b></div>
                <div>Từ: <b>{parsed.header.tuan_tu_ngay || "—"}</b></div>
                <div>Đến: <b>{parsed.header.tuan_den_ngay || "—"}</b></div>
              </CardContent>
            </Card>

            <Tabs defaultValue="inc" className="flex-1 flex flex-col overflow-hidden">
              <TabsList>
                <TabsTrigger value="inc">Sự cố tuần ({incidents.length})</TabsTrigger>
                <TabsTrigger value="hh">Hỏng-tồn ({hongs.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="inc" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[45vh] pr-2">
                  <div className="space-y-2">
                    {incidents.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">Không có sự cố trong bảng 1.</p>}
                    {incidents.map((r, i) => (
                      <Card key={r.key} className={r.selected ? "border-primary/40" : "opacity-70"}>
                        <CardContent className="p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <Checkbox checked={r.selected} onCheckedChange={(v) => setIncidents((cur) => cur.map((x, j) => j === i ? { ...x, selected: !!v } : x))} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <b className="text-sm">{r.thiet_bi || <span className="text-destructive">(chưa có tên thiết bị)</span>}</b>
                                <Badge variant="outline">Nhóm {r.nhom || "?"}</Badge>
                                {r.he_thong_hint && <Badge variant="secondary">{r.he_thong_hint}</Badge>}
                                <ConfidenceBadge value={r.confidence} />
                                <Badge variant="outline">PL {r.phan_loai}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{r.tinh_trang || "(chưa có tình trạng)"}</p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
                                <div>
                                  <label className="text-[11px] text-muted-foreground">Hệ thống trong DB</label>
                                  <Select value={r.he_thong_id} onValueChange={(v) => setIncidents((cur) => cur.map((x, j) => j === i ? { ...x, he_thong_id: v } : x))}>
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="— chưa gán —" /></SelectTrigger>
                                    <SelectContent>
                                      {r.candidates.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>
                                          {c.ten} <span className="text-muted-foreground">({(c.score * 100).toFixed(0)}%)</span>
                                        </SelectItem>
                                      ))}
                                      {systems.filter((s) => !r.candidates.some((c) => c.id === s.id)).slice(0, 30).map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.ten}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="md:col-span-2">
                                  <label className="text-[11px] text-muted-foreground">Hiện tượng (tiêu đề)</label>
                                  <Input className="h-8 text-xs" value={r.hien_tuong}
                                    onChange={(e) => setIncidents((cur) => cur.map((x, j) => j === i ? { ...x, hien_tuong: e.target.value } : x))} />
                                </div>
                              </div>
                              <div className="text-[11px] text-muted-foreground mt-1 flex gap-3">
                                <span>⏱ {r.thoi_diem_raw || "—"} {r.thoi_gian_bat_dau && `→ ${r.thoi_gian_bat_dau}`}</span>
                                <span>📍 {r.vi_tri || "—"}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="hh" className="flex-1 overflow-hidden">
                <ScrollArea className="h-[45vh] pr-2">
                  <div className="space-y-2">
                    {hongs.length === 0 && <p className="text-sm text-muted-foreground p-4 text-center">Không có bảng 2.</p>}
                    {hongs.map((r, i) => (
                      <Card key={r.key} className={r.selected ? "border-primary/40" : "opacity-70"}>
                        <CardContent className="p-3 flex items-start gap-2">
                          <Checkbox checked={r.selected} onCheckedChange={(v) => setHongs((cur) => cur.map((x, j) => j === i ? { ...x, selected: !!v } : x))} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <b className="text-sm">{r.thiet_bi}</b>
                              <Badge variant="outline">{r.don_vi_ql || "?"}</Badge>
                              <Badge variant="secondary">{r.tinh_trang || "—"}</Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-1">
                              Ngày hỏng: {r.ngay_hong_raw || "—"} {r.ngay_hong_iso && `→ ${r.ngay_hong_iso.slice(0, 10)}`} · SC: {r.don_vi_sc || "—"} · Ghi chú: {r.ghi_chu || "—"}
                            </div>
                            <div className="mt-2">
                              <label className="text-[11px] text-muted-foreground">Hệ thống trong DB</label>
                              <Select value={r.he_thong_id} onValueChange={(v) => setHongs((cur) => cur.map((x, j) => j === i ? { ...x, he_thong_id: v } : x))}>
                                <SelectTrigger className="h-8 text-xs w-full md:w-96"><SelectValue placeholder="— chưa gán —" /></SelectTrigger>
                                <SelectContent>
                                  {r.candidates.map((c) => (
                                    <SelectItem key={c.id} value={c.id}>{c.ten} ({(c.score * 100).toFixed(0)}%)</SelectItem>
                                  ))}
                                  {systems.filter((s) => !r.candidates.some((c) => c.id === s.id)).slice(0, 30).map((s) => (
                                    <SelectItem key={s.id} value={s.id}>{s.ten}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between gap-2 pt-2 border-t">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Sẽ tạo <b>{nChosenInc}</b> sự cố + <b>{nChosenHH}</b> hỏng-tồn dưới dạng bản nháp (trạng thái "Mới"/"Đang xử lý").
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => { setParsed(null); setIncidents([]); setHongs([]); }}>Nhập lại</Button>
                <Button disabled={createBatch.isPending || (nChosenInc + nChosenHH === 0)} onClick={() => createBatch.mutate()}>
                  {createBatch.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Tạo {nChosenInc + nChosenHH} bản ghi
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
