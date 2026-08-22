import { describe, it, expect } from "vitest";
import { classifyTextForWeeklyReport } from "../weekly-report-detector";

describe("classifyTextForWeeklyReport", () => {
  it("accepts a well-formed weekly report", () => {
    const t = `BÁO CÁO TUẦN 12/2026
      TT | Tên thiết bị | Thời gian bắt đầu | Tình trạng kỹ thuật | Biện pháp khắc phục
      1  | DVOR/DME    | 12/03 08h30       | Sự cố mất tín hiệu   | Reset khối phát
      2  | RADAR TSR   | 13/03 14h00       | Cảnh báo BITE        | Thay module
      Ảnh hưởng: ĐHB gián đoạn 15 phút.`;
    const r = classifyTextForWeeklyReport(t);
    expect(r.verdict).toBe("accept");
    expect(r.score).toBeGreaterThan(0.5);
  });

  it("rejects a maintenance form", () => {
    const t = "PHIẾU BẢO DƯỠNG định kỳ tháng — hệ thống VOR — người thực hiện: KTV X";
    const r = classifyTextForWeeklyReport(t);
    expect(r.verdict).toBe("reject");
  });

  it("rejects a license document", () => {
    const t = "GIẤY PHÉP KHAI THÁC hệ thống thông tin — số: 123/CAAV — có giá trị đến 2027";
    const r = classifyTextForWeeklyReport(t);
    expect(r.verdict).toBe("reject");
  });

  it("rejects empty text", () => {
    expect(classifyTextForWeeklyReport("").verdict).toBe("reject");
  });

  it("returns suspect for ambiguous content", () => {
    const t = "Sự cố xảy ra vào 12/03 lúc 09h. ĐHB bị ảnh hưởng.";
    const r = classifyTextForWeeklyReport(t);
    expect(["suspect", "reject"]).toContain(r.verdict);
  });
});
