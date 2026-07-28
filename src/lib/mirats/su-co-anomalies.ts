// Kiểm tra bất thường/logic của form Sự cố — chạy client-side, không phụ thuộc network.
// Trả về danh sách anomaly kèm severity + trường liên quan để form highlight.

export type AnomalySeverity = "error" | "warn";

export type AnomalyCode =
  | "end_before_start"
  | "no_component_match"
  | "muc_do_mismatch"
  | "missing_start_time"
  | "future_start_time"
  | "assets_empty";

export interface Anomaly {
  code: AnomalyCode;
  severity: AnomalySeverity;
  message: string;
  fields: string[]; // ["thoi_gian_ket_thuc", …] — form dùng để highlight
  hint?: string;
}

export interface AnomalyInput {
  thoiGianBatDau: string; // "YYYY-MM-DDTHH:mm"
  thoiGianKetThuc: string;
  phanLoai: string; // A..E
  anhHuongDhb: string; // "Không ảnh hưởng" | "Ảnh hưởng một phần" | "Có gián đoạn ĐHB"
  heThongId: string;
  selectedTpCount: number;
  mountedAssetsCount: number;
}

function isFuture(iso: string, now = new Date()): boolean {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t > now.getTime() + 60_000; // tolerance 1'
}

/** Bảng chuẩn: phân loại ↔ ảnh hưởng ĐHB.  */
const IMPACT_BY_LEVEL: Record<string, string[]> = {
  A: ["Có gián đoạn ĐHB", "Ảnh hưởng một phần"], // A nghiêm trọng — hầu như luôn ảnh hưởng
  B: ["Có gián đoạn ĐHB"],
  C: ["Ảnh hưởng một phần"],
  D: ["Không ảnh hưởng", "Ảnh hưởng một phần"],
  E: ["Không ảnh hưởng"],
};

/**
 * Kiểm tra tất cả bất thường cho form Sự cố mới.
 * KHÔNG chặn lưu — chỉ hiển thị cảnh báo. `validateBeforeSave` mới là gate chặn.
 */
export function detectSuCoAnomalies(input: AnomalyInput, now = new Date()): Anomaly[] {
  const out: Anomaly[] = [];

  // 1) end_before_start
  if (input.thoiGianBatDau && input.thoiGianKetThuc) {
    const a = new Date(input.thoiGianBatDau).getTime();
    const b = new Date(input.thoiGianKetThuc).getTime();
    if (Number.isFinite(a) && Number.isFinite(b) && b < a) {
      out.push({
        code: "end_before_start",
        severity: "error",
        message: "Thời gian kết thúc sớm hơn thời gian bắt đầu",
        fields: ["thoi_gian_bat_dau", "thoi_gian_ket_thuc"],
        hint: "Kiểm tra lại ngày/giờ — có thể nhầm giờ Z (UTC) với giờ địa phương.",
      });
    }
  }

  // 2) missing_start_time (đã có mô tả nhưng chưa nhập giờ bắt đầu)
  if (!input.thoiGianBatDau) {
    out.push({
      code: "missing_start_time",
      severity: "warn",
      message: "Chưa có thời gian bắt đầu sự cố",
      fields: ["thoi_gian_bat_dau"],
      hint: "Cần cho thống kê MTBF/downtime. Nếu chưa rõ, ước lượng theo lần khai thác cuối cùng.",
    });
  } else if (isFuture(input.thoiGianBatDau, now)) {
    out.push({
      code: "future_start_time",
      severity: "warn",
      message: "Thời gian bắt đầu nằm ở tương lai",
      fields: ["thoi_gian_bat_dau"],
      hint: "Có thể nhầm định dạng ngày (mm/dd vs dd/mm).",
    });
  }

  // 3) no_component_match
  if (input.heThongId && input.selectedTpCount === 0) {
    out.push({
      code: "no_component_match",
      severity: "error",
      message: "Đã chọn hệ thống nhưng chưa gán thành phần nào bị ảnh hưởng",
      fields: ["thanh_phan"],
      hint: "Sự cố phải quy về thành phần cụ thể để tính chỉ số vận hành.",
    });
  }

  // 4) assets_empty
  if (input.selectedTpCount > 0 && input.mountedAssetsCount === 0) {
    out.push({
      code: "assets_empty",
      severity: "warn",
      message: "Các thành phần đã chọn chưa lắp tài sản nào",
      fields: ["thanh_phan"],
      hint: "Kiểm tra khai báo lắp đặt trong Sổ lý lịch trước khi đóng sự cố.",
    });
  }

  // 5) muc_do_mismatch
  const allowed = IMPACT_BY_LEVEL[input.phanLoai];
  if (allowed && input.anhHuongDhb && !allowed.includes(input.anhHuongDhb)) {
    out.push({
      code: "muc_do_mismatch",
      severity: "warn",
      message: `Phân loại ${input.phanLoai} thường đi kèm ${allowed.join(" / ")} — hiện chọn "${input.anhHuongDhb}"`,
      fields: ["phan_loai", "anh_huong_dhb"],
      hint: "Rà lại mức ảnh hưởng ĐHB hoặc điều chỉnh phân loại A..E cho khớp.",
    });
  }

  return out;
}

export function anomalyFieldSet(items: Anomaly[]): Set<string> {
  const s = new Set<string>();
  for (const a of items) for (const f of a.fields) s.add(f);
  return s;
}
