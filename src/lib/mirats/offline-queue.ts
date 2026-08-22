/**
 * N11 — Hàng chờ ghi offline (pure logic).
 *
 * Không phụ thuộc IndexedDB; nhận `Storage` interface để test dùng in-memory
 * và runtime thực dùng `IndexedDBStorage` (mã UI). Handlers là map { op → fn }
 * được truyền vào để hàng chờ không import server fn trực tiếp.
 */

export type OutboxOp =
  | "su_co_create"
  | "su_co_transition"
  | "pm_complete_task"
  | "ban_giao_add_note"
  | "attach_upload"
  | "attach_link";

export type OutboxStatus = "pending" | "in_flight" | "done" | "failed" | "conflict";

export interface OutboxItem {
  id: string; // client_uuid
  op: OutboxOp;
  payload: Record<string, unknown>;
  created_at: string;
  attempts: number;
  next_attempt_at: string;
  status: OutboxStatus;
  last_error?: string;
  depends_on?: string[];
  /** entity key để giữ thứ tự tuần tự trong cùng một entity, ngay cả khi bật parallel. */
  entity_key?: string;
  /** snapshot server state khi conflict, hiển thị cho user quyết định. */
  server_state?: unknown;
}

export interface Storage {
  put(item: OutboxItem): Promise<void>;
  get(id: string): Promise<OutboxItem | undefined>;
  list(): Promise<OutboxItem[]>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
}

export interface HandlerResult {
  ok: true;
  result?: unknown;
}
export interface HandlerConflict {
  conflict: true;
  server_state: unknown;
}
export type HandlerReturn = HandlerResult | HandlerConflict;
export type Handler = (payload: Record<string, unknown>) => Promise<HandlerReturn>;
export type HandlerMap = Partial<Record<OutboxOp, Handler>>;

export interface FlushOptions {
  /** Số item chạy song song. Trong cùng entity_key luôn tuần tự. */
  concurrency?: number;
  /** Trần retry (§4.4 spec = 8). */
  maxAttempts?: number;
  /** Chuẩn hoá "now" để test. */
  now?: () => Date;
}

export interface EnqueueInput {
  op: OutboxOp;
  payload: Record<string, unknown>;
  depends_on?: string[];
  entity_key?: string;
  /** Client-supplied id (uuid v4/v7). Sinh mới nếu thiếu. */
  id?: string;
}

const uuid4 = (): string => {
  // Có crypto.randomUUID trên browser/node ≥ 19.
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  // Fallback đơn giản (test-only).
  const rnd = () =>
    Math.floor(Math.random() * 0xffff)
      .toString(16)
      .padStart(4, "0");
  return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(1)}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
};

/** Backoff: min(60s, 2^attempts * 2s) + jitter ±20%. */
export function computeBackoffMs(attempts: number, seedRandom = Math.random): number {
  const base = Math.min(60_000, 2 ** attempts * 2_000);
  const jitter = (seedRandom() * 0.4 - 0.2) * base;
  return Math.max(500, Math.round(base + jitter));
}

/**
 * Nhận diện lỗi KHÔNG nên retry: RLS/permission/auth/validation. Các lỗi này
 * retry cũng không đổi kết quả → chuyển thẳng sang `failed` để user xử lý.
 */
export function isNonRetryableError(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err ?? "")).toLowerCase();
  const code = (err as { code?: string } | null)?.code ?? "";
  return (
    code === "42501" || // permission_denied
    code === "PGRST301" || // JWT expired
    code === "PGRST302" || // JWT invalid
    msg.includes("row-level security") ||
    msg.includes("permission denied") ||
    msg.includes("not authorized") ||
    msg.includes("unauthorized") ||
    msg.includes("jwt")
  );
}

/** Chuẩn hoá thông điệp lỗi hiển thị cho user. */
export function humanizeQueueError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  if (isNonRetryableError(err)) {
    const low = raw.toLowerCase();
    if (low.includes("jwt") || low.includes("unauthorized") || low.includes("not authorized")) {
      return "Phiên đăng nhập đã hết hạn — vui lòng đăng nhập lại rồi thử lại.";
    }
    return "Không có quyền thực hiện (RLS từ chối). Kiểm tra vai trò/đơn vị của bạn.";
  }
  return raw || "Lỗi không xác định.";
}

