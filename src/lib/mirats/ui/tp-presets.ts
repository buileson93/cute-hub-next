// src/lib/mirats/ui/tp-presets.ts

import { ViewPreset } from "./view-presets";

/**
 * Định nghĩa các bộ cột mẫu cho bảng Thành phần hệ thống.
 * Giúp giảm tải 56 cột xuống các góc nhìn chuyên biệt.
 */
export const THANH_PHAN_PRESETS: ViewPreset[] = [
  {
    id: "co-ban",
    ten: "Cơ bản",
    moTa: "Các thông tin nhận diện, hệ thống và trạng thái lắp",
    columns: ["ten", "nhomHeThong", "phanLoai", "heThong", "trangThai", "thietBi"]
  },
  {
    id: "ky-thuat",
    ten: "Kỹ thuật",
    moTa: "Thông tin chi tiết về Model, Serial, P/N và tình trạng kỹ thuật",
    columns: ["ten", "model", "chungLoai", "nhaSanXuat", "pN", "thietBiSerial", "tinhTrangKyThuat"]
  },
  {
    id: "vong-doi",
    ten: "Vòng đời",
    moTa: "Thông tin thời gian khai thác, bảo hành và sức khỏe tài sản",
    columns: ["ten", "namSanXuat", "namKhaiThac", "ngayMua", "hanBaoHanh", "tyLeTuoiTho"]
  },
  {
    id: "quan-tri",
    ten: "Quản trị",
    moTa: "Thông tin mã Bravo, NCC, đơn vị quản lý và vị trí",
    columns: ["ma", "ten", "maTaiSanBravo", "nhaCungCap", "taiSanDonViQuanLy", "viTri", "cheDoKdHc"]
  },
  {
    id: "day-du",
    ten: "Đầy đủ",
    moTa: "Hiển thị toàn bộ các cột thông tin có sẵn",
    columns: []
  }
];

export type TP_PRESET_ID = "co-ban" | "ky-thuat" | "vong-doi" | "quan-tri" | "day-du";
