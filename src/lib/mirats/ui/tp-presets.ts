// src/lib/mirats/ui/tp-presets.ts

import { StdColumn } from "@/components/mirats/StandardTable";
import { ThanhPhanRow } from "@/components/mirats/ThanhPhanTable";

/**
 * Định nghĩa các bộ cột mẫu cho bảng Thành phần hệ thống.
 * Giúp giảm tải 56 cột xuống các góc nhìn chuyên biệt.
 */
export const THANH_PHAN_PRESETS = [
  {
    id: "co-ban",
    label: "Cơ bản",
    columns: ["ma", "ten", "nhomHeThong", "phanLoai", "heThong", "trangThai", "daLap", "thietBiMa"]
  },
  {
    id: "ky-thuat",
    label: "Kỹ thuật",
    columns: ["ma", "ten", "model", "chungLoai", "nhaSanXuat", "pN", "thietBiSerial", "tinhTrangKyThuat"]
  },
  {
    id: "vong-doi",
    label: "Vòng đời",
    columns: ["ma", "ten", "namSanXuat", "namKhaiThac", "ngayMua", "hanBaoHanh", "tyLeTuoiTho"]
  },
  {
    id: "quan-tri",
    label: "Quản trị",
    columns: ["ma", "ten", "maTaiSanBravo", "nhaCungCap", "taiSanDonViQuanLy", "viTri", "cheDoKdHc"]
  }
];

export type TP_PRESET_ID = "co-ban" | "ky-thuat" | "vong-doi" | "quan-tri";
