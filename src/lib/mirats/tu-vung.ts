// ============================================================================
// Task 26 — Từ điển nhãn dùng chung cho HÀNH ĐỘNG và KHÁI NIỆM nghiệp vụ.
// Mọi trang danh sách / form / dialog PHẢI import từ đây để nhất quán.
// Không hard-code chuỗi "Thêm", "Tạo mới", "Sửa", "Xoá" ở component riêng.
// ============================================================================

/** Nhãn hành động chuẩn (verbs). */
export const NHAN = {
  tao: "Thêm mới",
  sua: "Sửa",
  xoa: "Xoá",
  hoanThanh: "Hoàn thành",
  dong: "Đóng hồ sơ",
  moLai: "Mở lại",
  huy: "Huỷ",
  luu: "Lưu",
  luuVaThoat: "Lưu & thoát",
  quayLai: "Quay lại",
  xacNhan: "Xác nhận",
  xemTruoc: "Xem trước tác động",
  tiepTuc: "Tiếp tục",
  chiTietDoc: "Chỉ tra cứu",
  nhapKhau: "Nhập khẩu",
  xuatKhau: "Xuất khẩu",
  taiVe: "Tải về",
  loc: "Lọc",
  timKiem: "Tìm kiếm",
  taiLai: "Tải lại",
} as const;

/** Nhãn khái niệm chuẩn (nouns). Dùng để đặt tiêu đề trang/nút/dialog. */
export const KHAI_NIEM = {
  thiet_bi: "Tài sản",
  thanh_phan: "Thành phần",
  he_thong: "Hệ thống",
  vi_tri: "Vị trí",
  don_vi: "Đơn vị",
  su_co: "Sự cố",
  van_de: "Vấn đề",
  bao_tri: "Bảo dưỡng",
  cong_viec: "Phiếu công việc",
  hong_hoc: "Hỏng hóc / Thay thế",
  bien_ban: "Biên bản",
  ban_giao: "Bàn giao",
  giay_phep: "Giấy phép",
  vat_tu: "Vật tư",
  kho: "Kho",
  kiem_ke: "Kiểm kê",
  danh_muc: "Danh mục",
} as const;

export type NhanKey = keyof typeof NHAN;
export type KhaiNiemKey = keyof typeof KHAI_NIEM;

/** Tiêu đề "Thêm mới {khái niệm}". */
export function nhanTao(kn: KhaiNiemKey): string {
  return `${NHAN.tao} ${KHAI_NIEM[kn].toLowerCase()}`;
}
/** Tiêu đề "Sửa {khái niệm}". */
export function nhanSua(kn: KhaiNiemKey): string {
  return `${NHAN.sua} ${KHAI_NIEM[kn].toLowerCase()}`;
}
/** Tiêu đề "Xoá {khái niệm}". */
export function nhanXoa(kn: KhaiNiemKey): string {
  return `${NHAN.xoa} ${KHAI_NIEM[kn].toLowerCase()}`;
}
