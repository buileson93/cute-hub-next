/**
 * Quét CSDL và gửi cảnh báo qua Telegram cho các subscriber phù hợp.
 * Gọi bởi cron (`/api/public/hooks/telegram-alerts`) hoặc admin thủ công.
 * Idempotent bằng bảng `telegram_da_gui` (UNIQUE loai+ref_id+chat_id).
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendMessage, escapeHtml } from "@/lib/telegram.server";

type Sub = {
  id: string;
  chat_id: string;
  ten: string;
  la_nhom: boolean;
  don_vi_id: string | null;
  cac_loai: string[];
  nguong_ngay: number;
  active: boolean;
};

type SendResult = {
  ok: number;
  failed: number;
  errors: Array<{ chat_id: string; loai: string; ref_id: string; error: string }>;
};

async function trySend(
  admin: SupabaseClient,
  sub: Sub,
  loai: string,
  ref_id: string,
  text: string,
  meta: Record<string, unknown>,
  res: SendResult,
) {
  // khử trùng lặp: insert vào bảng đã gửi trước; nếu trùng thì bỏ qua
  const { error: dupErr } = await admin
    .from("telegram_da_gui")
    .insert({ loai, ref_id, chat_id: sub.chat_id, ref_meta: meta });
  if (dupErr) {
    // 23505 = unique_violation → đã gửi trước đó
    if ((dupErr as { code?: string }).code === "23505") return;
    res.failed++;
    res.errors.push({ chat_id: sub.chat_id, loai, ref_id, error: dupErr.message });
    return;
  }
  try {
    await sendMessage(sub.chat_id, text);
    res.ok++;
  } catch (e) {
    res.failed++;
    res.errors.push({
      chat_id: sub.chat_id,
      loai,
      ref_id,
      error: e instanceof Error ? e.message : String(e),
    });
    // rollback marker để lần sau thử lại
    await admin
      .from("telegram_da_gui")
      .delete()
      .eq("loai", loai)
      .eq("ref_id", ref_id)
      .eq("chat_id", sub.chat_id);
  }
}

function matchDonVi(sub: Sub, donViId: string | null): boolean {
  if (!sub.la_nhom) return true; // cá nhân nhận tất cả
  if (!sub.don_vi_id) return true; // nhóm không lọc đơn vị
  return donViId === sub.don_vi_id;
}

export async function runTelegramAlerts(
  opts: { manual?: boolean } = {},
): Promise<SendResult & { subscribers: number }> {
  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
  const admin = supabaseAdmin as unknown as SupabaseClient;
  const res: SendResult = { ok: 0, failed: 0, errors: [] };

  const { data: subsRaw } = await admin.from("telegram_subscriber").select("*").eq("active", true);
  const subs = (subsRaw ?? []) as Sub[];
  if (subs.length === 0) return { ...res, subscribers: 0 };

  // 1) Giấy phép sắp hết hạn
  const anyGpSub = subs.some((s) => s.cac_loai.includes("gp_expiring"));
  if (anyGpSub) {
    const maxNguong = Math.max(
      ...subs.filter((s) => s.cac_loai.includes("gp_expiring")).map((s) => s.nguong_ngay),
    );
    const { data: gps } = await admin
      .from("v_giay_phep")
      .select(
        "id,so_giay_phep,ten_doi_tuong,don_vi_id,don_vi_ten,ngay_het_han,so_ngay_con_lai,trang_thai,bi_thay_the",
      )
      .in("trang_thai", ["valid", "expiring"])
      .lte("so_ngay_con_lai", maxNguong)
      .gte("so_ngay_con_lai", 0);

    for (const gp of gps ?? []) {
      const g = gp as {
        id: string;
        so_giay_phep: string | null;
        ten_doi_tuong: string | null;
        don_vi_id: string | null;
        don_vi_ten: string | null;
        ngay_het_han: string | null;
        so_ngay_con_lai: number | null;
        bi_thay_the: boolean | null;
      };
      if (g.bi_thay_the) continue;
      const daysLeft = g.so_ngay_con_lai ?? 999;
      // ngưỡng cột mốc để không spam mỗi ngày: chỉ gửi khi ≤ 90 và tại mốc 90/60/30/14/7/3/1
      const milestones = [90, 60, 30, 14, 7, 3, 1];
      if (!milestones.includes(daysLeft)) continue;
      const refId = `${g.id}:${daysLeft}`;
      const text =
        `⚠️ <b>Giấy phép sắp hết hạn (${daysLeft} ngày)</b>\n` +
        `• Hệ thống/Đối tượng: <b>${escapeHtml(g.ten_doi_tuong ?? "—")}</b>\n` +
        `• Số GP: <code>${escapeHtml(g.so_giay_phep ?? "—")}</code>\n` +
        `• Đơn vị: ${escapeHtml(g.don_vi_ten ?? "—")}\n` +
        `• Hết hạn: <b>${g.ngay_het_han ?? "—"}</b>`;
      for (const sub of subs) {
        if (!sub.cac_loai.includes("gp_expiring")) continue;
        if (daysLeft > sub.nguong_ngay) continue;
        if (!matchDonVi(sub, g.don_vi_id)) continue;
        await trySend(admin, sub, "gp_expiring", refId, text, { gp_id: g.id, daysLeft }, res);
      }
    }
  }

  // 2) Sự cố mới / cập nhật trạng thái trong 15 phút gần đây
  const anySuCoSub = subs.some((s) => s.cac_loai.includes("su_co"));
  if (anySuCoSub) {
    const since = new Date(Date.now() - 15 * 60_000).toISOString();
    const { data: sucos } = await admin
      .from("su_co")
      .select(
        "id,ma_su_co,hien_tuong,muc_do,trang_thai,snapshot_ten_thiet_bi,snapshot_he_thong,snapshot_don_vi,don_vi_id_snapshot,ngay_phat_hien,updated_at,created_at",
      )
      .or(`created_at.gte.${since},updated_at.gte.${since}`)
      .order("updated_at", { ascending: false })
      .limit(100);

    for (const sc of sucos ?? []) {
      const s = sc as {
        id: string;
        ma_su_co: string | null;
        hien_tuong: string | null;
        muc_do: string | null;
        trang_thai: string | null;
        snapshot_ten_thiet_bi: string | null;
        snapshot_he_thong: string | null;
        snapshot_don_vi: string | null;
        don_vi_id_snapshot: string | null;
        ngay_phat_hien: string | null;
        updated_at: string;
        created_at: string;
      };
      const isNew = s.created_at >= since;
      const refId = isNew ? `new:${s.id}` : `upd:${s.id}:${s.trang_thai ?? ""}`;
      const head = isNew ? "🚨 <b>Sự cố mới</b>" : "🔄 <b>Cập nhật sự cố</b>";
      const text =
        `${head} <code>${escapeHtml(s.ma_su_co ?? s.id.slice(0, 8))}</code>\n` +
        `• Mức độ: <b>${escapeHtml(s.muc_do ?? "—")}</b> · Trạng thái: ${escapeHtml(s.trang_thai ?? "—")}\n` +
        `• Tài sản: ${escapeHtml(s.snapshot_ten_thiet_bi ?? "—")}\n` +
        `• Hệ thống: ${escapeHtml(s.snapshot_he_thong ?? "—")} · Đơn vị: ${escapeHtml(s.snapshot_don_vi ?? "—")}\n` +
        (s.hien_tuong ? `• Hiện tượng: ${escapeHtml(s.hien_tuong).slice(0, 400)}` : "");
      for (const sub of subs) {
        if (!sub.cac_loai.includes("su_co")) continue;
        if (!matchDonVi(sub, s.don_vi_id_snapshot)) continue;
        await trySend(admin, sub, "su_co", refId, text, { su_co_id: s.id, isNew }, res);
      }
    }
  }

  // 3) Bảo dưỡng & kiểm kê đến hạn (7/3/1/0 ngày)
  const anyBtSub = subs.some((s) => s.cac_loai.includes("bao_tri_kiem_ke"));
  if (anyBtSub) {
    const today = new Date();
    const in7 = new Date(today.getTime() + 7 * 86400_000).toISOString().slice(0, 10);
    const todayStr = today.toISOString().slice(0, 10);

    // Bảo dưỡng có kế hoạch → hôm nay/quá hạn
    const { data: bts } = await admin
      .from("bao_tri")
      .select(
        "id,ma_bao_tri,ke_hoach,ngay_bat_dau,ngay_hoan_thanh,trang_thai,snapshot_ten_thiet_bi,snapshot_he_thong,snapshot_don_vi,don_vi_id_snapshot",
      )
      .not("ke_hoach", "is", null)
      .lte("ke_hoach", in7)
      .is("ngay_hoan_thanh", null)
      .limit(200);

    for (const bt of bts ?? []) {
      const b = bt as {
        id: string;
        ma_bao_tri: string | null;
        ke_hoach: string | null;
        snapshot_ten_thiet_bi: string | null;
        snapshot_he_thong: string | null;
        snapshot_don_vi: string | null;
        don_vi_id_snapshot: string | null;
      };
      if (!b.ke_hoach) continue;
      const days = Math.floor((new Date(b.ke_hoach).getTime() - today.getTime()) / 86400_000);
      const milestones = [7, 3, 1, 0];
      if (!milestones.includes(days) && days > -1) continue;
      const overdue = days < 0;
      const refId = overdue ? `bt-overdue:${b.id}:${todayStr}` : `bt:${b.id}:${days}`;
      const text =
        `${overdue ? "⛔ <b>Bảo dưỡng QUÁ HẠN</b>" : `🛠️ <b>Bảo dưỡng đến hạn (${days} ngày)</b>`} <code>${escapeHtml(b.ma_bao_tri ?? "")}</code>\n` +
        `• Tài sản: ${escapeHtml(b.snapshot_ten_thiet_bi ?? "—")}\n` +
        `• Hệ thống: ${escapeHtml(b.snapshot_he_thong ?? "—")} · Đơn vị: ${escapeHtml(b.snapshot_don_vi ?? "—")}\n` +
        `• Kế hoạch: <b>${b.ke_hoach}</b>`;
      for (const sub of subs) {
        if (!sub.cac_loai.includes("bao_tri_kiem_ke")) continue;
        if (!matchDonVi(sub, b.don_vi_id_snapshot)) continue;
        await trySend(admin, sub, "bao_tri", refId, text, { bao_tri_id: b.id, days }, res);
      }
    }

    // Kiểm kê đến hạn (ngay_kiem_ke_ke_tiep của tài sản)
    const { data: tbs } = await admin
      .from("thiet_bi")
      .select("id,ma_thiet_bi,ten_thiet_bi,don_vi_id,ngay_kiem_ke_ke_tiep")
      .not("ngay_kiem_ke_ke_tiep", "is", null)
      .lte("ngay_kiem_ke_ke_tiep", in7)
      .limit(500);

    for (const tb of tbs ?? []) {
      const t = tb as {
        id: string;
        ma_thiet_bi: string | null;
        ten_thiet_bi: string | null;
        don_vi_id: string | null;
        ngay_kiem_ke_ke_tiep: string | null;
      };
      if (!t.ngay_kiem_ke_ke_tiep) continue;
      const days = Math.floor(
        (new Date(t.ngay_kiem_ke_ke_tiep).getTime() - today.getTime()) / 86400_000,
      );
      const milestones = [7, 3, 1, 0];
      if (!milestones.includes(days) && days > -1) continue;
      const overdue = days < 0;
      const refId = overdue ? `kk-overdue:${t.id}:${todayStr}` : `kk:${t.id}:${days}`;
      const text =
        `${overdue ? "⛔ <b>Kiểm kê QUÁ HẠN</b>" : `📋 <b>Kiểm kê đến hạn (${days} ngày)</b>`}\n` +
        `• Tài sản: <b>${escapeHtml(t.ten_thiet_bi ?? "—")}</b> <code>${escapeHtml(t.ma_thiet_bi ?? "")}</code>\n` +
        `• Ngày kiểm kê kế tiếp: <b>${t.ngay_kiem_ke_ke_tiep}</b>`;
      for (const sub of subs) {
        if (!sub.cac_loai.includes("bao_tri_kiem_ke")) continue;
        if (!matchDonVi(sub, t.don_vi_id)) continue;
        await trySend(admin, sub, "kiem_ke", refId, text, { thiet_bi_id: t.id, days }, res);
      }
    }
  }

  void opts;
  return { ...res, subscribers: subs.length };
}
