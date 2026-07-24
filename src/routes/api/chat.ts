import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { buildAiModel, type AiRuntimeConfig } from "@/lib/ai/gateway.server";
import { buildAiTools } from "@/lib/ai/tools";
import { renderSchemaForPrompt } from "@/lib/ai/data-dictionary";

type ChatBody = {
  id?: string;
  messages?: UIMessage[];
  conversation_id?: string;
};

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get("Authorization");
        if (!auth?.startsWith("Bearer ")) {
          return new Response("Chưa đăng nhập", { status: 401 });
        }
        const token = auth.slice(7);

        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
            auth: { persistSession: false, autoRefreshToken: false },
          },
        );

        const { data: userRes, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userRes?.user) {
          return new Response("Phiên không hợp lệ", { status: 401 });
        }
        const userId = userRes.user.id;

        const body = (await request.json()) as ChatBody;
        const messages = body.messages ?? [];
        const conversationId = body.conversation_id ?? body.id;

        // Load AI config
        const { data: cfgRow, error: cfgErr } = await supabase
          .from("ai_config")
          .select("*")
          .eq("id", 1)
          .maybeSingle();
        if (cfgErr) return new Response(cfgErr.message, { status: 500 });
        const cfg = cfgRow as unknown as AiRuntimeConfig | null;
        if (!cfg || !cfg.enabled) {
          return new Response("AI đang tắt", { status: 403 });
        }

        let model;
        try {
          model = buildAiModel(cfg);
        } catch (e) {
          return new Response((e as Error).message, { status: 500 });
        }

        // Kênh ghi chỉ bật cho Admin/Phòng kỹ thuật (RPC cũng tự kiểm tra lại vai trò).
        const { data: canWrite } = await supabase.rpc("can_manage_equipment", { _user_id: userId });

        const tools = buildAiTools({ supabase, canWrite: canWrite === true });

        // Nạp BẢN ĐỒ DỮ LIỆU từ từ điển curated (nguồn sự thật duy nhất).
        // Không phụ thuộc RPC chạy được → AI luôn thấy đầy đủ bảng nghiệp vụ.
        const schemaBlock =
          `\n\n### Bản đồ dữ liệu MIRATS (nguồn tin cậy)\n${renderSchemaForPrompt()}` +
          `\n\n### Hướng dẫn truy vấn` +
          `\n- Chỉ dùng dữ liệu từ tool, KHÔNG bịa số liệu.` +
          `\n- Nếu tool trả về rỗng/không đủ dữ liệu, hãy nói rõ "chưa có dữ liệu" thay vì suy đoán; nêu nguồn (bảng/tool) khi có thể.` +
          `\n- Dùng \`describe_schema\` để xem kiểu cột đầy đủ khi cần.` +
          `\n- Với cột kết thúc bằng _id (→dm_*), LUÔN gọi \`list_danh_muc\` để tra id trước khi lọc.` +
          `\n- Ưu tiên tool chuyên dụng (search_global, list_thiet_bi, list_table, count_by...).` +
          `\n- Khi JOIN dùng đúng khoá ngoại (FK) ở trên; luôn thêm LIMIT hợp lý.`;

        const writeBlock = canWrite === true
          ? `\n\n### Ghi dữ liệu (chỉ khi được yêu cầu)` +
            `\n- Bạn có các tool GHI: add_su_co, add_bao_tri, add_hong_hoc, add_kiem_ke.` +
            `\n- CHỈ gọi tool ghi khi người dùng yêu cầu rõ ràng tạo/lưu bản ghi. KHÔNG tự ý ghi.` +
            `\n- Mỗi lần ghi cần người dùng bấm xác nhận (hệ thống tự hỏi). Bạn chỉ chuẩn bị dữ liệu đúng và đủ trường bắt buộc.` +
            `\n- Với add_kiem_ke phải có id tài sản: dùng list_thiet_bi để tra id trước.` +
            `\n- Không sửa/xoá dữ liệu, không tạo bảng — chỉ được THÊM qua đúng các tool trên.`
          : `\n\n### Ghi dữ liệu\n- Bạn KHÔNG có quyền ghi. Nếu người dùng muốn thêm bản ghi, hãy hướng dẫn họ làm trong giao diện.`;

        const systemPrompt = (cfg.system_prompt ?? "") + schemaBlock + writeBlock;

        // Persist the LAST user message immediately (so history remains even if stream aborts)
        if (conversationId) {
          const last = messages[messages.length - 1];
          if (last && last.role === "user") {
            await supabase.from("ai_message").insert({
              conversation_id: conversationId,
              role: "user",
              content: last as unknown as Record<string, unknown>,
            });
          }
        }

        const modelMessages = await convertToModelMessages(messages);
        const result = streamText({
          model,
          system: systemPrompt,
          messages: modelMessages,
          tools,
          stopWhen: stepCountIs(50),
          maxOutputTokens: cfg.max_tokens || undefined,
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages,
          // Lưu trong onFinish của UIMessage stream: `messages` ở đây là UIMessage[]
          // (đã có `.parts`) nên UI đọc lại đúng shape sau khi reload.
          onFinish: async ({ messages: uiMessages }) => {
            if (!conversationId) return;
            const assistantMsgs = uiMessages.filter((m) => m.role === "assistant");
            for (const m of assistantMsgs) {
              await supabase.from("ai_message").insert({
                conversation_id: conversationId,
                role: "assistant",
                content: m as unknown as Record<string, unknown>,
              });
            }
            await supabase
              .from("ai_conversation")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", conversationId);
          },
        });
      },
    },
  },
});
