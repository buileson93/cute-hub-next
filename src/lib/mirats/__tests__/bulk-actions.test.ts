import { describe, it, expect } from "vitest";
import {
  previewBulk,
  buildBulkPayload,
  buildUndoPlan,
  type RowLike,
  type BulkHanhDong,
} from "@/lib/mirats/ui/bulk-actions";

describe("bulk-actions — previewBulk", () => {
  it("chuyển trạng thái sự cố: bỏ qua dòng không có mốc khắc phục khi đích là 'Đã khắc phục' (Task 3)", () => {
    const rows: RowLike[] = [
      { id: "a", trang_thai: "Đang xử lý", thoi_diem_khac_phuc: "2026-01-01T00:00:00Z" },
      { id: "b", trang_thai: "Đang xử lý", thoi_diem_khac_phuc: null },
      { id: "c", trang_thai: "Đóng" }, // Đóng → Đã khắc phục KHÔNG hợp lệ theo vòng đời
    ];
    const kq = previewBulk("su_co", rows, {
      kieu: "chuyen_trang_thai",
      giaTri: "Đã khắc phục",
    });
    expect(kq.apDung).toBe(1);
    expect(kq.boQua).toBe(2);
    expect(kq.chiTiet.find((x) => x.id === "b")?.lyDo).toMatch(/mốc khắc phục/i);
    expect(kq.canhBao.length).toBeGreaterThan(0);
  });

  it("chuyển trạng thái sự cố: bỏ qua chuyển sai vòng đời", () => {
    const rows: RowLike[] = [
      { id: "x", trang_thai: "Đóng" },
    ];
    const kq = previewBulk("su_co", rows, {
      kieu: "chuyen_trang_thai",
      giaTri: "Mới",
    });
    expect(kq.apDung).toBe(0);
    expect(kq.boQua).toBe(1);
  });

  it("bỏ qua khi trạng thái đích trùng trạng thái hiện tại", () => {
    const rows: RowLike[] = [{ id: "a", trang_thai: "Mới" }];
    const kq = previewBulk("su_co", rows, {
      kieu: "chuyen_trang_thai",
      giaTri: "Mới",
    });
    expect(kq.apDung).toBe(0);
    expect(kq.chiTiet[0].lyDo).toMatch(/đã ở/i);
  });

  it("gán danh mục: bỏ qua dòng đã trùng giá trị, đếm áp dụng đúng", () => {
    const rows: RowLike[] = [
      { id: "1", dm_loai_id: "L1" },
      { id: "2", dm_loai_id: null },
      { id: "3", dm_loai_id: "L2" },
    ];
    const kq = previewBulk("thiet_bi", rows, {
      kieu: "gan_danh_muc",
      field: "dm_loai_id",
      giaTri: "L1",
    });
    expect(kq.apDung).toBe(2);
    expect(kq.boQua).toBe(1);
  });

  it("gán người: yêu cầu field và giá trị", () => {
    const rows: RowLike[] = [{ id: "1" }];
    const a = previewBulk("thiet_bi", rows, { kieu: "gan_nguoi", giaTri: "u1" });
    expect(a.apDung).toBe(0);
    const b = previewBulk("thiet_bi", rows, {
      kieu: "gan_nguoi",
      field: "nguoi_phu_trach",
      giaTri: "",
    });
    expect(b.apDung).toBe(0);
  });
});

describe("bulk-actions — buildBulkPayload", () => {
  it("chuyển trạng thái → bulk_chuyen_trang_thai_<loai> với p_ids + nguồn ui_bulk", () => {
    const p = buildBulkPayload("su_co", ["a", "b"], {
      kieu: "chuyen_trang_thai",
      giaTri: "Đang xử lý",
    });
    expect(p.rpc).toBe("bulk_chuyen_trang_thai_su_co");
    expect(p.args.p_ids).toEqual(["a", "b"]);
    expect(p.args.p_trang_thai).toBe("Đang xử lý");
    expect(p.args.p_nguon).toBe("ui_bulk");
  });

  it("gán danh mục / gán người → bulk_gan_field_<loai> với p_field", () => {
    const p = buildBulkPayload("thiet_bi", ["1"], {
      kieu: "gan_danh_muc",
      field: "dm_loai_id",
      giaTri: "L1",
    });
    expect(p.rpc).toBe("bulk_gan_field_thiet_bi");
    expect(p.args.p_field).toBe("dm_loai_id");
    expect(p.args.p_gia_tri).toBe("L1");
    expect(p.args.p_nguon).toBe("ui_bulk");
  });

  it("thiếu ids → ném lỗi", () => {
    expect(() =>
      buildBulkPayload("thiet_bi", [], { kieu: "chuyen_trang_thai", giaTri: "x" }),
    ).toThrow();
  });

  it("thiếu field khi gán → ném lỗi", () => {
    expect(() =>
      buildBulkPayload("thiet_bi", ["1"], { kieu: "gan_nguoi", giaTri: "u1" }),
    ).toThrow();
  });
});

