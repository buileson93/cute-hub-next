// ============================================================================
// Tiện ích lấy vị trí GPS của tài sản (dùng cho chụp ảnh, check-in/out…).
// Bọc navigator.geolocation trong Promise có timeout để dễ dùng với async/await.
// ============================================================================

export type ViTriGps = {
  vi_do: number; // latitude
  kinh_do: number; // longitude
  do_chinh_xac: number | null; // accuracy (mét)
  chup_luc: string; // ISO timestamp lúc lấy vị trí
};

export type GpsError =
  | "khong-ho-tro" // trình duyệt không hỗ trợ
  | "tu-choi" // người dùng từ chối quyền
  | "khong-lay-duoc" // không xác định được vị trí
  | "het-gio"; // quá thời gian chờ

/** Trạng thái quyền GPS hiện tại (nếu trình duyệt hỗ trợ Permissions API). */
export async function trangThaiQuyenGps(): Promise<"granted" | "denied" | "prompt" | "khong-ro"> {
  try {
    if (!("permissions" in navigator)) return "khong-ro";
    const st = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return st.state as "granted" | "denied" | "prompt";
  } catch {
    return "khong-ro";
  }
}

/**
 * Lấy vị trí GPS hiện tại. PHẢI được gọi từ tương tác người dùng (click) để
 * trình duyệt hiện hộp xin quyền. Trả về null nếu không lấy được (kèm lý do qua onError).
 */
export function layViTriGps(opts?: {
  timeoutMs?: number;
  onError?: (loi: GpsError) => void;
}): Promise<ViTriGps | null> {
  const { timeoutMs = 12000, onError } = opts ?? {};
  return new Promise((resolve) => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      onError?.("khong-ho-tro");
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          vi_do: pos.coords.latitude,
          kinh_do: pos.coords.longitude,
          do_chinh_xac: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
          chup_luc: new Date(pos.timestamp || Date.now()).toISOString(),
        });
      },
      (err) => {
        const loi: GpsError =
          err.code === err.PERMISSION_DENIED
            ? "tu-choi"
            : err.code === err.TIMEOUT
              ? "het-gio"
              : "khong-lay-duoc";
        onError?.(loi);
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 30000 },
    );
  });
}

/** Chuỗi toạ độ ngắn gọn để hiển thị. */
export function dinhDangToaDo(vi_do?: number | null, kinh_do?: number | null): string | null {
  if (vi_do == null || kinh_do == null) return null;
  return `${vi_do.toFixed(6)}, ${kinh_do.toFixed(6)}`;
}

/** Link mở vị trí trên Google Maps. */
export function linkGoogleMaps(vi_do: number, kinh_do: number): string {
  return `https://www.google.com/maps?q=${vi_do},${kinh_do}`;
}

/**
 * Lấy thời gian máy chủ (chính xác, không phụ thuộc đồng hồ tài sản).
 * Gọi RPC `thoi_gian_may_chu`; nếu lỗi thì lùi về giờ máy để không chặn luồng.
 */
export async function layThoiGianMayChu(): Promise<string> {
  const { supabase } = await import("@/integrations/backend/client");
  try {
    const { data, error } = await supabase.rpc("thoi_gian_may_chu");
    if (error || !data) throw error ?? new Error("no data");
    return new Date(data as string).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Kiểm tra tài sản có phải điện thoại/máy tính bảng (có camera sau) hay không.
 * Dùng để chỉ cho phép tính năng chụp ảnh check-in trên di động.
 */
export function laThietBiDiDong(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  const coiPham = /android|iphone|ipad|ipod|iemobile|blackberry|opera mini|mobile/i.test(ua);
  const camCam = typeof navigator.mediaDevices?.getUserMedia === "function";
  return coiPham && camCam;
}

/** Một điểm GPS gắn với ảnh check-in (dùng cho bản đồ, lịch sử, xuất CSV). */
export type DiemCheckin = {
  id: string;
  ten_tep: string;
  vi_do: number;
  kinh_do: number;
  do_chinh_xac: number | null;
  chup_luc: string | null;
  created_at: string;
  nguoi?: string | null;
};

/** Bao một giá trị cho ô CSV (bọc dấu ngoặc kép, thoát dấu "). */
function oCsv(v: unknown): string {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Tạo nội dung CSV từ danh sách điểm check-in GPS. */
export function taoCsvCheckin(diem: DiemCheckin[]): string {
  const header = [
    "ma_diem",
    "ten_tep",
    "vi_do",
    "kinh_do",
    "do_chinh_xac_m",
    "chup_luc",
    "google_maps",
    "nguoi",
  ];
  const rows = diem.map((d) =>
    [
      d.id,
      d.ten_tep,
      d.vi_do,
      d.kinh_do,
      d.do_chinh_xac ?? "",
      d.chup_luc ?? d.created_at,
      linkGoogleMaps(d.vi_do, d.kinh_do),
      d.nguoi ?? "",
    ]
      .map(oCsv)
      .join(","),
  );
  return "\uFEFF" + [header.join(","), ...rows].join("\r\n");
}

/** Tải một chuỗi CSV về máy dưới dạng tệp .csv. */
export function taiCsv(tenTep: string, noiDung: string) {
  const blob = new Blob([noiDung], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = tenTep.endsWith(".csv") ? tenTep : `${tenTep}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
