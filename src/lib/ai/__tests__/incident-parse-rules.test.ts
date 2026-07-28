import { describe, it, expect } from "vitest";
import { parseIncidentByRules } from "../incident-parse-rules";

/**
 * Gold standard #1 — báo cáo VHF đầy đủ 7 mục theo mẫu TTBDKT.
 * Kỳ vọng: confidence ≥ 0.7 (không cần AI fallback).
 */
const GOLD_VHF = `
1. Đơn vị báo cáo: TTBDKT
2. Hệ thống/thiết bị: VHF Park Air T6T 127.9MHz (Main) — APP
3. Mô tả sự cố: Từ 02h45 đến 09h00 ngày 16/07/2026, máy thu VHF Park Air T6T 127.9MHz (Main) mất nguồn AC, chuyển sang máy dự phòng lúc 02h46.
4. Nguyên nhân: Nghi sét đánh gây hỏng module nguồn.
5. Thiết bị thay thế: Đường truyền dự phòng qua VHF Standby vận hành ổn định.
6. Xử lý: Ca trực AB đã đưa máy dự phòng lên khai thác, tiến hành reset và ghi log.
7. Đánh giá ảnh hưởng: Không ảnh hưởng ĐHB, ĐHB tiếp tục điều hành bình thường.
8. Đề xuất: Kiểm tra hệ thống chống sét khu vực APP.
`;

/** Gold standard #2 — báo cáo Radar rút gọn (6 mục, có ảnh hưởng ĐHB). */
const GOLD_RADAR = `
1. Đơn vị báo cáo: TTBDKT — Đài KSKL Đà Nẵng
2. Hệ thống: Radar sơ cấp PSR - Trạm 1
3. Mô tả sự cố: Lúc 08h15 ngày 20/07/2026, kênh xử lý dữ liệu PSR mất tín hiệu, ĐHB phải chuyển sang SSR trong 22 phút.
4. Nguyên nhân: Đứt cáp quang giữa trạm Radar và trung tâm xử lý.
5. Xử lý: Bảo dưỡng hàn nối cáp, khôi phục vận hành lúc 08h37.
6. Đánh giá ảnh hưởng: Ảnh hưởng một phần, ĐHB dùng SSR trong thời gian mất PSR.
`;

/**
 * EDGE #1 — chỉ có mô tả + xử lý, thiếu mọi header khác.
 * Kỳ vọng: confidence < 0.7 → phải gọi AI fallback.
 */
const EDGE_MINIMAL = `
3. Mô tả: Có gián đoạn ngắn ở VCCS lúc 10h ngày 15/07/2026.
6. Xử lý: Reset lại tổng đài.
`;

/** EDGE #2 — free-form text hoàn toàn không có số mục. Kỳ vọng: confidence rất thấp. */
const EDGE_FREEFORM = `
Sáng nay bên APP báo mất kết nối với radar, kỹ thuật đang xuống kiểm tra.
Chưa xác định nguyên nhân, ĐHB dùng phương án dự phòng.
`;

/** EDGE #3 — chỉ có 2 mục (hệ thống + mô tả) không có xử lý/đánh giá. */
const EDGE_HALF = `
2. Hệ thống: NAV/ILS RWY 25R
3. Mô tả sự cố: Localizer báo BITE lỗi lúc 03h05 ngày 18/07/2026.
`;

/** EDGE #4 — rỗng. */
const EDGE_EMPTY = "";

