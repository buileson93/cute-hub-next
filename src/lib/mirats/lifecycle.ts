// ============================================================================
// lifecycle.ts — MỘT NGUỒN công thức tuổi thọ / health cho tài sản (Task 12).
//
// Trước đây có 3 nguồn: cột `thiet_bi.ty_le_tuoi_tho` nhập tay, hàm
// `phanTramVongDoi`/`tuoiThoConLai`/`namThayThe` trong metrics.ts, và view
// dashboard tính lại → số lệch nhau. Module này thuần (không I/O, không phụ
// thuộc dữ liệu mẫu) và được view Postgres `v_tuoi_tho` phản chiếu — dùng
// nó ở mọi nơi để mọi trang / báo cáo / DB đều ra cùng con số.
//
// Quy ước null: thiếu dữ liệu đầu vào → trả về `null` (không phải 0), để UI
// hiển thị "—" thay vì lừa người đọc bằng số 0.
// ============================================================================

export type Loai = "A" | "B" | "C" | "D";

export interface LifecycleInput {
  namSanXuat: number | null;
  namKhaiThac: number | null;
  soSuCo: number;
  tuoiThoThietKe: number | null;
}

/** Năm gốc để tính tuổi: ưu tiên năm khai thác, dội về năm sản xuất. */
function namGoc(namSanXuat: number | null, namKhaiThac: number | null): number | null {
  if (namKhaiThac != null && namKhaiThac > 0) return namKhaiThac;
  if (namSanXuat != null && namSanXuat > 0) return namSanXuat;
  return null;
}

/** Tuổi tài sản (năm) tính đến `today`. Null nếu không đủ dữ liệu. */
export function tuoiThietBiNam(
  namSanXuat: number | null,
  namKhaiThac: number | null,
  today: Date = new Date(),
): number | null {
  const goc = namGoc(namSanXuat, namKhaiThac);
  if (goc == null) return null;
  return Math.max(0, today.getFullYear() - goc);
}

/** Phần trăm tuổi thọ đã dùng (0..100). Null nếu thiếu tuoiThoThietKe hoặc năm gốc. */
export function phanTramTuoiTho(
  input: Pick<LifecycleInput, "namSanXuat" | "namKhaiThac" | "tuoiThoThietKe">,
  today: Date = new Date(),
): number | null {
  const { tuoiThoThietKe } = input;
  if (tuoiThoThietKe == null || tuoiThoThietKe <= 0) return null;
  const age = tuoiThietBiNam(input.namSanXuat, input.namKhaiThac, today);
  if (age == null) return null;
  return Math.min(100, Math.max(0, Math.round((age / tuoiThoThietKe) * 100)));
}

/** Số năm tuổi thọ còn lại. Null nếu thiếu dữ liệu. */
export function tuoiThoConLai(
  namKhaiThac: number | null,
  tuoiThoThietKe: number | null,
  today: Date = new Date(),
): number | null {
  if (tuoiThoThietKe == null || tuoiThoThietKe <= 0) return null;
  if (namKhaiThac == null || namKhaiThac <= 0) return null;
  const age = Math.max(0, today.getFullYear() - namKhaiThac);
  return Math.max(0, Math.round((tuoiThoThietKe - age) * 10) / 10);
}

/** Năm dự kiến thay thế = năm khai thác + tuổi thọ thiết kế. Null nếu thiếu. */
export function namThayThe(
  namKhaiThac: number | null,
  tuoiThoThietKe: number | null,
): number | null {
  if (tuoiThoThietKe == null || tuoiThoThietKe <= 0) return null;
  if (namKhaiThac == null || namKhaiThac <= 0) return null;
  return namKhaiThac + tuoiThoThietKe;
}

/** Health score 0..100 + xếp loại A/B/C/D. */
export function healthScore(
  input: LifecycleInput,
  today: Date = new Date(),
): { score: number; loai: Loai } {
  const pt = phanTramTuoiTho(input, today);
  // Nếu thiếu dữ liệu tuổi thọ, coi điểm tuổi = 60 (trung tính) để không "0-hoá" tài sản.
  const diemTuoi = pt == null ? 60 : Math.max(0, 100 - pt);
  const soSuCo = Math.max(0, input.soSuCo | 0);
  const diemSuCo = Math.max(0, 100 - soSuCo * 20);
  const score = Math.max(0, Math.min(100, Math.round(0.7 * diemTuoi + 0.3 * diemSuCo)));
  const loai: Loai = score >= 80 ? "A" : score >= 60 ? "B" : score >= 40 ? "C" : "D";
  return { score, loai };
}