describe("bulk-actions — previewBulk đếm chính xác", () => {
  it("đếm áp dụng/bỏ qua bằng đúng số dòng đầu vào (không mất dòng)", () => {
    const rows: RowLike[] = Array.from({ length: 10 }, (_, i) => ({
      id: `r${i}`,
      dm_loai_id: i % 2 === 0 ? "L1" : "L2",
    }));
    const kq = previewBulk("thiet_bi", rows, {
      kieu: "gan_danh_muc",
      field: "dm_loai_id",
      giaTri: "L1",
    });
    // 5 dòng đang là L1 → bỏ qua; 5 dòng L2 → áp dụng
    expect(kq.apDung).toBe(5);
    expect(kq.boQua).toBe(5);
    expect(kq.chiTiet).toHaveLength(10);
    expect(kq.apDung + kq.boQua).toBe(rows.length);
  });

  it("preview không mutate rows", () => {
    const rows: RowLike[] = [{ id: "1", dm_loai_id: "A" }];
    const snap = JSON.stringify(rows);
    previewBulk("thiet_bi", rows, { kieu: "gan_danh_muc", field: "dm_loai_id", giaTri: "B" });
    expect(JSON.stringify(rows)).toBe(snap);
  });
});

describe("bulk-actions — buildUndoPlan", () => {
  it("nhóm snapshot theo giá trị cũ, mỗi nhóm sinh 1 payload với nguồn ui_bulk_undo", () => {
    const hanhDong: BulkHanhDong = { kieu: "gan_danh_muc", field: "dm_loai_id", giaTri: "NEW" };
    const snapshot = [
      { id: "a", oldValue: "L1" },
      { id: "b", oldValue: "L1" },
      { id: "c", oldValue: "L2" },
      { id: "d", oldValue: null },
    ];
    const plan = buildUndoPlan("thiet_bi", hanhDong, snapshot);
    expect(plan).toHaveLength(3);
    for (const p of plan) {
      expect(p.rpc).toBe("bulk_gan_field_thiet_bi");
      expect(p.args.p_field).toBe("dm_loai_id");
      expect(p.args.p_nguon).toBe("ui_bulk_undo");
    }
    // Tổng số id trong plan = số dòng snapshot (audit đủ N dòng)
    const totalIds = plan.reduce(
      (s, p) => s + (p.args.p_ids as string[]).length,
      0,
    );
    expect(totalIds).toBe(snapshot.length);

    // Mỗi id được khôi phục ĐÚNG giá trị cũ của nó (không san bằng).
    const idToRestored = new Map<string, unknown>();
    for (const p of plan) {
      for (const id of p.args.p_ids as string[]) {
        idToRestored.set(id, p.args.p_gia_tri);
      }
    }
    expect(idToRestored.get("a")).toBe("L1");
    expect(idToRestored.get("b")).toBe("L1");
    expect(idToRestored.get("c")).toBe("L2");
    expect(idToRestored.get("d")).toBeNull();
  });

  it("chuyển trạng thái: hoàn tác về đúng trạng thái cũ từng dòng", () => {
    const hanhDong: BulkHanhDong = { kieu: "chuyen_trang_thai", giaTri: "Đã khắc phục" };
    const snapshot = [
      { id: "x", oldValue: "Đang xử lý" },
      { id: "y", oldValue: "Mới" },
      { id: "z", oldValue: "Đang xử lý" },
    ];
    const plan = buildUndoPlan("su_co", hanhDong, snapshot);
    expect(plan).toHaveLength(2);
    for (const p of plan) {
      expect(p.rpc).toBe("bulk_chuyen_trang_thai_su_co");
      expect(p.args.p_nguon).toBe("ui_bulk_undo");
    }
    const idToRestored = new Map<string, unknown>();
    for (const p of plan) {
      for (const id of p.args.p_ids as string[]) {
        idToRestored.set(id, p.args.p_trang_thai);
      }
    }
    expect(idToRestored.get("x")).toBe("Đang xử lý");
    expect(idToRestored.get("y")).toBe("Mới");
    expect(idToRestored.get("z")).toBe("Đang xử lý");
  });

  it("snapshot rỗng → plan rỗng", () => {
    expect(
      buildUndoPlan("thiet_bi", { kieu: "gan_danh_muc", field: "dm_loai_id", giaTri: "X" }, []),
    ).toEqual([]);
  });
});