describe("incident-parse-rules — gold standards đạt ngưỡng no-AI", () => {
  it("VHF 7 mục đầy đủ → confidence ≥ 0.7", () => {
    const r = parseIncidentByRules(GOLD_VHF);
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
    expect(r.parsed.he_thong_goi_y).toMatch(/VHF/i);
    expect(r.parsed.thoi_gian_bat_dau).toBe("2026-07-16T02:45");
    expect(r.parsed.anh_huong_dhb).toBe("Không ảnh hưởng");
    expect(r.parsed.phan_loai).toBe("E");
    expect(r.parsed.bien_phap_xu_ly).toMatch(/reset|dự phòng/i);
    expect(r.parsed.nguyen_nhan).toMatch(/sét/i);
  });

  it("Radar 6 mục có gián đoạn → confidence ≥ 0.7 + phân loại C", () => {
    const r = parseIncidentByRules(GOLD_RADAR);
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
    expect(r.parsed.anh_huong_dhb).toBe("Ảnh hưởng một phần");
    expect(r.parsed.phan_loai).toBe("C");
    expect(r.parsed.thoi_gian_bat_dau).toBe("2026-07-20T08:15");
    expect(r.parsed.he_thong_goi_y).toMatch(/Radar/i);
  });

  it("shortSymptom không cắt vào '127.9MHz'", () => {
    const r = parseIncidentByRules(GOLD_VHF);
    // Regex cũ từng cắt tại "127." — bảo đảm không lặp lại.
    expect(r.parsed.hien_tuong).not.toMatch(/^127$/);
    expect(r.parsed.tom_tat).toMatch(/127\.9MHz/);
  });
});

describe("incident-parse-rules — edge cases kích hoạt AI fallback", () => {
  it("chỉ có mô tả + xử lý → confidence < 0.7", () => {
    const r = parseIncidentByRules(EDGE_MINIMAL);
    expect(r.confidence).toBeLessThan(0.7);
    // Ghi chú phải có ít nhất một tín hiệu để user hiểu vì sao thấp
    expect(r.notes.some((n) => /hệ thống|thời gian/i.test(n))).toBe(true);
  });

  it("free-form không có số mục → confidence < 0.7 (thường 0)", () => {
    const r = parseIncidentByRules(EDGE_FREEFORM);
    expect(r.confidence).toBeLessThan(0.7);
    expect(r.matched_sections).toBe(0);
  });

  it("chỉ có 2 mục (hệ thống + mô tả) → confidence < 0.7", () => {
    const r = parseIncidentByRules(EDGE_HALF);
    expect(r.confidence).toBeLessThan(0.7);
    // Nhưng thời gian vẫn phải suy được vì có ngày+giờ trong mô tả
    expect(r.parsed.thoi_gian_bat_dau).toBe("2026-07-18T03:05");
  });

  it("rỗng → confidence = 0", () => {
    const r = parseIncidentByRules(EDGE_EMPTY);
    expect(r.confidence).toBe(0);
  });
});

describe("incident-parse-rules — invariant an toàn", () => {
  it("không throw với input rác", () => {
    for (const junk of ["\u0000\u0001", "🚀🚀🚀", "1.", "1.\n2.\n3.", "-".repeat(5000)]) {
      expect(() => parseIncidentByRules(junk)).not.toThrow();
    }
  });
  it("phân loại luôn thuộc A..E", () => {
    for (const t of [GOLD_VHF, GOLD_RADAR, EDGE_MINIMAL, EDGE_FREEFORM, EDGE_HALF]) {
      const r = parseIncidentByRules(t);
      expect(["A", "B", "C", "D", "E"]).toContain(r.parsed.phan_loai);
    }
  });
  it("ảnh hưởng ĐHB luôn thuộc 3 giá trị hợp lệ", () => {
    const OK = ["Không ảnh hưởng", "Ảnh hưởng một phần", "Có gián đoạn ĐHB"];
    for (const t of [GOLD_VHF, GOLD_RADAR, EDGE_MINIMAL, EDGE_FREEFORM, EDGE_HALF]) {
      const r = parseIncidentByRules(t);
      expect(OK).toContain(r.parsed.anh_huong_dhb);
    }
  });
});

describe("su-co-parser tầng 2 gate (AI fallback threshold)", () => {
  it("ngưỡng gate là 0.7 — gold luôn >= 0.7, edge luôn < 0.7", () => {
    const gold = [GOLD_VHF, GOLD_RADAR].map(parseIncidentByRules);
    const edge = [EDGE_MINIMAL, EDGE_FREEFORM, EDGE_HALF, EDGE_EMPTY].map(parseIncidentByRules);
    for (const g of gold) expect(g.confidence).toBeGreaterThanOrEqual(0.7);
    for (const e of edge) expect(e.confidence).toBeLessThan(0.7);
  });
});
