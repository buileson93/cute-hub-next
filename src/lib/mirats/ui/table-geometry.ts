import type { StdColumn } from "@/components/mirats/StandardTable";

/**
 * Đo độ rộng văn bản bằng Canvas để có kết quả chính xác mà không cần render vào DOM.
 */
function measureTextWidth(
  text: string,
  font: string = "13px Inter, system-ui, sans-serif",
): number {
  if (typeof document === "undefined") return 100;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext ? canvas.getContext("2d") : null;
  if (!context) return 100;
  context.font = font;
  return context.measureText(text).width;
}

/**
 * Tính toán độ rộng tối ưu cho các cột dựa trên nội dung mẫu.
 */
export function calculateOptimalWidths<T>(
  rows: T[],
  columns: StdColumn<T>[],
  options: {
    padding?: number;
    sampleSize?: number;
    font?: string;
    minDefault?: number;
    maxDefault?: number;
  } = {},
): Record<string, number> {
  const {
    padding = 32,
    sampleSize = 50,
    font = "13px Inter, system-ui, sans-serif",
    minDefault = 80,
    maxDefault = 500,
  } = options;

  const results: Record<string, number> = {};
  const sample = rows.slice(0, sampleSize);

  columns.forEach((col) => {
    // 1. Đo độ rộng tiêu đề
    let maxW = measureTextWidth(
      col.header || col.label || "",
      "bold 13px Inter, system-ui, sans-serif",
    );

    // 2. Đo độ rộng nội dung trong mẫu
    sample.forEach((row) => {
      const val = col.value ? col.value(row) : (row as any)[col.key];
      const text = val == null ? "" : String(val);
      const w = measureTextWidth(text, font);
      if (w > maxW) maxW = w;
    });

    // 3. Cộng padding và giới hạn trong khoảng min/max
    const finalW = Math.ceil(maxW + padding);

    // Ưu tiên minWidth/maxWidth định nghĩa trong cột nếu có
    const min = col.minWidth ?? (col.minW ? parseMinW(col.minW) : minDefault);
    const max = col.maxWidth ?? maxDefault;

    results[col.key] = Math.max(min, Math.min(finalW, max));
  });

  return results;
}

/**
 * Parse chuỗi min-w-[100px] hoặc tương đương sang số.
 */
export function parseMinW(minW: string | undefined): number {
  if (!minW) return 100;
  if (minW.includes("[")) {
    const match = minW.match(/\[(.*?)\]/);
    if (match && match[1]) {
      return parseInt(match[1]) || 100;
    }
  }
  return parseInt(minW) || 100;
}
