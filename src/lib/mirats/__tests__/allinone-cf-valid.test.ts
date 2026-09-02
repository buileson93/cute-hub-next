// ============================================================================
// Bảo vệ chống lỗi "Excel yêu cầu repair" khi mở file all-in-one.
// Nguyên nhân gốc: exceljs 4.4.0 không serialize rule "containsBlanks" nên ghi
// ra phần tử <conditionalFormatting sqref="..."/> RỖNG (thiếu <cfRule>), sai
// lược đồ OOXML → Microsoft Excel báo hỏng file.
// Test khẳng định rule "expression" (giải pháp đang dùng) sinh XML hợp lệ.
// ============================================================================

import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { unzipSync, strFromU8 } from "fflate";

async function sheetXml(apply: (ws: ExcelJS.Worksheet) => void): Promise<string> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("S1");
  ws.addRow(["A", "B"]);
  apply(ws);
  const buf = (await wb.xlsx.writeBuffer()) as ArrayBuffer;
  const files = unzipSync(new Uint8Array(buf));
  const key = Object.keys(files).find((k) => /xl\/worksheets\/sheet1\.xml$/.test(k))!;
  return strFromU8(files[key]!);
}

const style = {
  fill: { type: "pattern", pattern: "solid", bgColor: { argb: "FFFEE2E2" } },
  font: { color: { argb: "FF991B1B" } },
} as unknown as ExcelJS.Style;

describe("all-in-one: conditional formatting hợp lệ với Excel", () => {
  it("rule expression sinh <cfRule> đầy đủ (không có phần tử rỗng)", async () => {
    const xml = await sheetXml((ws) =>
      ws.addConditionalFormatting({
        ref: "A2:A10",
        rules: [{ type: "expression", priority: 1, formulae: ["ISBLANK(A2)"], style }],
      }),
    );
    expect(xml).toContain("<cfRule");
    expect(xml).not.toMatch(/<conditionalFormatting[^>]*\/>/);
  });

  it("phát hiện được trường hợp hỏng: containsBlanks tạo phần tử rỗng", async () => {
    const xml = await sheetXml((ws) =>
      ws.addConditionalFormatting({
        ref: "A2:A10",
        rules: [{ type: "containsBlanks", priority: 1, style } as never],
      }),
    );
    // Nếu exceljs được nâng cấp và sửa lỗi này, test sẽ đỏ để ta xem lại workaround.
    expect(xml).toMatch(/<conditionalFormatting[^>]*\/>/);
  });
});
