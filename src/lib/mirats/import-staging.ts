// ============================================================================
// Tiện ích phía client cho lớp staging nhập liệu: tính hash file (SHA-256) và
// chuyển các "lớp" đã phân tích thành danh sách item để gửi lên createImportBatch.
// ============================================================================

import type { ParsedLayer } from "@/lib/mirats/allinone-template";

/** SHA-256 hex của nội dung file — dùng nhận diện file trùng. */
export async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type StagedItemInput = {
  sheet?: string;
  entity: string;
  catTable?: string;
  rowIndex: number;
  rawRow: Record<string, unknown>;
  normalizedRow?: Record<string, unknown> | null;
  status?: "staged" | "valid" | "error" | "committed" | "skipped";
  messages?: unknown[];
};

/** Chuyển các lớp all-in-one đã phân tích thành item staging (chỉ lớp có dữ liệu). */
export function layersToStagedItems(layers: ParsedLayer[]): StagedItemInput[] {
  const items: StagedItemInput[] = [];
  for (const layer of layers) {
    if (!layer.rows.length) continue;
    layer.rows.forEach((row, idx) => {
      items.push({
        sheet: layer.layer.sheet,
        entity: layer.layer.entity,
        catTable: layer.layer.catTable,
        rowIndex: idx + 1,
        rawRow: row as Record<string, unknown>,
        status: "staged",
        messages: [],
      });
    });
  }
  return items;
}
