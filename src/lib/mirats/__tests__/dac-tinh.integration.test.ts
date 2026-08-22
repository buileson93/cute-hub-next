// ============================================================================
// Test tích hợp: xác minh chuỗi CHỌN/BỎ nhãn tài sản của Mẫu → INSERT/DELETE
// vào dm_model_dac_tinh đúng và KHÔNG bị nhân đôi.
//
// Không cần mock supabase-js đầy đủ: mô phỏng bảng M:N như một tập
// (Set<`${model_id}::${dac_tinh_id}`>) rồi áp diff. Đảm bảo unique key
// (model_id, dac_tinh_id) — thao tác lặp lại không sinh dòng thừa.
// ============================================================================
import { describe, it, expect, beforeEach } from "vitest";
import { diffModelDacTinh } from "../dac-tinh";

/** Bảng M:N giả lập với ràng buộc unique(model_id, dac_tinh_id). */
class FakeModelDacTinhTable {
  private rows = new Set<string>();
  key(m: string, d: string) {
    return `${m}::${d}`;
  }
  size() {
    return this.rows.size;
  }
  list(modelId: string): string[] {
    const prefix = `${modelId}::`;
    return [...this.rows]
      .filter((k) => k.startsWith(prefix))
      .map((k) => k.slice(prefix.length))
      .sort();
  }
  insert(modelId: string, dacTinhIds: string[]) {
    // Ràng buộc UNIQUE — chèn lặp lại sẽ ném lỗi như Postgres.
    for (const d of dacTinhIds) {
      const k = this.key(modelId, d);
      if (this.rows.has(k))
        throw new Error(`duplicate key value violates unique constraint (${modelId}, ${d})`);
      this.rows.add(k);
    }
  }
  delete(modelId: string, dacTinhIds: string[]) {
    for (const d of dacTinhIds) this.rows.delete(this.key(modelId, d));
  }
}

/** Đúng luồng ở _app.danh-muc.model.tsx: đọc prev → diff → delete → insert. */
async function apDungDongBoDacTinh(bang: FakeModelDacTinhTable, modelId: string, next: string[]) {
  const prev = bang.list(modelId);
  const { toInsert, toDelete } = diffModelDacTinh(prev, next);
  if (toDelete.length) bang.delete(modelId, toDelete);
  if (toInsert.length) bang.insert(modelId, toInsert);
  return { prev, next, toInsert, toDelete };
}

describe("Đồng bộ dm_model_dac_tinh (M:N) — integration", () => {
  const MODEL = "model-A";
  let bang: FakeModelDacTinhTable;

  beforeEach(() => {
    bang = new FakeModelDacTinhTable();
  });

  it("chọn lần đầu: chỉ INSERT, không DELETE", async () => {
    const r = await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt2"]);
    expect(r.toInsert.sort()).toEqual(["dt1", "dt2"]);
    expect(r.toDelete).toEqual([]);
    expect(bang.list(MODEL)).toEqual(["dt1", "dt2"]);
    expect(bang.size()).toBe(2);
  });

  it("bỏ 1 tag: chỉ DELETE tag đó, giữ các tag còn lại", async () => {
    await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt2", "dt3"]);
    const r = await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt3"]);
    expect(r.toDelete).toEqual(["dt2"]);
    expect(r.toInsert).toEqual([]);
    expect(bang.list(MODEL)).toEqual(["dt1", "dt3"]);
  });

  it("đổi hoàn toàn: DELETE tag cũ + INSERT tag mới, không đụng tag trùng", async () => {
    await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt2"]);
    const r = await apDungDongBoDacTinh(bang, MODEL, ["dt2", "dt3", "dt4"]);
    expect(r.toDelete).toEqual(["dt1"]);
    expect(r.toInsert.sort()).toEqual(["dt3", "dt4"]);
    expect(bang.list(MODEL)).toEqual(["dt2", "dt3", "dt4"]);
  });

  it("idempotent: lưu cùng danh sách 3 lần không nhân đôi và không ném UNIQUE", async () => {
    const target = ["dt1", "dt2", "dt3"];
    for (let i = 0; i < 3; i++) {
      const r = await apDungDongBoDacTinh(bang, MODEL, target);
      if (i > 0) {
        expect(r.toInsert).toEqual([]);
        expect(r.toDelete).toEqual([]);
      }
    }
    expect(bang.list(MODEL)).toEqual(target);
    expect(bang.size()).toBe(3);
  });

  it("đầu vào chứa id trùng: chỉ chèn duy nhất một lần (không vi phạm UNIQUE)", async () => {
    // UI có thể lỡ đẩy id trùng — diff phải dedupe trước khi ghi.
    const r = await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt1", "dt2", "dt2"]);
    expect(r.toInsert.sort()).toEqual(["dt1", "dt2"]);
    expect(bang.list(MODEL)).toEqual(["dt1", "dt2"]);
  });

  it("bỏ toàn bộ: DELETE hết, bảng trống cho model đó", async () => {
    await apDungDongBoDacTinh(bang, MODEL, ["dt1", "dt2"]);
    const r = await apDungDongBoDacTinh(bang, MODEL, []);
    expect(r.toDelete.sort()).toEqual(["dt1", "dt2"]);
    expect(r.toInsert).toEqual([]);
    expect(bang.list(MODEL)).toEqual([]);
  });

  it("không ảnh hưởng model khác: sync model A không đụng model B", async () => {
    await apDungDongBoDacTinh(bang, "model-A", ["dt1", "dt2"]);
    await apDungDongBoDacTinh(bang, "model-B", ["dt2", "dt3"]);
    await apDungDongBoDacTinh(bang, "model-A", ["dt2"]); // bỏ dt1 của A
    expect(bang.list("model-A")).toEqual(["dt2"]);
    expect(bang.list("model-B")).toEqual(["dt2", "dt3"]); // B nguyên vẹn
  });
});
