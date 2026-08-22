/**
 * Sinh báo cáo độ tin cậy định kỳ (tuần/tháng) và gửi qua Telegram.
 * Gọi bởi cron `/api/public/hooks/reliability-report` với body {type:"weekly"|"monthly"}.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMessage, escapeHtml } from "@/lib/telegram.server";

export type ReportType = "weekly" | "monthly";

type Sub = {
  id: string;
  chat_id: string;
  ten: string;
  cac_loai: string[];
  active: boolean;
};

function periodRange(type: ReportType): { from: string; to: string; label: string } {
  const now = new Date();
  const to = new Date(now);
  const from = new Date(now);
  if (type === "weekly") {
    from.setDate(now.getDate() - 7);
    return { from: from.toISOString(), to: to.toISOString(), label: "tuần qua (7 ngày)" };
  }
  from.setDate(now.getDate() - 30);
  return { from: from.toISOString(), to: to.toISOString(), label: "tháng qua (30 ngày)" };
}

function fmtMinutes(mins: number | null): string {
  if (mins == null || !isFinite(mins)) return "—";
  if (mins < 60) return `${Math.round(mins)} phút`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m > 0 ? m + "m" : ""}`;
}

export async function buildReliabilityMessage(
  admin: SupabaseClient,
  type: ReportType,
): Promise<string> {
  const { from, to, label } = periodRange(type);

  const { data: rows } = await admin
    .from("su_co")
    .select(
      "id,muc_do,trang_thai,snapshot_he_thong,snapshot_don_vi,ngay_phat_hien,ngay_ket_thuc,created_at",
    )
    .gte("created_at", from)
    .lte("created_at", to)
    .limit(5000);

  const list = (rows ?? []) as Array<{
    id: string;
    muc_do: string | null;
    trang_thai: string | null;
    snapshot_he_thong: string | null;
    snapshot_don_vi: string | null;
    ngay_phat_hien: string | null;
    ngay_ket_thuc: string | null;
    created_at: string;
  }>;

  const total = list.length;
  const closed = list.filter((r) => r.ngay_ket_thuc).length;
  const open = total - closed;
  const critical = list.filter(
    (r) =>
      (r.muc_do ?? "").toLowerCase().includes("nghiem") || (r.muc_do ?? "").toLowerCase() === "cao",
  ).length;

  // MTTR (phút) trên sự cố đã đóng
  const mttrs = list
    .filter((r) => r.ngay_ket_thuc && r.ngay_phat_hien)
    .map(
      (r) =>
        (new Date(r.ngay_ket_thuc as string).getTime() -
          new Date(r.ngay_phat_hien as string).getTime()) /
        60000,
    )
    .filter((v) => v > 0 && isFinite(v));
  const mttr = mttrs.length ? mttrs.reduce((a, b) => a + b, 0) / mttrs.length : null;

  // Top 5 hệ thống nhiều sự cố nhất
  const byHT = new Map<string, number>();
  for (const r of list) {
    const k = r.snapshot_he_thong ?? "—";
    byHT.set(k, (byHT.get(k) ?? 0) + 1);
  }
  const top = [...byHT.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines: string[] = [];
  lines.push(`📊 <b>Báo cáo độ tin cậy — ${label}</b>`);
  lines.push(
    `• Tổng sự cố: <b>${total}</b> · Đã đóng: <b>${closed}</b> · Đang xử lý: <b>${open}</b>`,
  );
  lines.push(
    `• Nghiêm trọng/cao: <b>${critical}</b> · MTTR trung bình: <b>${fmtMinutes(mttr)}</b>`,
  );
  if (top.length) {
    lines.push("");
    lines.push("<b>Top hệ thống có sự cố:</b>");
    for (const [ten, n] of top) lines.push(`  • ${escapeHtml(ten)}: <b>${n}</b>`);
  }
  lines.push("");
  lines.push(`⏱️ Sinh lúc ${new Date().toLocaleString("vi-VN")}`);
  return lines.join("\n");
}

export async function runReliabilityReport(
  type: ReportType,
): Promise<{ subscribers: number; sent: number; failed: number }> {
  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
  const admin = supabaseAdmin as unknown as SupabaseClient;

  const { data: subsRaw } = await admin
    .from("telegram_subscriber")
    .select("id,chat_id,ten,cac_loai,active")
    .eq("active", true);
  const subs = ((subsRaw ?? []) as Sub[]).filter((s) => s.cac_loai.includes("bao_cao_dinh_ky"));
  if (subs.length === 0) return { subscribers: 0, sent: 0, failed: 0 };

  const text = await buildReliabilityMessage(admin, type);

  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    try {
      await sendMessage(s.chat_id, text);
      sent++;
    } catch {
      failed++;
    }
  }
  return { subscribers: subs.length, sent, failed };
}
