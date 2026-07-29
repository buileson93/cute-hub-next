import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, Trash2, FileText, Loader2, Save, FileDown,
  Wand2, Bot, Sparkles, CheckCircle2, Layers, MapPin, Lock,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/backend/client";
import { useSession } from "@/hooks/use-session";
import { useDbTaxonomy, type DbDevice } from "@/lib/mirats/db-taxonomy";
import { normalize } from "@/lib/mirats/global-search";
import { exportBaoCaoBanDauToWord } from "@/lib/incident-report-word.functions";
import { Combobox, type ComboOption } from "@/components/mirats/Combobox";
import { parseIncidentText, type ParsedIncident } from "@/lib/ai/incident-parse.functions";
import { parseIncidentByRules } from "@/lib/ai/incident-parse-rules";
import { detectSuCoAnomalies, anomalyFieldSet, type Anomaly } from "@/lib/mirats/su-co-anomalies";
import { AlertTriangle, ClipboardPaste } from "lucide-react";
import { popVoiceDraft } from "@/lib/mirats/voice-recognition";
import { buildSuCoPayload } from "@/lib/mirats/ghi-payload";
import { ghiSuCoFull } from "@/lib/mirats/ghi-nghiep-vu-actions";
import { VisionImageHint } from "@/components/mirats/VisionImageHint";
import { PreviewKhaiDialog } from "@/components/mirats/PreviewKhaiDialog";
import { CollapsibleSection } from "@/components/mirats/CollapsibleSection";
import type { KhaiNghiepVuInput } from "@/lib/mirats/ghi-nghiep-vu";
import { usePrefillKipTruc, usePrefillBienPhap } from "@/hooks/use-ambient-prefill";
import { AutoFilledBadge, useAmbientApply } from "@/components/mirats/AutoFilledBadge";

const PHAN_LOAI = ["A", "B", "C", "D", "E"];
const MUC_BY_PL: Record<string, string> = { A: "Nghiêm trọng", B: "Cao", C: "Trung bình", D: "Thấp", E: "Thấp" };
const AH_OPTIONS = ["Không ảnh hưởng", "Ảnh hưởng một phần", "Có gián đoạn ĐHB"];

const DEFAULT_RECIPIENTS = [
  "Phòng An toàn - Chất lượng và An ninh.",
  "Ban Giám đốc Công ty.",
  "Phòng Kỹ thuật.",
];

function fmtDateTime(v: string): string {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())} ngày ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

interface KipRow { ho_ten: string; chuc_vu: string; nang_dinh: string }

interface ThanhPhanRow {
  id: string;
  ma: string;
  ten: string;
  vi_tri_ten: string | null;
  he_thong_id: string;
}

interface MountedAsset {
  thanh_phan_id: string;
  device: DbDevice;
}

export interface SuCoMoiFormProps {
  defaultHeThongId?: string;
  defaultThietBi?: string;
  defaultFrom?: string;
  defaultVoice?: string;
  embedded?: boolean;
  onDone?: () => void;
}

