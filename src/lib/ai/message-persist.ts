/**
 * Chuẩn hoá tin nhắn AI đã lưu (bảng ai_message) về dạng UIMessage của AI SDK.
 *
 * Tương thích NGƯỢC:
 *  - Bản mới: `content` đã là UIMessage có `.parts` → dùng trực tiếp.
 *  - Bản cũ (ModelMessage): `content` là string hoặc mảng {type:'text', text}
 *    → chuyển thành `parts: [{ type: 'text', text }]`.
 *
 * Hàm THUẦN (không phụ thuộc React) để test được khi reload hội thoại: tin nhắn
 * assistant cũ và mới đều hiển thị lại đúng.
 */
import type { UIMessage } from "ai";

export type StoredMessageRow = { content: unknown };

type LegacyContent = string | Array<{ type?: string; text?: unknown } | unknown> | undefined;

type RawStored = {
  role?: UIMessage["role"];
  id?: string;
  parts?: unknown;
  content?: LegacyContent;
};

function extractLegacyText(content: LegacyContent): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((p) =>
        p && typeof p === "object" && "text" in p ? String((p as { text: unknown }).text) : "",
      )
      .join("");
  }
  return "";
}

/** Chuyển 1 hàng đã lưu thành UIMessage (hoặc null nếu không hợp lệ/rỗng). */
export function normalizeStoredMessage(row: StoredMessageRow, index: number): UIMessage | null {
  const raw = row?.content as RawStored | undefined;
  if (!raw || !raw.role) return null;

  // Bản mới: đã có mảng parts → dùng trực tiếp.
  if (Array.isArray(raw.parts)) return raw as unknown as UIMessage;

  // Bản cũ: dựng lại parts từ content.
  const text = extractLegacyText(raw.content);
  if (!text) return null;
  return {
    id: raw.id ?? `legacy-${index}`,
    role: raw.role,
    parts: [{ type: "text", text }],
  } as UIMessage;
}

/** Chuẩn hoá cả mảng hàng đã lưu; bỏ các hàng không hợp lệ. */
export function normalizeStoredMessages(rows: readonly StoredMessageRow[]): UIMessage[] {
  return rows.map((r, i) => normalizeStoredMessage(r, i)).filter((m): m is UIMessage => m !== null);
}
