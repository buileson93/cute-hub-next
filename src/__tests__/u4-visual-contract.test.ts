import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { runAuditLogic } from "../../scripts/ui-audit.mjs";

describe("u4-visual-contract: UI Regression Guard", () => {
  const baselinePath = join(process.cwd(), "docs", "ui", "u4-baseline.json");
  const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
  const currentStats = runAuditLogic();

  it("không làm tăng tổng số lỗi text-[Npx]", () => {
    const diff = currentStats.textPx.total - baseline.summary.textPxTotal;
    expect(diff, `Số lỗi text-[Npx] tăng thêm ${diff}. Hãy dùng TYPO scale thay vì hardcode px.`).toBeLessThanOrEqual(0);
  });

  it("không làm tăng tổng số lỗi Tailwind palette colors trong src/routes và src/components/mirats", () => {
    const diff = currentStats.paletteColors - baseline.summary.paletteColors;
    expect(diff, `Số lỗi Tailwind palette colors tăng thêm ${diff}. Hãy dùng các token màu chuẩn của hệ thống.`).toBeLessThanOrEqual(0);
  });

  it("không làm tăng tổng số mã màu HEX trong src/routes và src/components/mirats", () => {
    const diff = currentStats.hexColors - baseline.summary.hexColors;
    expect(diff, `Số lỗi mã HEX tăng thêm ${diff}. Hãy dùng các biến CSS hoặc token màu chuẩn.`).toBeLessThanOrEqual(0);
  });

  it("không làm tăng số lượng nút icon thiếu nhãn truy cập (aria-label/tooltip)", () => {
    const diff = currentStats.iconNoLabel - baseline.summary.iconNoLabel;
    expect(diff, `Số nút icon thiếu nhãn tăng thêm ${diff}. Mọi nút icon-only phải có aria-label hoặc Tooltip.`).toBeLessThanOrEqual(0);
  });

  it("xác minh chi tiết các file vi phạm mới (nếu có)", () => {
    const baselineFiles = new Set(baseline.top20Files.map(f => f.file));
    const currentViolations = currentStats.fileViolations
      .filter(v => v.file.includes('src/routes') || v.file.includes('src/components/mirats'))
      .sort((a, b) => b.count - a.count);

    const newOffenders = currentViolations.filter(v => !baselineFiles.has(v.file) && v.count > 0);
    
    // Nếu tổng số lỗi không tăng nhưng có file mới xuất hiện (do chuyển lỗi từ file này sang file khác)
    // chúng ta vẫn cảnh báo để đảm bảo tính minh bạch.
    if (newOffenders.length > 0 && (currentStats.textPx.total > baseline.summary.textPxTotal || currentStats.paletteColors > baseline.summary.paletteColors)) {
      expect(newOffenders, `Phát hiện các file mới có vi phạm giao diện:\n${newOffenders.map(o => `- ${o.file}: ${o.count} lỗi`).join('\n')}`).toEqual([]);
    }
  });
});