export function SuCoMoiForm({ defaultHeThongId, defaultThietBi, defaultFrom, defaultVoice, embedded, onDone }: SuCoMoiFormProps) {
  const { profile } = useSession();
  const qc = useQueryClient();
  const { data: taxo } = useDbTaxonomy();
  const exportFn = useServerFn(exportBaoCaoBanDauToWord);
  const [lastNhom, setLastNhom] = useState<string | null>(null);

  const [hienTuong, setHienTuong] = useState("");
  const [kinhGui, setKinhGui] = useState("Phòng An toàn - Chất lượng và An ninh.");
  const heThongParam = defaultHeThongId;
  const thietBiParam = defaultThietBi;
  const fromParam = defaultFrom;
  const voiceParam = defaultVoice;
  const [heThongDichVu, setHeThongDichVu] = useState("");
  const [heThongId, setHeThongId] = useState(heThongParam ?? "");

  useEffect(() => {
    if (!heThongParam || !taxo) return;
    const ht = (taxo.htList ?? []).find((h) => h.id === heThongParam);
    if (ht) { setHeThongId(ht.id); setHeThongDichVu(ht.ten); }
  }, [heThongParam, taxo]);

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
  useEffect(() => {
    supabase
      .from("v_van_de")
      .select("id, ma_van_de, tieu_de, trang_thai")
      .neq("trang_thai", "dong")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        const opts: ComboOption[] = [];
        for (const v of data ?? []) {
          if (!v.id) continue;
          opts.push({ value: v.id, label: v.tieu_de ?? "(không tiêu đề)", hint: v.ma_van_de ?? undefined });
        }
        setVanDeOptions(opts);
      });
  }, []);
  const [kip, setKip] = useState<KipRow[]>([{ ho_ten: "", chuc_vu: "", nang_dinh: "" }]);

  // ── Ambient prefill (GĐ2-05) ────────────────────────────────────────────────
  const userDisplay = profile?.ho_ten || profile?.email || "";
  const { data: kipSuggested } = usePrefillKipTruc(userDisplay);
  const kipAmbient = useAmbientApply<KipRow[]>({
    suggested: kipSuggested ?? null,
    isEmpty: (v) => !v || v.length === 0 || v.every((r) => !r.ho_ten.trim()),
    currentValue: kip,
    apply: (v) => setKip(v.map((r) => ({ ho_ten: r.ho_ten, chuc_vu: r.chuc_vu, nang_dinh: r.nang_dinh }))),
    clear: () => setKip([{ ho_ten: "", chuc_vu: "", nang_dinh: "" }]),
  });

  const [aiText, setAiText] = useState("");
  const [aiFilled, setAiFilled] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const parseFn = useServerFn(parseIncidentText);
  /**
   * Dán báo cáo → chạy deterministic parser trước; chỉ escalate AI khi confidence < 0.7.
   * Ưu điểm: nhanh, không tốn quota, và người dùng thấy ngay các trường parser suy được.
   */
  async function handlePasteReport() {
    let text = "";
    try { text = (await navigator.clipboard.readText()).trim(); } catch { /* fallback */ }
    if (!text) {
      const ta = prompt("Dán nội dung báo cáo sự cố (7 mục) vào đây:");
      if (!ta) return;
      text = ta.trim();
    }
    if (text.length < 20) { toast.error("Nội dung quá ngắn — không đủ để bóc tách."); return; }
    const local = parseIncidentByRules(text);
    if (local.confidence >= 0.7) {
      applyParsed(local.parsed as unknown as ParsedIncident);
      toast.success(`Đã bóc tách bằng parser cục bộ · độ tin cậy ${(local.confidence * 100).toFixed(0)}%`);
      return;
    }
    // Điền tạm phần deterministic rồi đề nghị chạy AI để bổ sung.
    applyParsed(local.parsed as unknown as ParsedIncident);
    setAiText(text);
    setAiOpen(true);
    toast.info(
      `Parser cục bộ chỉ đạt ${(local.confidence * 100).toFixed(0)}% — hãy chạy AI để bổ sung các trường còn thiếu.`,
    );
  }

  // ============================================================
  // MỚI: Thành phần hệ thống bị ảnh hưởng — nguồn chính (mục 2)
  // ============================================================
  const [tpList, setTpList] = useState<ThanhPhanRow[]>([]);
  const [selectedTpIds, setSelectedTpIds] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState<MountedAsset[]>([]);
  const [tpLoading, setTpLoading] = useState(false);

  // Ambient prefill for biện pháp — depends on selected components.
  const selectedTpIdList = useMemo(() => Array.from(selectedTpIds), [selectedTpIds]);
  const { data: bienPhapSuggested } = usePrefillBienPhap(selectedTpIdList);
  const bienPhapAmbient = useAmbientApply<string>({
    suggested: bienPhapSuggested ?? null,
    isEmpty: (v) => !v || !v.trim(),
    currentValue: bienPhap,
    apply: (v) => setBienPhap(v),
    clear: () => setBienPhap(""),
  });

  // Nạp danh sách thành phần khi đổi hệ thống.
  useEffect(() => {
    if (!heThongId) { setTpList([]); setSelectedTpIds(new Set()); setMounted([]); return; }
    let cancelled = false;
    setTpLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("he_thong_thanh_phan")
        .select("id, ma_thanh_phan, ten, vi_tri_id, he_thong_id, dm_vi_tri:vi_tri_id(ten)")
        .eq("he_thong_id", heThongId)
        .is("deleted_at", null)
        .eq("trang_thai", "hoat_dong")
        .order("thu_tu", { ascending: true, nullsFirst: false })
        .order("ten", { ascending: true });
      if (cancelled) return;
      if (error) {
        toast.error("Không tải được thành phần: " + error.message);
        setTpList([]);
      } else {
        setTpList(
          (data ?? []).map((r: Record<string, unknown>) => ({
            id: r.id as string,
            ma: (r.ma_thanh_phan as string) ?? "",
            ten: (r.ten as string) ?? "",
            he_thong_id: (r.he_thong_id as string) ?? "",
            vi_tri_ten:
              (r.dm_vi_tri as { ten?: string } | null)?.ten ?? null,
          })),
        );
      }
      setTpLoading(false);
    })();
    return () => { cancelled = true; };
  }, [heThongId]);

  // Nạp tài sản đang lắp cho từng thành phần được chọn (gan_chuc_nang.den_ngay is null).
  useEffect(() => {
    if (selectedTpIds.size === 0) { setMounted([]); return; }
    const ids = Array.from(selectedTpIds);
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("gan_chuc_nang")
        .select("thanh_phan_id, thiet_bi_id")
        .in("thanh_phan_id", ids)
        .is("den_ngay", null);
      if (cancelled || error || !data) return;
      const devById = new Map<string, DbDevice>((taxo?.devices ?? []).map((d) => [d.id, d]));
      const rows: MountedAsset[] = [];
      for (const r of data) {
        const dev = devById.get(r.thiet_bi_id as string);
        if (dev) rows.push({ thanh_phan_id: r.thanh_phan_id as string, device: dev });
      }
      setMounted(rows);
    })();
    return () => { cancelled = true; };
  }, [selectedTpIds, taxo]);

  // Danh sách tài sản duy nhất (dùng khi save — mỗi thành phần có thể có 0-n tài sản).
  const selected: DbDevice[] = useMemo(() => {
    const map = new Map<string, DbDevice>();
    for (const m of mounted) map.set(m.device.id, m.device);
    return Array.from(map.values());
  }, [mounted]);

  // Chọn hệ thống.
  function onPickHeThong(v: string) {
    const ht = (taxo?.htList ?? []).find((h) => h.id === v);
    if (ht) { setHeThongId(ht.id); setHeThongDichVu(ht.ten); }
    else { setHeThongId(""); setHeThongDichVu(v); }
    setSelectedTpIds(new Set());
    setMounted([]);
  }

  // Auto-điền hệ thống + thành phần khi vào từ QR tài sản.
  useEffect(() => {
    if (!thietBiParam || !taxo?.devices) return;
    const d = taxo.devices.find((x) => x.ma_thiet_bi === thietBiParam);
    if (!d) return;
    if (d._htId && !heThongId) {
      setHeThongId(d._htId);
      setHeThongDichVu(d._htTen ?? "");
    }
    if (fromParam === "qr") { /* placeholder */ }
  }, [thietBiParam, taxo, fromParam, heThongId]);

  // Địa điểm tự động: từ các thành phần được chọn (vi_tri) — fallback đơn vị của hệ thống.
  const diaDiemAuto = useMemo(() => {
    const vi = new Set<string>();
    for (const tp of tpList) if (selectedTpIds.has(tp.id) && tp.vi_tri_ten) vi.add(tp.vi_tri_ten);
    if (vi.size) return Array.from(vi).join(", ");
    const ht = (taxo?.htList ?? []).find((h) => h.id === heThongId);
    if (ht) {
      const dv = (taxo?.donViList ?? []).find((x) => x.id === ht.donViId);
      return dv?.ten ?? "";
    }
    return "";
  }, [tpList, selectedTpIds, heThongId, taxo]);

  const kinhGuiOptions: ComboOption[] = useMemo(() => {
    const opts: ComboOption[] = DEFAULT_RECIPIENTS.map((r) => ({ value: r, label: r }));
    for (const dv of taxo?.donViList ?? []) opts.push({ value: dv.ten, label: dv.ten, hint: dv.ma });
    return opts;
  }, [taxo]);

  const heThongOptions: ComboOption[] = useMemo(
    () => (taxo?.htList ?? []).map((h) => ({ value: h.id, label: h.ten, hint: h.ma })),
    [taxo],
  );

  function addKip() { setKip((k) => [...k, { ho_ten: "", chuc_vu: "", nang_dinh: "" }]); }
  function removeKip(i: number) { setKip((k) => k.filter((_, idx) => idx !== i)); }
  function updateKip(i: number, field: keyof KipRow, v: string) {
    kipAmbient.onUserChange();
    setKip((k) => k.map((row, idx) => (idx === i ? { ...row, [field]: v } : row)));
  }

  function toggleTp(id: string, on: boolean) {
    setSelectedTpIds((cur) => {
      const n = new Set(cur);
      if (on) n.add(id); else n.delete(id);
      return n;
    });
  }

  function applyParsed(r: ParsedIncident) {
    if (r.hien_tuong) setHienTuong(r.hien_tuong);
    if (r.tom_tat) setTomTat(r.tom_tat);
    if (r.thoi_gian_bat_dau) setThoiGianBatDau(r.thoi_gian_bat_dau);
    if (r.anh_huong_dhb) setAnhHuongDhb(r.anh_huong_dhb);
    if (r.nguyen_nhan) setNguyenNhan(r.nguyen_nhan);
    if (r.bien_phap_xu_ly) setBienPhap(r.bien_phap_xu_ly);
    if (r.tinh_hinh_hien_tai) setTinhHinh(r.tinh_hinh_hien_tai);
    if (r.ket_qua_khac_phuc) setKetQua(r.ket_qua_khac_phuc);
    if (r.phan_loai) setPhanLoai(r.phan_loai);

    const gq = normalize(r.he_thong_goi_y);
    if (gq) {
      const ht =
        (taxo?.htList ?? []).find((h) => normalize(h.ten) === gq) ??
        (taxo?.htList ?? []).find(
          (h) => normalize(h.ten).includes(gq) || gq.includes(normalize(h.ten)),
        );
      if (ht) { setHeThongId(ht.id); setHeThongDichVu(ht.ten); }
      else { setHeThongId(""); setHeThongDichVu(r.he_thong_goi_y); }
    }

    setAiFilled(true);
    setAiNote("AI đã điền các trường suy được. Vui lòng chọn thành phần hệ thống bị ảnh hưởng và kiểm tra lại trước khi lưu.");
  }

  const aiParse = useMutation({
    mutationFn: async () => parseFn({ data: { text: aiText } }),
    onSuccess: (r) => {
      applyParsed(r as ParsedIncident);
      setAiOpen(false);
      toast.success("AI đã bóc tách xong — hãy kiểm tra lại trước khi lưu");
    },
    onError: (e: Error) => { const t = rpcErrorToast(e); toast.error(t.title, { description: t.description, duration: t.description ? 15000 : 5000 }); },
  });

  // GĐ3-03 — Voice handoff: khi tới từ /q/:ma với voice=1, nạp transcript và tự bóc tách.
  const voiceLoadedRef = useRef(false);
  useEffect(() => {
    if (voiceParam !== "1" || voiceLoadedRef.current) return;
    const draft = popVoiceDraft();
    if (!draft?.transcript) return;
    voiceLoadedRef.current = true;
    setAiText(draft.transcript);
    setAiOpen(true);
    // Chạy parse sau 1 tick để aiText state đã cập nhật.
    setTimeout(() => aiParse.mutate(), 60);
    toast.info("Đã nạp bản ghi âm — đang bóc tách bằng AI…");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceParam]);

  const [maNhomDraft, setMaNhomDraft] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [closingIntent, setClosingIntent] = useState(false);

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
      if (!tinhHinh.trim()) return "Đóng sự cố cần khai Tình hình hiện tại";
      if (!ketQua.trim()) return "Đóng sự cố cần khai Phương án khắc phục";
    }
    return null;
  }

  function buildPayloadForSave(maNhom: string, closing: boolean) {
    const selectedTp = tpList.filter((t) => selectedTpIds.has(t.id));
    const bao_cao_ban_dau = {
      kinh_gui: kinhGui,
      he_thong_dich_vu: heThongDichVu,
      tom_tat: tomTat,
      thoi_gian_bat_dau: fmtDateTime(thoiGianBatDau),
      thoi_gian_ket_thuc: thoiGianKetThuc ? fmtDateTime(thoiGianKetThuc) : "",
      dia_diem: diaDiemAuto,
      kip_truc: kip.filter((k) => k.ho_ten.trim()),
      thanh_phan_list: selectedTp.map((t) => ({ id: t.id, ma: t.ma, ten: t.ten, vi_tri: t.vi_tri_ten })),
      tinh_trang_he_thong: tinhTrangHT,
      da_dong: closing,
      tinh_hinh_hien_tai: tinhHinh,
      ket_qua_khac_phuc: ketQua,
      phan_loai: phanLoai,
      nguyen_nhan: nguyenNhan,
      bien_phap_xu_ly: bienPhap,
      thiet_bi_list: selected.map((d) => d.ma_thiet_bi),
      nguon: aiFilled ? "AI" : "Người dùng",
    };
    return buildSuCoPayload({
      ma_nhom_bc: maNhom,
      ngay_phat_hien: ngayPhatHien,
      nguoi_bao_cao: profile?.ho_ten || profile?.email || "",
      muc_do: MUC_BY_PL[phanLoai] ?? "Thấp",
      anh_huong_dhb: anhHuongDhb,
      hien_tuong: hienTuong,
      nguyen_nhan: nguyenNhan || null,
      bien_phap_xu_ly: bienPhap || null,
      bao_cao_ban_dau,
      van_de_id: vanDeId || null,
      trang_thai: closing ? "hoan_thanh" : "bao_cao",
      devices: selected.map((d) => ({
        id: d.id,
        ma_thiet_bi: d.ma_thiet_bi,
        don_vi: d.don_vi ?? null,
        he_thong_id: d._htId ?? null,
        he_thong_ten: d._htTen ?? null,
      })),
    });
  }

  function openPreview(closing: boolean) {
    const err = validateBeforeSave(closing);
    if (err) { toast.error(err); return; }
    setClosingIntent(closing);
    if (!maNhomDraft) setMaNhomDraft(`BC-${Date.now().toString(36).toUpperCase()}`);
    setPreviewOpen(true);
  }

  const previewInput: KhaiNghiepVuInput | null = useMemo(() => {
    if (selected.length === 0) return null;
    const d = selected[0];
    return { loai: "SU_CO", thiet_bi_id: d.id, moTa: hienTuong, thoiGian: ngayPhatHien, tenThietBi: d.ma_thiet_bi };
  }, [selected, hienTuong, ngayPhatHien]);

  const save = useMutation({
    mutationFn: async () => {
      const err = validateBeforeSave(closingIntent);
      if (err) throw new Error(err);
      const maNhom = maNhomDraft ?? `BC-${Date.now().toString(36).toUpperCase()}`;
      const payload = buildPayloadForSave(maNhom, closingIntent);
      const res = await ghiSuCoFull(payload);
      // Nếu là đóng sự cố → update mốc kết thúc + trạng thái N6 hoàn thành.
      if (closingIntent && res?.ids?.length && thoiGianKetThuc) {
        const iso = new Date(thoiGianKetThuc).toISOString();
        await supabase
          .from("su_co")
          .update({
            thoi_diem_khac_phuc: iso,
            at_hoan_thanh: iso,
            trang_thai_moi: "hoan_thanh",
          })
          .in("id", res.ids);
      }
      return maNhom;
    },
    onSuccess: (maNhom) => {
      toast.success(closingIntent ? "Đã lập báo cáo & đóng sự cố" : "Đã lập báo cáo ban đầu & ghi vào sổ lý lịch");
      setLastNhom(maNhom);
      setPreviewOpen(false);
      setMaNhomDraft(null);
      qc.invalidateQueries({ queryKey: ["operations_data"] });
    },
    onError: (e: Error) => { const t = rpcErrorToast(e); toast.error(t.title, { description: t.description, duration: t.description ? 15000 : 5000 }); },
  });

  const exportM = useMutation({
    mutationFn: async (maNhom: string) => exportFn({ data: { ma_nhom_bc: maNhom } }),
    onSuccess: (r) => {
      const blob = new Blob([Uint8Array.from(atob(r.base64), (c) => c.charCodeAt(0))],
        { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = r.fileName; a.click();
      URL.revokeObjectURL(url);
      toast.success("Đã xuất Word");
    },
    onError: (e: Error) => { const t = rpcErrorToast(e); toast.error(t.title, { description: t.description, duration: t.description ? 15000 : 5000 }); },
  });

  const daDong = !!thoiGianKetThuc;

  // Anomaly detection — chạy client-side, không chặn lưu, chỉ highlight.
  const anomalies: Anomaly[] = useMemo(
    () =>
      detectSuCoAnomalies({
        thoiGianBatDau,
        thoiGianKetThuc,
        phanLoai,
        anhHuongDhb,
        heThongId,
        selectedTpCount: selectedTpIds.size,
        mountedAssetsCount: mounted.length,
      }),
    [thoiGianBatDau, thoiGianKetThuc, phanLoai, anhHuongDhb, heThongId, selectedTpIds, mounted],
  );
  const anomalyFields = useMemo(() => anomalyFieldSet(anomalies), [anomalies]);
  const ring = (field: string) =>
    anomalyFields.has(field) ? "ring-1 ring-amber-400 focus-visible:ring-amber-400" : "";

  return (
    <div className={embedded ? "space-y-3 p-4 pb-28" : "mx-auto max-w-5xl space-y-3 pb-28"}>
      {!embedded && (
        <FormPageHeader
          backTo="/su-co"
          backLabel="Nhật ký sự cố"
          icon={FileText}
          title="Báo cáo ban đầu"
          description="Lập biên bản sự cố → ghi vào sổ lý lịch tài sản & hệ thống → xuất Word theo mẫu."
          actions={
            <div className="flex flex-wrap items-center gap-2">
            {aiFilled && (
              <Badge variant="secondary" className="gap-1 border-primary/30 bg-primary/10 text-primary">
                <Sparkles className="h-3 w-3" /> AI điền · chờ xác nhận
              </Badge>
            )}
            {daDong ? (
              <Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Đã có thời gian kết thúc
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700">
                Chưa kết thúc · theo dõi thêm
              </Badge>
            )}
            </div>
          }
        />
      )}


      {aiNote && (
        <p className="rounded-md border border-amber-300/50 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {aiNote}
        </p>
      )}

      {anomalies.length > 0 && (
        <div className="rounded-md border border-amber-300/60 bg-amber-50/70 px-3 py-2 text-xs dark:bg-amber-950/30">
          <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-3.5 w-3.5" /> Cảnh báo logic ({anomalies.length})
          </div>
          <ul className="ml-4 list-disc space-y-0.5 text-amber-900/90 dark:text-amber-100/90">
            {anomalies.map((a) => (
              <li key={a.code}>
                <span className={a.severity === "error" ? "font-semibold text-red-700 dark:text-red-300" : ""}>
                  {a.message}
                </span>
                {a.hint && <span className="text-amber-800/80 dark:text-amber-200/70"> — {a.hint}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 1. Thông tin chung */}
      <Card>
        <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-semibold text-primary">1. Thông tin chung</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs font-medium">Sự cố *</Label>
            <Textarea value={hienTuong} onChange={(e) => setHienTuong(e.target.value)} rows={2} className="mt-1" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label className="text-xs font-medium">Kính gửi</Label>
              <Combobox options={kinhGuiOptions} value={kinhGui} onChange={setKinhGui} allowCustom
                placeholder="Đơn vị / phòng ban nhận báo cáo" searchPlaceholder="Tìm đơn vị / phòng ban…" />
            </div>
            <div>
              <Label className="text-xs font-medium">Vấn đề (RCA) liên quan</Label>
              <Combobox options={[{ value: "", label: "— Không liên kết —" }, ...vanDeOptions]}
                value={vanDeId} onChange={setVanDeId}
                placeholder="Chọn vấn đề liên quan (nếu có)" searchPlaceholder="Tìm mã / tiêu đề vấn đề…" />
            </div>
          </div>
          <div>
            <Label className="text-xs font-medium">Hệ thống bị sự cố *</Label>
            <Combobox options={heThongOptions} value={heThongId || heThongDichVu}
              onChange={onPickHeThong} allowCustom
              placeholder="Chọn hệ thống tài sản" searchPlaceholder="Tìm hệ thống…" />
            <p className="mt-1 text-[11px] text-muted-foreground">Chọn hệ thống để hiển thị các thành phần bị ảnh hưởng bên dưới. Địa điểm sẽ tự lấy từ thành phần được chọn.</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Thành phần hệ thống bị ảnh hưởng */}
      <Card>
        <CardHeader className="pb-2 pt-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Layers className="h-4 w-4" /> 2. Thành phần hệ thống bị ảnh hưởng *
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!heThongId ? (
            <p className="rounded-md border border-dashed bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
              Chọn <span className="font-medium text-foreground">Hệ thống</span> ở mục 1 để hiển thị danh sách thành phần.
            </p>
          ) : tpLoading ? (
            <p className="text-xs text-muted-foreground"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> Đang tải thành phần…</p>
          ) : tpList.length === 0 ? (
            <p className="text-xs text-muted-foreground">Hệ thống này chưa khai thành phần nào.</p>
          ) : (
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border p-1">
              {tpList.map((tp) => {
                const on = selectedTpIds.has(tp.id);
                const assets = mounted.filter((m) => m.thanh_phan_id === tp.id);
                return (
                  <label key={tp.id}
                    className={`flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted ${on ? "bg-primary/5" : ""}`}>
                    <Checkbox checked={on} onCheckedChange={(v) => toggleTp(tp.id, !!v)} className="mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs text-primary">{tp.ma}</span>
                        <span className="font-medium">{tp.ten}</span>
                        {tp.vi_tri_ten && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <MapPin className="h-2.5 w-2.5" /> {tp.vi_tri_ten}
                          </Badge>
                        )}
                      </div>
                      {on && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {assets.length === 0 ? (
                            <span className="text-[11px] text-amber-700">Chưa lắp tài sản nào.</span>
                          ) : assets.map((a) => (
                            <Badge key={a.device.id} variant="secondary" className="text-[10px]">
                              <span className="font-mono">{a.device.ma_thiet_bi}</span>&nbsp;· {a.device.ten}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          {selectedTpIds.size > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Đã chọn <b>{selectedTpIds.size}</b> thành phần · liên kết <b>{selected.length}</b> tài sản đang lắp.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 3. Diễn biến sự việc */}
      <Card>
        <CardHeader className="pb-2 pt-3"><CardTitle className="text-sm font-semibold text-primary">3. Diễn biến sự việc</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <Label className="block h-4 text-xs font-medium leading-4">Thời gian bắt đầu</Label>
              <Input type="datetime-local" value={thoiGianBatDau}
                onChange={(e) => setThoiGianBatDau(e.target.value)}
                className={ring("thoi_gian_bat_dau")} />
            </div>
            <div className="space-y-1">
              <Label className="block h-4 text-xs font-medium leading-4">Thời gian kết thúc</Label>
              <Input type="datetime-local" value={thoiGianKetThuc}
                onChange={(e) => setThoiGianKetThuc(e.target.value)}
                className={ring("thoi_gian_ket_thuc")} />
            </div>
            <div className="space-y-1">
              <Label className="block h-4 text-xs font-medium leading-4">Ngày phát hiện</Label>
              <Input type="date" value={ngayPhatHien} onChange={(e) => setNgayPhatHien(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="flex h-4 items-center gap-1 text-xs font-medium leading-4">
                <Lock className="h-3 w-3" /> Địa điểm (tự động)
              </Label>
              <Input value={diaDiemAuto} readOnly className="bg-muted/50" placeholder="Chọn thành phần để lấy vị trí" />
            </div>
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium">Tóm tắt sự việc xảy ra</Label>
            <Textarea value={tomTat} onChange={(e) => setTomTat(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium">
              Tình trạng hệ thống sau xử lý {daDong && <span className="text-destructive">*</span>}
            </Label>
            <Textarea value={tinhTrangHT} onChange={(e) => setTinhTrangHT(e.target.value)} rows={2}
              placeholder="VD: Hệ thống đã khôi phục hoạt động bình thường / vẫn còn hạn chế…" />
          </div>

          {/* GĐ3-05: Vision Image Hint — upload ảnh hiện trường + AI gợi ý */}
          <VisionImageHint
            onApplyDescription={(t) => setTomTat((prev) => prev ? `${prev}\n${t}` : t)}
            onApplyCategory={(c) => setPhanLoai(c)}
            onApplyKeywords={(kws) => setHienTuong((prev) => prev ? prev : kws.slice(0, 6).join(", "))}
          />
        </CardContent>
      </Card>


      {/* 4. Thành phần kíp trực — mặc định thu gọn */}
      <CollapsibleSection
        formId="su-co-moi"
        sectionId="sec-4-kip-truc"
        title={<span className="inline-flex items-center">4. Thành phần kíp trực{kipAmbient.isAuto && <AutoFilledBadge onUndo={kipAmbient.undo} />}</span>}
        action={
          <Button type="button" variant="outline" size="sm" onClick={addKip}>
            <Plus className="mr-1 h-4 w-4" /> Thêm
          </Button>
        }
      >
        <div className="space-y-1.5">
          {kip.map((k, i) => (
            <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
              <Input value={k.ho_ten} onChange={(e) => updateKip(i, "ho_ten", e.target.value)} placeholder="Họ và tên" />
              <Input value={k.chuc_vu} onChange={(e) => updateKip(i, "chuc_vu", e.target.value)} placeholder="Chức vụ" />
              <Input value={k.nang_dinh} onChange={(e) => updateKip(i, "nang_dinh", e.target.value)} placeholder="Năng định" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeKip(i)} disabled={kip.length === 1}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* 5. Đánh giá & phân loại — auto-mở khi đóng sự cố (fields trở nên bắt buộc) */}
      <CollapsibleSection
        formId="su-co-moi"
        sectionId="sec-5-danh-gia"
        title="5. Đánh giá & phân loại"
        forceOpen={daDong}
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <Label className="mb-1 block text-xs font-medium">Ảnh hưởng ĐHB</Label>
            <Select value={anhHuongDhb} onValueChange={setAnhHuongDhb}>
              <SelectTrigger className={ring("anh_huong_dhb")}><SelectValue /></SelectTrigger>
              <SelectContent>
                {AH_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label className="mb-1 block text-xs font-medium">Phân loại sự cố (A/B/C/D/E)</Label>
            <RadioGroup value={phanLoai} onValueChange={setPhanLoai}
              className={`grid grid-cols-2 gap-2 sm:grid-cols-5 ${anomalyFields.has("phan_loai") ? "rounded-md ring-1 ring-amber-400 p-1" : ""}`}>
              {PHAN_LOAI.map((p) => {
                const on = phanLoai === p;
                return (
                  <label key={p} htmlFor={`pl-${p}`}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1.5 text-sm transition ${on ? "border-primary bg-primary/5" : "border-input hover:bg-muted/50"}`}>
                    <RadioGroupItem value={p} id={`pl-${p}`} />
                    <span className="font-medium">Loại {p}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{MUC_BY_PL[p]}</span>
                  </label>
                );
              })}
            </RadioGroup>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs font-medium">Nguyên nhân {daDong && <span className="text-destructive">*</span>}</Label>
            <Textarea value={nguyenNhan} onChange={(e) => setNguyenNhan(e.target.value)} rows={3} placeholder="Nguyên nhân / nghi ngờ (bắt buộc khi đóng)" />
          </div>
          <div>
            <Label className="mb-1 flex items-center text-xs font-medium">
              Biện pháp xử lý / giải trợ {daDong && <span className="text-destructive">*</span>}
              {bienPhapAmbient.isAuto && <AutoFilledBadge onUndo={bienPhapAmbient.undo} label="gợi ý" />}
            </Label>
            <Textarea value={bienPhap}
              onChange={(e) => { bienPhapAmbient.onUserChange(); setBienPhap(e.target.value); }}
              rows={3} placeholder="Phương án giải trợ tạm thời (bắt buộc khi đóng)" />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium">Tình hình hiện tại {daDong && <span className="text-destructive">*</span>}</Label>
            <Textarea value={tinhHinh} onChange={(e) => setTinhHinh(e.target.value)} rows={3} />
          </div>
          <div>
            <Label className="mb-1 block text-xs font-medium">Phương án khắc phục {daDong && <span className="text-destructive">*</span>}</Label>
            <Textarea value={ketQua} onChange={(e) => setKetQua(e.target.value)} rows={3} />
          </div>
        </div>
      </CollapsibleSection>


      {/* Sticky action bar */}
      <div className="sticky bottom-0 -mx-2 mt-4 flex flex-wrap items-center justify-end gap-2 border-t bg-background/95 px-2 py-3 backdrop-blur">
        {lastNhom && (
          <Button variant="outline" size="sm" onClick={() => exportM.mutate(lastNhom)} disabled={exportM.isPending}>
            {exportM.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <FileDown className="mr-1 h-4 w-4" />}
            Xuất lại Word
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => openPreview(false)} disabled={save.isPending}>
          {save.isPending && !closingIntent ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
          Lưu (chưa đóng)
        </Button>
        <Button size="sm" variant="secondary" onClick={() => openPreview(false)} disabled={save.isPending || exportM.isPending}>
          <FileText className="mr-1 h-4 w-4" /> Lưu &amp; xuất Word
        </Button>
        <Button
          size="sm"
          className="bg-emerald-600 text-white hover:bg-emerald-700"
          onClick={() => openPreview(true)}
          disabled={save.isPending}
        >
          {save.isPending && closingIntent ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-1 h-4 w-4" />}
          Đóng sự cố
        </Button>
      </div>

      <PreviewKhaiDialog
        open={previewOpen}
        input={previewInput}
        dangGhi={save.isPending}
        onCancel={() => setPreviewOpen(false)}
        onConfirm={() => save.mutate()}
      />

      <Button type="button" onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 z-40 gap-2 rounded-full shadow-lg">
        <Bot className="h-4 w-4" /> AI hỗ trợ nhập liệu
        <Badge variant="outline" className="ml-0.5 border-primary-foreground/40 text-[10px] text-primary-foreground">Beta</Badge>
      </Button>

      <Button type="button" variant="secondary" onClick={handlePasteReport}
        className="fixed bottom-6 right-56 z-40 gap-2 rounded-full shadow-lg">
        <ClipboardPaste className="h-4 w-4" /> Dán báo cáo
      </Button>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary" /> AI hỗ trợ nhập liệu
              <Badge variant="outline" className="text-[10px]">Beta</Badge>
            </SheetTitle>
            <SheetDescription>
              Dán nguyên đoạn mô tả sự cố (không cần đúng cấu trúc). AI sẽ tự hiểu và điền các trường trong form.
              Bạn chọn thành phần bị ảnh hưởng, kiểm tra rồi mới bấm Lưu.
            </SheetDescription>
          </SheetHeader>
          <Textarea value={aiText} onChange={(e) => setAiText(e.target.value)} rows={12} className="flex-1 resize-none"
            placeholder="VD: Hệ thống VHF Park Air T6T (127.9MHz Main) của APP lỗi lúc 0259Z ngày 08/07/2026, không ảnh hưởng ĐHB, nghi sét đánh…" />
          {aiFilled && (
            <span className="flex items-center gap-1 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Đã điền — hãy đóng lại và kiểm tra form
            </span>
          )}
          <Button type="button" onClick={() => aiParse.mutate()} disabled={aiParse.isPending || aiText.trim().length < 10}>
            {aiParse.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
            Phân tích &amp; điền form
          </Button>
        </SheetContent>
      </Sheet>
    </div>
  );
}
