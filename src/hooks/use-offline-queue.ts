import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  OfflineQueue,
  type HandlerMap,
  type OutboxItem,
  type Storage,
} from "@/lib/mirats/offline-queue";

/**
 * N11 — Hook UI cho hàng chờ offline.
 *
 * Adapter storage mặc định = sessionStorage (an toàn cho SSR + preview). Runtime
 * production sẽ swap sang IndexedDB adapter — API không đổi.
 *
 * Cơ chế đồng bộ:
 *  - Poll trạng thái mỗi 15s (nhẹ, chỉ đọc storage).
 *  - Nghe sự kiện `online` của trình duyệt → flush ngay, không đợi tick.
 *  - Khi số item `done`/`failed`/`conflict` tăng, phát toast tương ứng để user
 *    biết đồng bộ thành công hay có lỗi (kèm thông điệp đã humanize).
 */

class SessionStorageAdapter implements Storage {
  private key = "mirats_offline_v1";
  private read(): OutboxItem[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.sessionStorage.getItem(this.key);
      return raw ? (JSON.parse(raw) as OutboxItem[]) : [];
    } catch { return []; }
  }
  private write(items: OutboxItem[]) {
    if (typeof window === "undefined") return;
    try { window.sessionStorage.setItem(this.key, JSON.stringify(items)); } catch { /* ignore */ }
  }
  async put(item: OutboxItem) {
    const list = this.read();
    const idx = list.findIndex((i) => i.id === item.id);
    if (idx >= 0) list[idx] = item; else list.push(item);
    this.write(list);
  }
  async get(id: string) { return this.read().find((i) => i.id === id); }
  async list() { return this.read(); }
  async remove(id: string) { this.write(this.read().filter((i) => i.id !== id)); }
  async clear() { this.write([]); }
}

let sharedQueue: OfflineQueue | null = null;

export function getOfflineQueue(handlers: HandlerMap = {}): OfflineQueue {
  if (!sharedQueue) {
    sharedQueue = new OfflineQueue(new SessionStorageAdapter(), handlers);
  }
  return sharedQueue;
}

export interface OfflineStatus {
  online: boolean;
  pending: number;
  in_flight: number;
  failed: number;
  conflict: number;
  done: number;
  total: number;
}

/** Kiểu snapshot rút gọn để đối chiếu delta giữa các tick. */
interface CountSnapshot {
  pending: number;
  in_flight: number;
  failed: number;
  conflict: number;
  done: number;
  total: number;
}

function countStatuses(items: OutboxItem[]): CountSnapshot {
  const c: CountSnapshot = { pending: 0, in_flight: 0, failed: 0, conflict: 0, done: 0, total: items.length };
  for (const i of items) {
    if (i.status === "pending") c.pending += 1;
    else if (i.status === "in_flight") c.in_flight += 1;
    else if (i.status === "failed") c.failed += 1;
    else if (i.status === "conflict") c.conflict += 1;
    else if (i.status === "done") c.done += 1;
  }
  return c;
}

export function useOfflineStatus(): OfflineStatus {
  const [online, setOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [status, setStatus] = useState<CountSnapshot>({
    pending: 0, in_flight: 0, failed: 0, conflict: 0, done: 0, total: 0,
  });
  const prevRef = useRef<CountSnapshot | null>(null);
  const firstTickRef = useRef(true);
  const lastErrorRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = getOfflineQueue();
    let alive = true;
    let flushing = false;

    const runFlush = async () => {
      if (flushing) return;
      flushing = true;
      try {
        // Vòng lặp có bảo vệ: mỗi lượt flushOnce trả về 0 khi hết việc.
        for (let guard = 0; guard < 32; guard += 1) {
          const n = await q.flushOnce();
          if (n === 0) break;
        }
      } catch {
        /* nuốt — chi tiết lỗi đã ghi vào last_error của item */
      } finally {
        flushing = false;
      }
    };

    const tick = async () => {
      const items = await q.list();
      if (!alive) return;
      const next = countStatuses(items);
      // Phát toast dựa trên delta để không spam mỗi tick.
      const prev = prevRef.current;
      if (prev && !firstTickRef.current) {
        const newlyDone = next.done - prev.done;
        const newlyFailed = next.failed - prev.failed;
        const newlyConflict = next.conflict - prev.conflict;
        if (newlyDone > 0) toast.success(`Đã đồng bộ ${newlyDone} thao tác offline`);
        if (newlyFailed > 0) {
          // Lấy thông điệp lỗi mới nhất để hiển thị đúng nguyên nhân.
          const latestFailed = items
            .filter((i) => i.status === "failed" && i.last_error)
            .sort((a, b) => (a.next_attempt_at < b.next_attempt_at ? 1 : -1))[0];
          const msg = latestFailed?.last_error ?? "Có thao tác không thể đồng bộ";
          if (msg !== lastErrorRef.current) {
            toast.error(`Đồng bộ thất bại (${newlyFailed}): ${msg}`, {
              description: "Mở trang Ngoại tuyến để xem chi tiết và thử lại.",
            });
            lastErrorRef.current = msg;
          }
        }
        if (newlyConflict > 0) {
          toast.warning(`${newlyConflict} thao tác cần xử lý xung đột với dữ liệu server`);
        }
      }
      prevRef.current = next;
      firstTickRef.current = false;
      setStatus(next);
    };

    const onOnline = () => {
      setOnline(true);
      toast.info("Đã có mạng lại — đang đồng bộ hàng chờ…");
      void runFlush().then(tick);
    };
    const onOffline = () => {
      setOnline(false);
      toast.warning("Mất kết nối — thao tác sẽ được xếp hàng để đồng bộ sau.");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // Tick ban đầu + interval + flush nếu đang online.
    const loop = async () => {
      await tick();
      if (alive && navigator.onLine) {
        await runFlush();
        await tick();
      }
    };
    void loop();
    const id = window.setInterval(loop, 15_000);

    return () => {
      alive = false;
      window.clearInterval(id);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return { online, ...status };
}
