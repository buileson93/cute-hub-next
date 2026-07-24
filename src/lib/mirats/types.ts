export interface DonVi {
  ma: string;
  ten: string;
  loai: string;
  don_vi_cha: string | null;
  ma_icao: string | null;
}
export interface NhomHeThong {
  ma: string;
  ten: string;
  linh_vuc: string;
}
export interface HeThong {
  ma: string;
  ten: string;
  nhom: string;
  don_vi: string;
  trang_thai: string;
  nam_dua_vao: number;
}
export interface LoaiThietBi {
  ma: string;
  ten: string;
  nhom_loai: string;
  tuoi_tho_thiet_ke_nam: number;
}
export interface NhaSanXuat {
  ten: string;
  quoc_gia: string;
}
export interface ViTri {
  ma: string;
  ten: string;
  don_vi: string;
  loai_vi_tri: string;
}
export interface NhanVien {
  ma_nhan_vien: string;
  ho_ten: string;
  don_vi: string;
  chuc_vu: string;
}
export interface ThietBi {
  ma_thiet_bi: string;
  ten: string;
  serial: string;
  p_n: string;
  model: string;

  don_vi: string;
  he_thong: string;
  nhom_he_thong: string;
  loai: string;
  nha_san_xuat: string;
  nha_cung_cap: string;
  vi_tri: string;
  ngay_mua: string;
  ngay_dua_vao_su_dung: string;
  han_bao_hanh: string;
  gia_tri_mua: number;
  nguon_von: string;
  tuoi_tho_thiet_ke_nam: number;
  trang_thai: string;
  muc_do_quan_trong: string;
  tinh_trang_ky_thuat: string;
  thiet_bi_cha: string | null;
  ghi_chu: string | null;
}
export interface SuKienThietBi {
  id: string;
  thiet_bi: string;
  loai_su_kien: string;
  ngay: string;
  tieu_de: string;
  mo_ta: string;
  nguon: string;
  nguon_id: string | null;
}
export interface GiayPhep {
  id: string;
  thietBi: string | null;
  loai: string | null;
  soGP: string | null;
  ngayCap: string | null;
  ngayHetHan: string | null;
  noiCap: string | null;
  file: string | null;
  ghiChu: string | null;
}
export interface KipTrucVien {
  ho_ten: string;
  chuc_vu: string;
  nang_dinh: string;
}
export interface BaoCaoBanDau {
  kinh_gui: string;
  he_thong_dich_vu: string;
  tom_tat: string;
  thoi_gian_bat_dau: string;
  dia_diem: string;
  kip_truc: KipTrucVien[];
  tinh_hinh_hien_tai: string;
  ket_qua_khac_phuc: string;
  phan_loai: string; // A|B|C|D|E
  thiet_bi_list: string[];
}
/**
 * Ảnh chụp (snapshot) nhận dạng tài sản tại thời điểm ghi nhận bản ghi sổ lý lịch.
 * Được CSDL tự điền qua trigger và khoá cứng (client không sửa được).
 * Dùng làm PHƯƠNG ÁN DỰ PHÒNG khi liên kết tài sản hiện tại đã mất/đổi.
 */
