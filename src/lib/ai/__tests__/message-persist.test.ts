import { describe, it, expect } from "vitest";
import { normalizeStoredMessage, normalizeStoredMessages } from "../message-persist";

/**
 * Reload hội thoại phải giữ cả tin nhắn assistant CŨ (content string / mảng text)
 * lẫn tin nhắn MỚI (đã có parts). Đây là hợp đồng tương thích ngược của bảng ai_message.
 */
describe("normalizeStoredMessages – tương thích content cũ & parts mới", () => {
  it("giữ nguyên tin nhắn bản mới đã có parts", () => {
    const rows = [
      { content: { role: "assistant", id: "m1", parts: [{ type: "text", text: "xin chào" }] } },
    ];
    const out = normalizeStoredMessages(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("m1");
    expect(out[0].role).toBe("assistant");
    expect(out[0].parts).toEqual([{ type: "text", text: "xin chào" }]);
  });

  it("chuyển tin nhắn bản cũ (content là string) sang parts", () => {
    const rows = [{ content: { role: "assistant", id: "old1", content: "trả lời cũ" } }];
    const out = normalizeStoredMessages(rows);
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("old1");
    expect(out[0].parts).toEqual([{ type: "text", text: "trả lời cũ" }]);
  });

  it("chuyển content dạng mảng {type:text} sang parts gộp text", () => {
    const rows = [
      {
        content: {
          role: "user",
          content: [
            { type: "text", text: "phần 1 " },
            { type: "text", text: "phần 2" },
          ],
        },
      },
    ];
    const out = normalizeStoredMessages(rows);
    expect(out[0].parts).toEqual([{ type: "text", text: "phần 1 phần 2" }]);
  });

  it("giữ đúng thứ tự khi trộn tin nhắn cũ và mới sau reload", () => {
    const rows = [
      { content: { role: "user", id: "u1", content: "câu hỏi cũ" } },
      { content: { role: "assistant", id: "a1", parts: [{ type: "text", text: "đáp mới" }] } },
    ];
    const out = normalizeStoredMessages(rows);
    expect(out.map((m) => m.id)).toEqual(["u1", "a1"]);
    expect(out.map((m) => m.role)).toEqual(["user", "assistant"]);
  });

  it("sinh id ổn định cho tin nhắn cũ không có id", () => {
    const out = normalizeStoredMessage({ content: { role: "assistant", content: "x" } }, 3);
    expect(out?.id).toBe("legacy-3");
  });

  it("bỏ hàng không hợp lệ (thiếu role, rỗng, null)", () => {
    const rows = [
      { content: null },
      { content: { content: "không có role" } },
      { content: { role: "assistant", content: "" } },
      { content: { role: "assistant", content: [] } },
    ];
    expect(normalizeStoredMessages(rows)).toEqual([]);
  });
});
