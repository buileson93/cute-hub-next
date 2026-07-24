import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SubscriberInput = z.object({
  chat_id: z.string().min(1).max(64),
  ten: z.string().min(1).max(200),
  la_nhom: z.boolean().default(false),
  don_vi_id: z.string().nullable().optional(),
  cac_loai: z.array(z.enum(["gp_expiring", "su_co", "bao_tri_kiem_ke", "bao_cao_dinh_ky"])).min(1),
  nguong_ngay: z.number().int().min(1).max(365).default(90),
  gio_gui: z.number().int().min(0).max(23).default(8),
  active: z.boolean().default(true),
});

export const upsertSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.infer<typeof SubscriberInput> & { id?: string }) => ({ ...SubscriberInput.parse(d), id: d.id }))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      chat_id: data.chat_id.trim(),
      ten: data.ten.trim(),
      la_nhom: data.la_nhom,
      don_vi_id: data.don_vi_id ?? null,
      cac_loai: data.cac_loai,
      nguong_ngay: data.nguong_ngay,
      gio_gui: data.gio_gui,
      active: data.active,
      user_id: data.la_nhom ? null : userId,
      created_by: userId,
    };
    if (data.id) {
      const { data: row, error } = await supabase.from("telegram_subscriber").update(payload).eq("id", data.id).select().single();
      if (error) throw new Error(error.message);
      return row;
    }
    const { data: row, error } = await supabase.from("telegram_subscriber").upsert(payload, { onConflict: "chat_id" }).select().single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteSubscriber = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: z.string().uuid().parse(d.id) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("telegram_subscriber").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { chat_id: string; ten?: string }) => ({
    chat_id: z.string().min(1).parse(d.chat_id),
    ten: d.ten ?? "",
  }))
  .handler(async ({ data }) => {
    const { sendMessage, escapeHtml } = await import("@/lib/telegram.server");
    const hello = data.ten ? escapeHtml(data.ten) : "bạn";
    await sendMessage(
      data.chat_id,
      `✅ <b>MIRATS</b> đã kết nối Telegram thành công.\n\nChào ${hello}! Bạn sẽ nhận được cảnh báo giấy phép, sự cố và bảo dưỡng tại chat này.`,
    );
    return { ok: true };
  });

export const runTelegramAlertsNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Chỉ admin được kích hoạt gửi thủ công.");
    const { runTelegramAlerts } = await import("@/lib/telegram-alerts.server");
    return runTelegramAlerts({ manual: true });
  });