// ---------------- In-memory Storage (test) --------------------------------
export function createMemoryStorage(): Storage {
  const map = new Map<string, OutboxItem>();
  return {
    async put(item) {
      map.set(item.id, structuredCloneCompat(item));
    },
    async get(id) {
      const it = map.get(id);
      return it ? structuredCloneCompat(it) : undefined;
    },
    async list() {
      return Array.from(map.values()).map(structuredCloneCompat);
    },
    async remove(id) {
      map.delete(id);
    },
    async clear() {
      map.clear();
    },
  };
}

function structuredCloneCompat<T>(v: T): T {
  if (typeof structuredClone === "function") return structuredClone(v);
  return JSON.parse(JSON.stringify(v)) as T;
}

// ---------------- Queue ---------------------------------------------------
export class OfflineQueue {
  private inFlightEntities = new Set<string>();

  constructor(
    private storage: Storage,
    private handlers: HandlerMap,
    private opts: FlushOptions = {},
  ) {}

  async enqueue(input: EnqueueInput): Promise<OutboxItem> {
    const now = (this.opts.now ?? (() => new Date()))();
    const id = input.id ?? uuid4();
    // Nhét client_uuid vào payload nếu handler chưa có.
    const payload = { ...input.payload, client_uuid: input.payload.client_uuid ?? id };
    const item: OutboxItem = {
      id,
      op: input.op,
      payload,
      created_at: now.toISOString(),
      attempts: 0,
      next_attempt_at: now.toISOString(),
      status: "pending",
      depends_on: input.depends_on,
      entity_key: input.entity_key,
    };
    await this.storage.put(item);
    return item;
  }

  async list(): Promise<OutboxItem[]> {
    return this.storage.list();
  }

  async clearAll(): Promise<void> {
    await this.storage.clear();
  }

  /**
   * Chạy 1 lượt flush; trả về số item đã xử lý (bao gồm done + conflict + failed).
   * Gọi lặp lại từ scheduler ngoài (heartbeat / online-event).
   */
  async flushOnce(): Promise<number> {
    const now = (this.opts.now ?? (() => new Date()))();
    const nowMs = now.getTime();
    const maxAttempts = this.opts.maxAttempts ?? 8;
    const concurrency = Math.max(1, this.opts.concurrency ?? 1);

    const all = await this.storage.list();
    const byId = new Map(all.map((i) => [i.id, i] as const));

    // Lọc item sẵn sàng chạy:
    // - status = 'pending'
    // - next_attempt_at ≤ now
    // - dependencies đều 'done'
    // - entity chưa đang chạy (giữ thứ tự tuần tự trong entity)
    const ready: OutboxItem[] = [];
    for (const it of all) {
      if (it.status !== "pending") continue;
      if (new Date(it.next_attempt_at).getTime() > nowMs) continue;
      if (it.depends_on && it.depends_on.length > 0) {
        const allDone = it.depends_on.every((d) => byId.get(d)?.status === "done");
        if (!allDone) continue;
      }
      if (it.entity_key && this.inFlightEntities.has(it.entity_key)) continue;
      ready.push(it);
      if (it.entity_key) this.inFlightEntities.add(it.entity_key);
      if (ready.length >= concurrency) break;
    }
    if (ready.length === 0) return 0;

    let processed = 0;
    await Promise.all(
      ready.map(async (item) => {
        try {
          await this.runOne(item, maxAttempts);
        } finally {
          if (item.entity_key) this.inFlightEntities.delete(item.entity_key);
          processed += 1;
        }
      }),
    );
    return processed;
  }

  private async runOne(item: OutboxItem, maxAttempts: number): Promise<void> {
    const handler = this.handlers[item.op];
    const now = (this.opts.now ?? (() => new Date()))();
    if (!handler) {
      await this.storage.put({
        ...item,
        status: "failed",
        last_error: `Handler thiếu cho op=${item.op}`,
      });
      return;
    }
    await this.storage.put({ ...item, status: "in_flight" });
    try {
      const res = await handler(item.payload);
      if ("conflict" in res && res.conflict) {
        await this.storage.put({
          ...item,
          status: "conflict",
          server_state: res.server_state,
        });
        return;
      }
      await this.storage.put({ ...item, status: "done" });
    } catch (e) {
      const nonRetry = isNonRetryableError(e);
      const nextAttempts = item.attempts + 1;
      const failed = nonRetry || nextAttempts >= maxAttempts;
      const nextAt = new Date(now.getTime() + computeBackoffMs(nextAttempts));
      await this.storage.put({
        ...item,
        status: failed ? "failed" : "pending",
        attempts: nextAttempts,
        next_attempt_at: nextAt.toISOString(),
        last_error: humanizeQueueError(e),
      });
    }
  }
}
