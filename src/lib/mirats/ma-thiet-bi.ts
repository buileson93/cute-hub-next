// ============================================================================
// Sinh MÃ THIẾT BỊ VẬT LÝ ngẫu nhiên — chỉ dùng để ĐỊNH DANH DUY NHẤT.
// Trong mô hình 3 lớp, ý nghĩa/vai trò thuộc về "Thành phần hệ thống"; tài sản
// vật lý chỉ cần một mã ổn định, không đổi khi di chuyển / đổi tên.
// Dùng bảng chữ Crockford base32 (bỏ I, O, U, L để tránh nhầm mắt/1/0).
// ============================================================================
import { supabase } from "@/integrations/supabase/client";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ"; // 32 ký tự, không I/O/U/L

/**
 * Sinh mã ngẫu nhiên dạng `TB_XXXXXXXX` (mặc định 8 ký tự → ~1.1e12 tổ hợp).
 * Thuần, không chạm CSDL → dễ test.
 */
export function genMaThietBi(prefix = "TB", len = 8): string {
  const bytes = new Uint8Array(len);
  (globalThis.crypto ?? crypto).getRandomValues(bytes);
  let s = "";
  for (let i = 0; i < len; i++) s += ALPHABET[bytes[i] % ALPHABET.length];
  return `${prefix}_${s}`;
}

/**
 * @deprecated Từ Task 14: KHÔNG sinh mã ở client. DB có trigger
 * `trg_gen_ma_thiet_bi` sinh `ma_thiet_bi` khi INSERT, và UNIQUE index
 * `ma_thiet_bi` bảo đảm không trùng ngay cả khi ghi đồng thời. Route tạo
 * tài sản nên bỏ trường `ma_thiet_bi` để DB tự sinh, rồi bắt lỗi 23505
 * bằng `laLoiTrungMa()` để hiển thị thân thiện.
 *
 * Hàm này còn giữ chỉ vì đường dẫn cũ; đừng gọi ở code mới.
 */
export async function sinhMaThietBiDuyNhat(prefix = "TB"): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const ma = genMaThietBi(prefix);
    const { data } = await supabase
      .from("thiet_bi")
      .select("ma_thiet_bi")
      .eq("ma_thiet_bi", ma)
      .maybeSingle();
    if (!data) return ma;
  }
  throw new Error("Không sinh được mã tài sản duy nhất, vui lòng thử lại");
}

/**
 * Nhận diện lỗi trùng khoá duy nhất từ Supabase/Postgres (unique_violation
 * = SQLSTATE 23505) và tách theo cột trùng.
 *
 * `constraint` là tên index/constraint bị vi phạm:
 *  - `uq_thiet_bi_serial` → trùng số serial
 *  - `thiet_bi_ma_thiet_bi_key` / `thiet_bi_pkey` → trùng mã tài sản
 */
export interface LoiTrungThietBi {
  truong: "ma_serial" | "ma_thiet_bi" | "khac";
  message: string;
}

export function nhanDienLoiTrungThietBi(err: unknown): LoiTrungThietBi | null {
  if (!err || typeof err !== "object") return null;
  const e = err as { code?: string; message?: string; details?: string };
  if (e.code !== "23505") return null;
  const hay = `${e.message ?? ""} ${e.details ?? ""}`.toLowerCase();
  if (hay.includes("uq_thiet_bi_serial") || hay.includes("ma_serial")) {
    return { truong: "ma_serial", message: "Số serial đã tồn tại — vui lòng nhập serial khác." };
  }
  if (hay.includes("ma_thiet_bi")) {
    return { truong: "ma_thiet_bi", message: "Mã tài sản đã tồn tại — vui lòng đặt mã khác." };
  }
  return { truong: "khac", message: e.message ?? "Trùng dữ liệu duy nhất" };
}

// ============================================================================
// Sinh MÃ THÀNH PHẦN HỆ THỐNG (vai trò / vị trí chức năng) ngẫu nhiên.
// Mã CHỈ để định danh DUY NHẤT một vai trò trong hệ thống — KHÔNG mang ý nghĩa,
// vì ý nghĩa đã nằm ở TÊN thành phần. Mã ngẫu nhiên tránh việc mã "có nghĩa" bị
// lệch khi vai trò đổi tên, và tránh trùng lặp khi khai nhiều vị trí giống nhau.
// ============================================================================

/** Sinh mã ngẫu nhiên dạng `TPHT_XXXXXXXX` cho thành phần hệ thống. Thuần, dễ test. */
export function genMaThanhPhan(prefix = "TPHT", len = 8): string {
  return genMaThietBi(prefix, len);
}

/** Sinh mã thành phần hệ thống đảm bảo CHƯA tồn tại trong he_thong_thanh_phan. */
export async function sinhMaThanhPhanDuyNhat(prefix = "TPHT"): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const ma = genMaThanhPhan(prefix);
    const { data } = await supabase
      .from("he_thong_thanh_phan")
      .select("ma_thanh_phan")
      .eq("ma_thanh_phan", ma)
      .maybeSingle();
    if (!data) return ma;
  }
  throw new Error("Không sinh được mã thành phần duy nhất, vui lòng thử lại");
}

