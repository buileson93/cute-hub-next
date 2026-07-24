import { useCallback, useEffect, useRef, useState } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

// Task 39 — Banner "mất kết nối" nhưng chỉ hiện khi đã XÁC MINH có lỗi mạng
// thật (ping backend fail), không dựa mù vào navigator.onLine (hay báo nhầm
// trong preview iframe / tab bị sleep). Kèm mã lỗi + nút Thử lại để không
// còn là cảnh báo mơ hồ.

const PING_URL = `${import.meta.env.VITE_SUPABASE_URL ?? ""}/auth/v1/health`;
const CHECK_DELAY_MS = 1500; // debounce nhấp nháy
const RECHECK_MS = 8000;

type Trang = "on" | "checking" | "off";

async function pingBackend(): Promise<{ ok: boolean; detail: string }> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(PING_URL, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    // 2xx/4xx đều = backend sống (401 là bình thường khi thiếu apikey)
    return { ok: r.status < 500, detail: `HTTP ${r.status}` };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, detail: msg };
  }
}

export function OfflineBanner() {
  const [trang, setTrang] = useState<Trang>("on");
  const [chiTiet, setChiTiet] = useState<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const kiemTra = useCallback(async () => {
    setTrang("checking");
    const { ok, detail } = await pingBackend();
    if (ok) {
      setTrang("on");
      setChiTiet("");
    } else {
      setTrang("off");
      setChiTiet(detail);
    }
  }, []);

  useEffect(() => {
    const onOffline = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => void kiemTra(), CHECK_DELAY_MS);
    };
    const onOnline = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void kiemTra();
    };
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [kiemTra]);

  // Khi đang offline, tự ping lại định kỳ để tự ẩn khi mạng phục hồi
  useEffect(() => {
    if (trang !== "off") return;
    const id = setInterval(() => void kiemTra(), RECHECK_MS);
    return () => clearInterval(id);
  }, [trang, kiemTra]);

  if (trang !== "off") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-3 rounded-full border border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs font-medium text-amber-900 shadow-lg backdrop-blur dark:text-amber-200"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden />
      <span>
        Không gọi được backend
        {chiTiet ? ` — ${chiTiet}` : ""}
      </span>
      <button
        type="button"
        onClick={() => void kiemTra()}
        className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 hover:bg-amber-500/30"
      >
        <RefreshCw className="h-3 w-3" aria-hidden />
        Thử lại
      </button>
    </div>
  );
}
