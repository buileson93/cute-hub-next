import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { buildAlerts, type AlertItem, type LoaiCanhBao } from "@/lib/mirats/canh-bao";
import { verifyApiSecret, auditPublicApiCall } from "@/lib/api-security.server";

interface SapHetHanRow {
  loai: string;
  thiet_bi_id: string | null;
  ten: string | null;
  ngay_het_han: string;
}

interface GiayPhepRow {
  id: string;
  thiet_bi_id: string | null;
  he_thong_id: string | null;
  don_vi_id: string | null;
  so_giay_phep: string | null;
  ten_doi_tuong: string | null;
  ngay_het_han: string | null;
  bi_thay_the: boolean | null;
}

async function loadItems(
  supabase: ReturnType<typeof createClient<any, "public">>,
): Promise<AlertItem[]> {
  const items: AlertItem[] = [];
  const { data: sap, error: e1 } = await supabase.from("v_sap_het_han").select("loai,thiet_bi_id,ten,ngay_het_han").not("ngay_het_han", "is", null);
  if (e1) throw e1;

  const tbIds = Array.from(new Set(((sap ?? []) as SapHetHanRow[]).map((r) => r.thiet_bi_id).filter(Boolean) as string[]));
  const donViMap = new Map<string, string | null>();
  if (tbIds.length > 0) {
    const { data: tbs } = await supabase.from("thiet_bi").select("id,don_vi_id").in("id", tbIds);
    for (const t of (tbs ?? []) as { id: string; don_vi_id: string | null }[]) {
      donViMap.set(t.id, t.don_vi_id);
    }
  }

  for (const r of (sap ?? []) as SapHetHanRow[]) {
    if (!r.ngay_het_han || !r.thiet_bi_id) continue;
    let loai: LoaiCanhBao;
    let doi_tuong_bang = "thiet_bi";
    if (r.loai === "bao_hanh") loai = "bao_hanh";
    else if (r.loai === "giay_phep") continue;
    else if (r.loai === "chung_chi") {
      const t = r.ten ?? "";
      if (/—\s*KIEM_DINH/i.test(t)) loai = "chung_chi_kd";
      else if (/—\s*HIEU_CHUAN/i.test(t)) loai = "chung_chi_hc";
      else continue;
      doi_tuong_bang = "chung_chi_thiet_bi";
    } else continue;

    items.push({ loai, doi_tuong_bang, doi_tuong_ref: r.thiet_bi_id, don_vi_id: donViMap.get(r.thiet_bi_id) ?? null, ten: r.ten, ngay_het_han: r.ngay_het_han });
  }

  const { data: gp, error: e2 } = await supabase.from("v_giay_phep").select("id,thiet_bi_id,he_thong_id,don_vi_id,so_giay_phep,ten_doi_tuong,ngay_het_han,bi_thay_the").not("ngay_het_han", "is", null).eq("bi_thay_the", false);
  if (e2) throw e2;

  for (const g of (gp ?? []) as GiayPhepRow[]) {
    if (!g.ngay_het_han) continue;
    items.push({ loai: "giay_phep", doi_tuong_bang: "giay_phep", doi_tuong_ref: g.id, don_vi_id: g.don_vi_id, ten: g.so_giay_phep ?? g.ten_doi_tuong, ngay_het_han: g.ngay_het_han });
  }
  return items;
}

export const Route = createFileRoute("/api/public/hooks/scan-canh-bao")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const endpoint = "scan-canh-bao";
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();

        try {
          // 1. Bảo mật: Yêu cầu CRON_SECRET
          const { authorized, errorStatus } = await verifyApiSecret(request, "CRON_SECRET", "x-cron-secret");
          if (!authorized) {
            await auditPublicApiCall(endpoint, "unauthorized", { requestId, status: errorStatus });
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { 
              status: errorStatus || 401,
              headers: { "Content-Type": "application/json" }
            });
          }

          const url = process.env.SUPABASE_URL;
          const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (!url || !key) throw new Error("missing env");
          
          const supabase = createClient(url, key, { auth: { persistSession: false } });

          const { data: cfg } = await supabase.from("thong_bao_cau_hinh").select("nguong").eq("scope", "global").limit(1).maybeSingle();
          const thresholds = (cfg?.nguong as number[] | undefined) ?? [30, 15, 7];

          const items = await loadItems(supabase);
          const alerts = buildAlerts(items, { thresholds });

          if (alerts.length === 0) {
            await auditPublicApiCall(endpoint, "success", { requestId, scanned: items.length, inserted: 0 });
            return Response.json({ ok: true, scanned: items.length, inserted: 0 });
          }

          const rows = alerts.map((a) => ({
            loai: a.loai,
            doi_tuong_bang: a.doi_tuong_bang,
            doi_tuong_ref: a.doi_tuong_ref,
            don_vi_id: a.don_vi_id,
            muc_do: a.muc_do,
            nguong: a.nguong === "overdue" ? null : a.nguong,
            tieu_de: a.tieu_de,
            noi_dung: a.noi_dung,
            den_han_at: a.ngay_het_han.slice(0, 10),
            khoa_chong_trung: a.khoa_chong_trung,
          }));

          const { data: ins, error: eIns } = await supabase.from("thong_bao").upsert(rows, { onConflict: "khoa_chong_trung", ignoreDuplicates: true }).select("id");
          if (eIns) throw eIns;

          const inserted = ins?.length ?? 0;
          await auditPublicApiCall(endpoint, "success", { requestId, scanned: items.length, generated: alerts.length, inserted });

          return Response.json({ ok: true, scanned: items.length, generated: alerts.length, inserted });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`[${endpoint}]`, msg);
          await auditPublicApiCall(endpoint, "error", { requestId, error: msg });
          return new Response(JSON.stringify({ ok: false, error: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
