import { describe, it, expect } from "vitest";
import { summarizeRollbackPreview, actionLabel, type RollbackPreview } from "../rollback-preview";

function item(over: Partial<RollbackPreview["items"][number]>) {
  return {
    item_id: crypto.randomUUID(),
    row_index: 1,
    action: "create",
    target_table: "dm_he_thong",
    target_id: crypto.randomUUID(),
    can_rollback: true,
    reason: null,
    ...over,
  };
}

describe("summarizeRollbackPreview", () => {
  it("trả về rỗng an toàn khi preview null/undefined", () => {
    const s = summarizeRollbackPreview(null);
    expect(s.total).toBe(0);
    expect(s.hasBlocked).toBe(false);
    expect(s.canProceed).toBe(false);
    expect(s.blocked).toEqual([]);
  });

  it("tách dòng có thể hoàn tác và dòng bị chặn", () => {
    const preview: RollbackPreview = {
      total: 3,
      can: 2,
      cannot: 1,
      items: [
        item({ can_rollback: true }),
        item({ can_rollback: true, action: "update" }),
        item({ can_rollback: false, reason: "Bản ghi có lịch sử", action: "create" }),
      ],
    };
    const s = summarizeRollbackPreview(preview);
    expect(s.total).toBe(3);
    expect(s.canCount).toBe(2);
    expect(s.cannotCount).toBe(1);
    expect(s.hasBlocked).toBe(true);
    expect(s.canProceed).toBe(true);
    expect(s.blocked).toHaveLength(1);
    expect(s.blocked[0].reason).toBe("Bản ghi có lịch sử");
  });

  it("canProceed=false khi mọi dòng đều bị chặn", () => {
    const preview: RollbackPreview = {
      total: 2,
      can: 0,
      cannot: 2,
      items: [
        item({ can_rollback: false, reason: "Có dữ liệu phụ thuộc" }),
        item({ can_rollback: false, reason: "Bản ghi đích không còn tồn tại" }),
      ],
    };
    const s = summarizeRollbackPreview(preview);
    expect(s.canProceed).toBe(false);
    expect(s.hasBlocked).toBe(true);
    expect(s.blocked).toHaveLength(2);
  });

  it("tự đếm khi thiếu can/cannot trong payload", () => {
    const preview = {
      total: 0,
      items: [item({ can_rollback: true }), item({ can_rollback: false })],
    } as unknown as RollbackPreview;
    const s = summarizeRollbackPreview(preview);
    expect(s.canCount).toBe(1);
    expect(s.cannotCount).toBe(1);
  });
});

describe("actionLabel", () => {
  it("dịch các action đã biết", () => {
    expect(actionLabel("create")).toBe("Tạo mới");
    expect(actionLabel("update")).toBe("Cập nhật");
    expect(actionLabel("retire")).toBe("Ngừng dùng");
    expect(actionLabel("keep")).toBe("Giữ nguyên");
  });
  it("giữ nguyên action lạ", () => {
    expect(actionLabel("weird")).toBe("weird");
  });
});
