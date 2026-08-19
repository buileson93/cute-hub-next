export type CongVanLoai = "den" | "di" | "to_trinh" | "bao_cao" | "quyet_dinh" | "khac";
export type CongVanTrangThai =
  | "moi" | "dang_xu_ly" | "cho_duyet" | "da_duyet" | "da_phat_hanh" | "hoan_tat" | "huy";
export type CongVanLienKetLoai = "tra_loi" | "can_cu" | "lien_quan" | "dinh_kem";

export type CongVanRow = {
  id: string;
  du_an_id: string;
  parent_id: string | null;
  so_cong_van: string;
  loai: CongVanLoai;
  trich_yeu: string | null;
  co_quan_ban_hanh: string | null;
  co_quan_nhan: string | null;
  ngay_ban_hanh: string | null;
  ngay_tiep_nhan: string | null;
  han_phuc_dap: string | null;
  trang_thai: CongVanTrangThai;
  can_cu_text: string | null;
  ghi_chu: string | null;
  created_at: string;
  metadata: Record<string, any> | null;
};


export type CongVanLinkRow = {
  id: string;
  tu_id: string;
  den_id: string;
  loai: CongVanLienKetLoai;
  ghi_chu: string | null;
};

export type CongVanTepRow = {
  id: string;
  cong_van_id: string;
  bucket: string;
  file_path: string;
  file_name: string;
  mime_type: string | null;
  kich_thuoc: number | null;
  created_at: string;
  metadata: Record<string, any> | null;
};


export const CV_BUCKET = "du-an-cong-van";

export const LOAI_META: Record<CongVanLoai, { label: string; short: string; tone: string; dot: string }> = {
  den:        { label: "Công văn đến",  short: "CV Đến",   tone: "bg-sky-50 text-sky-700 border-sky-200",           dot: "bg-sky-500" },
  di:         { label: "Công văn đi",   short: "CV Đi",    tone: "bg-violet-50 text-violet-700 border-violet-200",  dot: "bg-violet-500" },
  to_trinh:   { label: "Tờ trình",      short: "Tờ trình", tone: "bg-amber-50 text-amber-700 border-amber-200",     dot: "bg-amber-500" },
  bao_cao:    { label: "Báo cáo",       short: "Báo cáo",  tone: "bg-teal-50 text-teal-700 border-teal-200",        dot: "bg-teal-500" },
  quyet_dinh: { label: "Quyết định",    short: "QĐ",       tone: "bg-rose-50 text-rose-700 border-rose-200",        dot: "bg-rose-500" },
  khac:       { label: "Khác",          short: "Khác",     tone: "bg-slate-50 text-slate-700 border-slate-200",     dot: "bg-slate-400" },
};

export const TRANG_THAI_META: Record<CongVanTrangThai, { label: string; tone: string }> = {
  moi:          { label: "Mới",           tone: "bg-slate-100 text-slate-700 border-slate-200" },
  dang_xu_ly:   { label: "Đang xử lý",    tone: "bg-sky-100 text-sky-700 border-sky-200" },
  cho_duyet:    { label: "Chờ duyệt",     tone: "bg-amber-100 text-amber-700 border-amber-200" },
  da_duyet:     { label: "Đã duyệt",      tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  da_phat_hanh: { label: "Đã phát hành",  tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  hoan_tat:     { label: "Đã hoàn tất",   tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  huy:          { label: "Huỷ",           tone: "bg-rose-100 text-rose-700 border-rose-200" },
};

export const LIEN_KET_META: Record<CongVanLienKetLoai, { label: string; arrow: string }> = {
  tra_loi:   { label: "Trả lời bởi",  arrow: "Phụ thuộc / Trả lời bởi" },
  can_cu:    { label: "Căn cứ theo",  arrow: "Căn cứ" },
  lien_quan: { label: "Liên quan",    arrow: "Liên quan" },
  dinh_kem:  { label: "Đính kèm",     arrow: "Đính kèm" },
};

/** Mốc thời gian dùng cho trục timeline: ưu tiên ngày ban hành → tiếp nhận → tạo. */
export function cvMoc(cv: CongVanRow): Date {
  const s = cv.ngay_ban_hanh ?? cv.ngay_tiep_nhan ?? cv.created_at;
  return new Date(s);
}

export function fmtDate(s: string | null | undefined): string {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Trích số công văn từ câu "Căn cứ theo công văn số 12/CV-ĐT…". */
export function extractCanCuSo(text: string | null | undefined): string | null {
  if (!text) return null;
  const m = text.match(/(?:công\s*văn|cv|văn\s*bản|số)\s*(?:số\s*)?([0-9]{1,5}\s*\/\s*[A-Za-zÀ-ỹ0-9.\-]+)/i);
  return m ? m[1].replace(/\s+/g, "") : null;
}