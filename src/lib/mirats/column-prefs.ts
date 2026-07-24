// Lưu/khôi phục trạng thái ẩn–hiện cột của bảng theo TỪNG TÀI KHOẢN.
// Dùng localStorage, khóa gồm id người dùng nên mỗi account có bộ cột riêng.
// Không đụng tới nghiệp vụ/CSDL — đây thuần preference giao diện của người dùng.

const PREFIX = "mirats:colprefs:v1";

function keyFor(tableId: string, userId: string | null | undefined): string {
  return `${PREFIX}:${tableId}:${userId ?? "anon"}`;
}

/**
 * Đọc danh sách khóa cột đang hiển thị đã lưu cho tài khoản.
 * Trả về `null` nếu chưa lưu lần nào (để caller dùng bộ mặc định).
 */
export function loadColumnPrefs(
  tableId: string,
  userId: string | null | undefined,
): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(tableId, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return parsed as string[];
    }
    return null;
  } catch {
    return null;
  }
}

/** Ghi danh sách khóa cột đang hiển thị cho tài khoản. */
export function saveColumnPrefs(
  tableId: string,
  userId: string | null | undefined,
  visibleKeys: string[],
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      keyFor(tableId, userId),
      JSON.stringify(visibleKeys),
    );
  } catch {
    // Bỏ qua khi localStorage đầy hoặc bị chặn — không ảnh hưởng nghiệp vụ.
  }
}