export interface DeviceIdentitySnapshot {
  snapshot_ma_thiet_bi?: string | null;
  snapshot_ten_thiet_bi?: string | null;
  snapshot_he_thong?: string | null;
  snapshot_don_vi?: string | null;
  snapshot_vi_tri?: string | null;
}
export interface SuCo extends DeviceIdentitySnapshot {
  ma_su_co: string;
  thiet_bi: string;
  /** Khoá ngoại chuẩn tới thiet_bi.id (ưu tiên khi khớp lý lịch). */
  thiet_bi_id: string | null;
  he_thong: string;
  /** Khoá ngoại chuẩn tới dm_he_thong.id. */
  he_thong_id: string | null;
  don_vi: string;
  ngay_phat_hien: string;
  nguoi_bao_cao: string;
  muc_do: string;
  anh_huong_dhb: string;
  hien_tuong: string;
  nguyen_nhan: string | null;
  bien_phap_xu_ly: string | null;
  thoi_diem_khac_phuc: string | null;
  thoi_gian_gian_doan: number | null;
  nguoi_xu_ly: string[];
  trang_thai: string;
  lien_ket_hong_hoc: string | null;
  file_dinh_kem: string | null;
  bao_cao_ban_dau: BaoCaoBanDau | null;
  ma_nhom_bc: string | null;
  /** Vấn đề (RCA) liên quan — đồng bộ với su_co.van_de_id. */
  van_de_id: string | null;
}
export interface BaoTri extends DeviceIdentitySnapshot {
  ma_bao_tri: string;
  thiet_bi: string;
  thiet_bi_id: string | null;
  he_thong: string;
  he_thong_id: string | null;
  don_vi: string;
  loai_bao_tri: string;
  ke_hoach: string | null;
  ngay_bat_dau: string;
  ngay_hoan_thanh: string | null;
  mo_ta_cong_viec: string;
  ket_qua: string | null;
  chi_phi: number;
  nguoi_thuc_hien: string[];
  don_vi_thuc_hien: string;
  trang_thai: string;
  file_bien_ban: string | null;
}
export interface BaoTriHangMuc {
  id: string;
  bao_tri: string;
  ten_hang_muc: string;
  ket_qua: string;
  gia_tri_do: string;
  tieu_chuan: string;
  ghi_chu: string;
}
export interface KeHoachBaoTri {
  ma: string;
  ten: string;
  ap_dung_nhom_he_thong: string | null;
  ap_dung_loai: string | null;
  chu_ky: string;
  noi_dung_checklist: string;
  don_vi_phu_trach: string;
  kich_hoat: boolean;
}
export interface VatTu {
  ma: string;
  ten: string;
  don_vi_tinh: string;
  don_gia: number;
  ton_kho: number;
  muc_ton_toi_thieu: number;
  vi_tri_kho?: string;
  tuong_thich?: string[];
  nha_cung_cap?: string;
  loai_vat_tu?: string;
  /** Phân loại kiểu Snipe-IT: "du_phong" (Components/spare) hoặc "tieu_hao" (Consumables). */
  phan_loai?: "du_phong" | "tieu_hao";
}
export interface XuatNhapKho {
  ma: string;
  vat_tu: string;
  loai_giao_dich: string;
  so_luong: number;
  ngay: string;
  lien_ket_bao_tri: string | null;
  lien_ket_hong_hoc: string | null;
  nguoi_thuc_hien: string;
  ghi_chu: string;
}
export interface HongHocThayThe extends DeviceIdentitySnapshot {
  id: string;
  thanh_phan_id: string | null;
  ma_hong_hoc: string;
  thiet_bi_hong: string;
  thiet_bi_hong_id: string | null;
  su_co: string | null;
  ngay_hong: string;
  bo_phan_hong: string;
  mo_ta_hong_hoc: string;
  phuong_an: string;
  thiet_bi_thay_the: string | null;
  thiet_bi_thay_the_id: string | null;
  vat_tu_su_dung: string[];
  chi_phi: number;
  nguoi_thuc_hien: string[];
  don_vi_thuc_hien: string;
  ket_qua: string | null;
  ngay_hoan_thanh: string | null;
  trang_thai: string;
  file_dinh_kem: string | null;
}
export interface BanGiao extends DeviceIdentitySnapshot {
  ma_ban_giao: string;
  thiet_bi: string;
  loai_ban_giao: string;
  nguoi_giao: string;
  nguoi_nhan: string;
  don_vi_nhan: string;
  ngay_nhan: string;
  ngay_tra: string | null;
  tinh_trang_khi_nhan: string;
  tinh_trang_khi_tra: string | null;
  file_bien_ban: string | null;
  trang_thai: string;
  ghi_chu: string | null;
}
