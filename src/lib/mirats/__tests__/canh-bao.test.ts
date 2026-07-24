import { describe, expect, it } from "vitest";
import {
  buildAlerts,
  daysRemaining,
  NGUONG_THONG_BAO,
  pickThreshold,
  type AlertItem,
} from "../canh-bao";

// Cố định "hôm nay" giờ VN = 2026-01-01 để tính số ngày ổn định.
const NOW = new Date("2026-01-01T00:00:00+07:00");

function itemAt(daysFromNow: number, over: Partial<AlertItem> = {}): AlertItem {
  // Cộng offset +07:00 để .toISOString() phần ngày trùng ngày VN.
  const ms = new Date(NOW).getTime() + daysFromNow * 86_400_000 + 7 * 3_600_000;
  const iso = new Date(ms).toISOString().slice(0, 10);
  return {
    loai: "bao_hanh",
    doi_tuong_bang: "thiet_bi",
    doi_tuong_ref: `ref-${daysFromNow}`,
    don_vi_id: null,
    ten: `Item ${daysFromNow}`,
    ngay_het_han: iso,
    ...over,
  };
}

describe("daysRemaining", () => {
  it("cùng ngày → 0", () => {
    expect(daysRemaining("2026-01-01", NOW)).toBe(0);
  });
  it("giữ đúng số ngày dương", () => {
    expect(daysRemaining("2026-01-31", NOW)).toBe(30);
  });
  it("quá khứ → âm", () => {
    expect(daysRemaining("2025-12-30", NOW)).toBe(-2);
  });
});

describe("pickThreshold", () => {
  it("chọn ngưỡng nhỏ nhất ≥ số ngày", () => {
    expect(pickThreshold(20, [30, 15, 7])).toBe(30);
    expect(pickThreshold(8, [30, 15, 7])).toBe(15);
    expect(pickThreshold(5, [30, 15, 7])).toBe(7);
  });
  it("vượt max → null", () => {
    expect(pickThreshold(31, [30, 15, 7])).toBeNull();
  });
  it("âm → null", () => {
    expect(pickThreshold(-1, [30, 15, 7])).toBeNull();
  });
});

describe("buildAlerts", () => {
  it("31 ngày → KHÔNG cảnh báo", () => {
    expect(buildAlerts([itemAt(31)], { now: NOW })).toHaveLength(0);
  });

  it("30 ngày → nguong=30, muc_do=info", () => {
    const r = buildAlerts([itemAt(30)], { now: NOW });
    expect(r).toHaveLength(1);
    expect(r[0].nguong).toBe(30);
    expect(r[0].muc_do).toBe("info");
  });

  it("8 ngày → 1 dòng nguong=15 (warning)", () => {
    const r = buildAlerts([itemAt(8)], { now: NOW });
    expect(r).toHaveLength(1);
    expect(r[0].nguong).toBe(15);
    expect(r[0].muc_do).toBe("warning");
  });

  it("5 ngày → nguong=7, critical", () => {
    const r = buildAlerts([itemAt(5)], { now: NOW });
    expect(r[0].nguong).toBe(7);
    expect(r[0].muc_do).toBe("critical");
  });

  it("quá hạn 2 ngày → overdue", () => {
    const r = buildAlerts([itemAt(-2)], { now: NOW });
    expect(r).toHaveLength(1);
    expect(r[0].nguong).toBe("overdue");
    expect(r[0].muc_do).toBe("overdue");
    expect(r[0].so_ngay_con_lai).toBe(-2);
  });

  it("idempotent: chạy 2 lần cùng input → cùng bộ khoá", () => {
    const items = [itemAt(30), itemAt(8), itemAt(-2)];
    const a = buildAlerts(items, { now: NOW });
    const b = buildAlerts(items, { now: NOW });
    const keysA = new Set(a.map((x) => x.khoa_chong_trung));
    const keysB = b.map((x) => x.khoa_chong_trung);
    expect(keysB).toHaveLength(keysA.size);
    for (const k of keysB) expect(keysA.has(k)).toBe(true);
  });

  it("thresholds tuỳ biến [10,3]", () => {
    const r = buildAlerts([itemAt(4), itemAt(11)], { now: NOW, thresholds: [10, 3] });
    // 4 → 10; 11 → null (bỏ)
    expect(r).toHaveLength(1);
    expect(r[0].nguong).toBe(10);
  });

  it("mặc định NGUONG_THONG_BAO = [30,15,7]", () => {
    expect([...NGUONG_THONG_BAO]).toEqual([30, 15, 7]);
  });
});
