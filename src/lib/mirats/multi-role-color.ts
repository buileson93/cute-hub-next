// Palette màu ổn định theo thiet_bi_id — tài sản đa vai được tô cùng màu ở
// mọi nơi (cây hệ thống, bảng thành phần, sổ lý lịch) để nhận diện nhanh.
// Chỉ áp dụng khi count ≥ 2; đơn vai để trung tính.

/** Hash 32-bit FNV-1a của chuỗi (deterministic, không phụ thuộc thứ tự). */
function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

export interface MultiRoleColor {
  /** Nền badge (đủ nhạt để đọc text). */
  bg: string;
  /** Border cùng tông. */
  border: string;
  /** Chấm màu tròn (dot marker) — dùng ở cây/bảng khi không muốn nền. */
  dot: string;
  /** Text màu đậm để in trên nền `bg`. */
  text: string;
}

/**
 * Sinh style theo hash: HSL với H đều 360°, S=70%, L khác nhau để có contrast.
 * Ổn định giữa các lần render (không random) và giữa các trang.
 */
export function colorForThietBi(thietBiId: string): MultiRoleColor {
  const h = hashStr(thietBiId) % 360;
  return {
    bg: `hsl(${h} 85% 92%)`,
    border: `hsl(${h} 60% 55%)`,
    dot: `hsl(${h} 65% 50%)`,
    text: `hsl(${h} 60% 25%)`,
  };
}
