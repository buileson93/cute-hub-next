// Khế ước ghi nhận nghiệp vụ dùng chung cho sự cố / bảo dưỡng / hỏng hóc.
// Thuần logic (pure) — không đụng Supabase; chỉ validate + build preview.
// Tầng ghi thực tế đi qua RPC nguyên tử (ghi_su_co_atomic / ghi_bao_duong_atomic /
// ghi_hong_hoc_atomic) + kho_xuat cùng transaction.

export type LoaiNghiepVu = "SU_CO" | "BAO_DUONG" | "HONG_HOC";

export interface VatTuTieuHao {
  vat_tu_id: string;
  kho_id: string;
  so_luong: number;
  ten_vat_tu?: string;
}

export interface KhaiNghiepVuInput {
  loai: LoaiNghiepVu;
  thiet_bi_id: string;
  moTa: string;
  thoiGian: string; // ISO
  vatTuTieuHao?: VatTuTieuHao[];
  // Ngữ cảnh phụ trợ (không bắt buộc — dùng để cảnh báo/preview):
  trangThaiThietBi?: string | null;
  tenThietBi?: string | null;
}

export interface KetQuaValidate {
  hopLe: boolean;
  loi: string[];
  canhBao: string[];
}

export interface KetQuaPreview {
  tomTat: string;
  sePhatSinh: string[];
}

const NHAN_LOAI: Record<LoaiNghiepVu, string> = {
  SU_CO: "Sự cố",
  BAO_DUONG: "Bảo dưỡng",
  HONG_HOC: "Hỏng hóc",
};

const TRANG_THAI_THANH_LY = new Set([
  "THANH_LY",
  "thanh_ly",
  "Thanh lý",
  "DA_THANH_LY",
]);

export function validateKhai(i: KhaiNghiepVuInput, now: Date = new Date()): KetQuaValidate {
  const loi: string[] = [];
  const canhBao: string[] = [];

  if (!i.thiet_bi_id || !i.thiet_bi_id.trim()) {
    loi.push("Thiếu tài sản (thiet_bi_id).");
  }
  if (!i.moTa || !i.moTa.trim()) {
    loi.push("Thiếu mô tả.");
  }
  if (!i.thoiGian) {
    loi.push("Thiếu thời gian.");
  } else {
    const t = new Date(i.thoiGian);
    if (isNaN(t.getTime())) {
      loi.push("Thời gian không hợp lệ.");
    } else if (t.getTime() > now.getTime() + 60_000) {
      loi.push("Thời gian không được ở tương lai.");
    }
  }

  const dsVT = i.vatTuTieuHao ?? [];
  const seen = new Set<string>();
  dsVT.forEach((v, idx) => {
    const nhan = `Vật tư #${idx + 1}`;
    if (!v.vat_tu_id) loi.push(`${nhan}: thiếu vat_tu_id.`);
    if (!v.kho_id) loi.push(`${nhan}: thiếu kho_id.`);
    if (!(v.so_luong > 0)) loi.push(`${nhan}: số lượng phải > 0.`);
    const key = `${v.vat_tu_id}::${v.kho_id}`;
    if (seen.has(key)) canhBao.push(`${nhan}: trùng vật tư/kho — sẽ cộng gộp khi xuất.`);
    seen.add(key);
  });

  if (i.trangThaiThietBi && TRANG_THAI_THANH_LY.has(i.trangThaiThietBi)) {
    canhBao.push("Tài sản đang ở trạng thái thanh lý — cân nhắc trước khi ghi.");
  }

  return { hopLe: loi.length === 0, loi, canhBao };
}

export function previewKhai(i: KhaiNghiepVuInput): KetQuaPreview {
  const nhan = NHAN_LOAI[i.loai];
  const tenTB = i.tenThietBi ? `${i.tenThietBi} (${i.thiet_bi_id})` : i.thiet_bi_id;
  const tomTat = `${nhan} cho tài sản ${tenTB} lúc ${i.thoiGian}`;

  const sePhatSinh: string[] = [];
  if (i.loai === "SU_CO") sePhatSinh.push("Tạo bản ghi trong bảng su_co.");
  if (i.loai === "BAO_DUONG") sePhatSinh.push("Tạo bản ghi trong bảng bao_tri.");
  if (i.loai === "HONG_HOC") sePhatSinh.push("Tạo bản ghi trong bảng hong_hoc.");

  const dsVT = i.vatTuTieuHao ?? [];
  if (dsVT.length > 0) {
    for (const v of dsVT) {
      const ten = v.ten_vat_tu ? `${v.ten_vat_tu} (${v.vat_tu_id})` : v.vat_tu_id;
      sePhatSinh.push(
        `Xuất kho ${v.so_luong} × ${ten} từ kho ${v.kho_id} (bút toán kho_xuat, gắn liên kết nghiệp vụ).`,
      );
    }
  }

  sePhatSinh.push("Ghi audit_log với nguon_nhap='khai_form'.");
  return { tomTat, sePhatSinh };
}
