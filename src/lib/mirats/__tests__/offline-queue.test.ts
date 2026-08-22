import { describe, expect, it, vi } from "vitest";
import {
  OfflineQueue,
  computeBackoffMs,
  createMemoryStorage,
  type HandlerMap,
  type HandlerReturn,
} from "../offline-queue";

const ok = async (): Promise<HandlerReturn> => ({ ok: true });

describe("OfflineQueue — hàng chờ ghi offline (N11)", () => {
  it("enqueue offline: 3 mutation lưu trạng thái 'pending', chưa gọi handler", async () => {
    const storage = createMemoryStorage();
    const handler = vi.fn(ok);
    const q = new OfflineQueue(storage, { su_co_create: handler });
    await q.enqueue({ op: "su_co_create", payload: { hien_tuong: "A" } });
    await q.enqueue({ op: "su_co_create", payload: { hien_tuong: "B" } });
    await q.enqueue({ op: "su_co_create", payload: { hien_tuong: "C" } });
    expect(handler).not.toHaveBeenCalled();
    const items = await q.list();
    expect(items).toHaveLength(3);
    expect(items.every((i) => i.status === "pending")).toBe(true);
    expect(items[0].payload.client_uuid).toBeDefined();
  });

  it("flush online: handler được gọi và item chuyển sang 'done'", async () => {
    const storage = createMemoryStorage();
    const handler = vi.fn(ok);
    const handlers: HandlerMap = { su_co_create: handler };
    const q = new OfflineQueue(storage, handlers, { concurrency: 3 });
    await q.enqueue({ op: "su_co_create", payload: { x: 1 } });
    await q.enqueue({ op: "su_co_create", payload: { x: 2 } });
    const done = await q.flushOnce();
    expect(done).toBeGreaterThanOrEqual(1);
    // gọi liên tục cho tới khi hết
    while ((await q.flushOnce()) > 0) {
      /* drain */
    }
    const items = await q.list();
    expect(items.every((i) => i.status === "done")).toBe(true);
    expect(handler).toHaveBeenCalledTimes(2);
    // client_uuid có mặt trong payload gửi cho handler
    for (const call of handler.mock.calls as unknown as Array<[Record<string, unknown>]>) {
      expect(call[0].client_uuid).toBeDefined();
    }
  });

  it("depends_on: upload phải done trước link", async () => {
    const storage = createMemoryStorage();
    const uploadHandler = vi.fn(ok);
    const linkHandler = vi.fn(ok);
    const q = new OfflineQueue(
      storage,
      {
        attach_upload: uploadHandler,
        attach_link: linkHandler,
      },
      { concurrency: 5 },
    );
    const up = await q.enqueue({ op: "attach_upload", payload: { blob_id: "b1" } });
    await q.enqueue({ op: "attach_link", payload: { blob_id: "b1" }, depends_on: [up.id] });

    // Lượt 1: chỉ upload chạy (link còn chờ dependency)
    await q.flushOnce();
    expect(uploadHandler).toHaveBeenCalledTimes(1);
    expect(linkHandler).not.toHaveBeenCalled();

    // Lượt 2: link chạy
    await q.flushOnce();
    expect(linkHandler).toHaveBeenCalledTimes(1);
  });

  it("backoff: fail liên tiếp tăng attempts + next_attempt_at, cuối cùng done", async () => {
    const storage = createMemoryStorage();
    let n = 0;
    const handler = vi.fn(async () => {
      n += 1;
      if (n < 3) throw new Error("network");
      return ok();
    });
    // now cố định + dịch chuyển thời gian giả để không phải sleep thật.
    let t = new Date("2026-01-01T00:00:00Z").getTime();
    const q = new OfflineQueue(
      storage,
      { su_co_create: handler },
      {
        now: () => new Date(t),
      },
    );
    await q.enqueue({ op: "su_co_create", payload: {} });

    await q.flushOnce();
    let items = await q.list();
    expect(items[0].attempts).toBe(1);
    expect(items[0].status).toBe("pending");

    t += 5 * 60_000; // nhảy 5 phút, chắc chắn > backoff
    await q.flushOnce();
    items = await q.list();
    expect(items[0].attempts).toBe(2);

    t += 5 * 60_000;
    await q.flushOnce();
    items = await q.list();
    expect(items[0].status).toBe("done");
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("failure ceiling: sau maxAttempts → status 'failed'", async () => {
    const storage = createMemoryStorage();
    const handler = vi.fn(async () => {
      throw new Error("nope");
    });
    let t = new Date("2026-01-01T00:00:00Z").getTime();
    const q = new OfflineQueue(
      storage,
      { su_co_create: handler },
      {
        now: () => new Date(t),
        maxAttempts: 3,
      },
    );
    await q.enqueue({ op: "su_co_create", payload: {} });
    for (let i = 0; i < 5; i += 1) {
      await q.flushOnce();
      t += 5 * 60_000;
    }
    const items = await q.list();
    expect(items[0].status).toBe("failed");
    expect(items[0].attempts).toBe(3);
    expect(handler).toHaveBeenCalledTimes(3);
  });

  it("conflict: handler trả { conflict, server_state } → item 'conflict', không retry", async () => {
    const storage = createMemoryStorage();
    const handler = vi.fn(
      async (): Promise<HandlerReturn> => ({
        conflict: true,
        server_state: { trang_thai: "hoan_thanh" },
      }),
    );
    const q = new OfflineQueue(storage, { su_co_transition: handler });
    await q.enqueue({ op: "su_co_transition", payload: { from_state: "dang_xu_ly" } });
    await q.flushOnce();
    const items = await q.list();
    expect(items[0].status).toBe("conflict");
    expect(items[0].server_state).toEqual({ trang_thai: "hoan_thanh" });
    // Không retry: chạy tiếp không gọi lại handler
    const before = handler.mock.calls.length;
    await q.flushOnce();
    expect(handler.mock.calls.length).toBe(before);
  });

  it("clearAll: xoá store", async () => {
    const storage = createMemoryStorage();
    const q = new OfflineQueue(storage, { su_co_create: vi.fn(ok) });
    await q.enqueue({ op: "su_co_create", payload: {} });
    await q.clearAll();
    expect(await q.list()).toEqual([]);
  });

  it("thứ tự trong cùng entity: entity_key trùng → chỉ 1 item chạy trong 1 flushOnce", async () => {
    const storage = createMemoryStorage();
    const handler = vi.fn(ok);
    const q = new OfflineQueue(storage, { su_co_transition: handler }, { concurrency: 5 });
    await q.enqueue({ op: "su_co_transition", payload: { i: 1 }, entity_key: "sc-1" });
    await q.enqueue({ op: "su_co_transition", payload: { i: 2 }, entity_key: "sc-1" });
    await q.enqueue({ op: "su_co_transition", payload: { i: 3 }, entity_key: "sc-2" });
    const n = await q.flushOnce();
    // Lượt 1: 2 item (một per entity_key)
    expect(n).toBe(2);
  });
});

describe("computeBackoffMs", () => {
  it("tăng theo 2^n, cap ở 60s + jitter ±20%", () => {
    const fixedRandom = () => 0.5; // jitter = 0
    expect(computeBackoffMs(1, fixedRandom)).toBe(4_000);
    expect(computeBackoffMs(2, fixedRandom)).toBe(8_000);
    expect(computeBackoffMs(8, fixedRandom)).toBe(60_000); // cap
  });
});
