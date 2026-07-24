// ============================================================================
// Bộ giải nhận dạng tài sản cho SỔ LÝ LỊCH (record book).
//
// Nguyên tắc dữ liệu (theo yêu cầu):
//   1. Ưu tiên LIÊN KẾT HIỆN TẠI (join theo khoá ngoại thiet_bi.id) — nguồn chuẩn.
//   2. Nếu liên kết đã mất/đổi (tài sản bị tháo, nghỉ khai thác, xoá liên kết)
//      → DỰ PHÒNG bằng ẢNH CHỤP (snapshot_*) do CSDL đóng băng lúc ghi nhận.
//   3. Cuối cùng mới dùng trường text lịch sử (thiet_bi) cho dữ liệu cũ.
//
// Hàm THUẦN (pure) để dễ kiểm thử; không phụ thuộc React hay Supabase.
// ============================================================================

import type { DeviceIdentitySnapshot } from "@/lib/mirats/types";

/** Nguồn nhận dạng đã dùng để giải — phục vụ hiển thị & kiểm thử. */
export type IdentitySource = "live" | "snapshot" | "text" | "unknown";

export interface ResolvedIdentity {
  ma: string;
  ten: string;
  heThong: string;
  donVi: string;
  viTri: string;
  /** Nguồn gốc dữ liệu nhận dạng đã chọn. */
  source: IdentitySource;
}

/** Thông tin tài sản "sống" tra được từ CSDL hiện tại (join khoá ngoại). */
export interface LiveDeviceInfo {
  ma_thiet_bi?: string | null;
  ten?: string | null;
  he_thong?: string | null;
  don_vi?: string | null;
  vi_tri?: string | null;
}

/** Bản ghi sổ lý lịch tối thiểu cần để giải nhận dạng. */
export interface RecordIdentityInput extends DeviceIdentitySnapshot {
  /** Khoá ngoại UUID tới thiet_bi.id (nếu có). */
  deviceId?: string | null;
  /** Mã/tên tài sản dạng text lịch sử (dữ liệu cũ). */
  deviceText?: string | null;
}

function clean(v: unknown): string {
  return typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
}

/**
 * Giải nhận dạng tài sản cho một bản ghi sổ lý lịch.
 * @param rec     Bản ghi (chứa deviceId, snapshot_*, deviceText).
 * @param getLive Hàm tra tài sản sống theo id; trả undefined nếu không còn.
 */
export function resolveDeviceIdentity(
  rec: RecordIdentityInput,
  getLive?: (id: string) => LiveDeviceInfo | undefined,
): ResolvedIdentity {
  // 1) Liên kết hiện tại (nguồn chuẩn)
  const id = clean(rec.deviceId);
  if (id && getLive) {
    const live = getLive(id);
    if (live && (clean(live.ma_thiet_bi) || clean(live.ten))) {
      return {
        ma: clean(live.ma_thiet_bi),
        ten: clean(live.ten),
        heThong: clean(live.he_thong),
        donVi: clean(live.don_vi),
        viTri: clean(live.vi_tri),
        source: "live",
      };
    }
  }

  // 2) Ảnh chụp đóng băng (dự phòng khi mất liên kết)
  const snapMa = clean(rec.snapshot_ma_thiet_bi);
  const snapTen = clean(rec.snapshot_ten_thiet_bi);
  if (snapMa || snapTen) {
    return {
      ma: snapMa,
      ten: snapTen,
      heThong: clean(rec.snapshot_he_thong),
      donVi: clean(rec.snapshot_don_vi),
      viTri: clean(rec.snapshot_vi_tri),
      source: "snapshot",
    };
  }

  // 3) Trường text lịch sử (dữ liệu cũ)
  const text = clean(rec.deviceText);
  if (text) {
    return { ma: text, ten: "", heThong: "", donVi: "", viTri: "", source: "text" };
  }

  return { ma: "", ten: "", heThong: "", donVi: "", viTri: "", source: "unknown" };
}
