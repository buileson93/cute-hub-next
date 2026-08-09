import { TRANG_THAI_TOKEN } from "./status-tokens";

export type TP_PRESET_ID = "co-ban" | "ky-thuat" | "quan-ly" | "day-du";

export const THANH_PHAN_PRESETS: Array<{
  id: TP_PRESET_ID;
  ten: string;
  moTa: string;
  cot: string[];
}> = [
  {
    id: "co-ban",
    ten: "Cơ bản",
    moTa: "8 cột cốt lõi phục vụ khai thác",
    cot: ["ma", "ten", "heThong", "trangThai", "thietBiMa", "thietBiSerial", "model", "viTri"],
  },
  {
    id: "ky-thuat",
    ten: "Kỹ thuật",
    moTa: "Tập trung vào P/N, Năm sản xuất và tuổi thọ",
    cot: ["ma", "ten", "pN", "namSanXuat", "tyLeTuoiTho", "tinhTrangKyThuat", "ngayBaoTriKeTiep"],
  },
  {
    id: "quan-ly",
    ten: "Quản lý tài sản",
    moTa: "Tập trung vào Bravo ID, NSX, NCC và Bảo hành",
    cot: ["ma", "ten", "maTaiSanBravo", "nhaSanXuat", "nhaCungCap", "ngayMua", "hanBaoHanh"],
  },
  {
    id: "day-du",
    ten: "Đầy đủ",
    moTa: "Tất cả các trường thông tin",
    cot: [],
  },
];
