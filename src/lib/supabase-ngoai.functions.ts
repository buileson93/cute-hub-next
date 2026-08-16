import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import {
  normUrl,
  targetHeaders,
  mask,
  type BaoCaoTuongThich,
  type Phien,
  type PhienBang,
} from "@/lib/supabase-ngoai-core";

/**
 * Quản trị hệ thống — Kết nối Supabase bên ngoài.
 *
 * Toàn bộ hàm dưới đây yêu cầu vai trò `admin` (kiểm tra qua RPC has_role bằng
 * phiên của chính người gọi) và đều ghi nhật ký kiểm toán (audit_log).
 * Khoá bí mật chỉ nằm ở máy chủ; trình duyệt chỉ thấy bản che.
 */

/* ------------------------------------------------------------------ */
/* Hạ tầng chung                                                       */
/* ------------------------------------------------------------------ */

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
  return supabaseAdmin as any;
}

/** Bảo vệ: chỉ Admin hệ thống + ghi audit cho mọi thao tác. */
async function guard(context: any, action: string, detail: Record<string, unknown> = {}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  const ok = !error && !!data;
  const sb = await admin();
  try {
    await sb.from("audit_log").insert({
      user_id: context.userId,
      action: `supabase_ngoai.${action}`,
      entity: "supabase_ngoai",
      entity_id: (detail.id as string) ?? null,
      detail: { ...detail, cho_phep: ok },
      severity: ok ? "info" : "critical",
    });
  } catch {
    /* nhật ký lỗi không được chặn nghiệp vụ */
  }
  if (!ok) throw new Error("Forbidden: chỉ Admin hệ thống được thao tác trang này");
  return sb;
}

async function layCauHinh(sb: any, id: string, canServiceKey = true) {
  const { data, error } = await sb.from("supabase_ngoai").select("*").eq("id", id).single();
  if (error || !data) throw new Error("Không tìm thấy cấu hình");
  if (canServiceKey && !data.service_role_key)
    throw new Error("Cần khoá bí mật (service role) của Supabase đích");
  return data;
}

/** Thử chạy SQL trên Supabase đích qua RPC trợ giúp (nếu dự án đích có). */
async function execTarget(cfg: any, sql: string): Promise<{ ok: boolean; via: string | null; message?: string }> {
  const url = normUrl(cfg.url);
  const ungVien: { fn: string; body: Record<string, string> }[] = [
    { fn: "__restore_exec", body: { p_sql: sql } },
    { fn: "__restore_exec", body: { sql } },
    { fn: "exec_sql", body: { sql } },
    { fn: "exec_sql", body: { query: sql } },
  ];
  let last = "";
  for (const c of ungVien) {
    try {
      const r = await fetch(`${url}/rest/v1/rpc/${c.fn}`, {
        method: "POST",
        headers: targetHeaders(cfg.service_role_key),
        body: JSON.stringify(c.body),
      });
      if (r.ok) return { ok: true, via: c.fn };
      last = `${r.status} ${(await r.text()).slice(0, 200)}`;
    } catch (e: any) {
      last = e?.message ?? "lỗi mạng";
    }
  }
  return { ok: false, via: null, message: last };
}

/** Đọc lược đồ đích qua OpenAPI của PostgREST: { bảng → tập cột }. */
async function lucDoDich(cfg: any): Promise<Map<string, Set<string>> | null> {
  try {
    const r = await fetch(`${normUrl(cfg.url)}/rest/v1/`, { headers: targetHeaders(cfg.service_role_key) });
    if (!r.ok) return null;
    const spec: any = await r.json();
    const defs = spec?.definitions ?? spec?.components?.schemas ?? {};
    const m = new Map<string, Set<string>>();
    for (const [k, v] of Object.entries<any>(defs)) {
      m.set(k.replace(/^\//, ""), new Set(Object.keys(v?.properties ?? {})));
    }
    return m;
  } catch {
    return null;
  }
}

async function demDongDich(cfg: any, table: string): Promise<number | null> {
  try {
    const r = await fetch(`${normUrl(cfg.url)}/rest/v1/${encodeURIComponent(table)}?select=*&limit=1`, {
      headers: targetHeaders(cfg.service_role_key, { Prefer: "count=exact", Range: "0-0" }),
    });
    const cr = r.headers.get("content-range");
    const tong = cr?.split("/")?.[1];
    return tong && tong !== "*" ? Number(tong) : null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* CRUD cấu hình                                                       */
/* ------------------------------------------------------------------ */

export type SupabaseNgoai = {
  id: string;
  ten: string;
  url: string;
  publishable_key_masked: string | null;
  service_role_key_masked: string | null;
  co_service_key: boolean;
  ghi_chu: string | null;
  kich_hoat: boolean;
  kiem_tra_luc: string | null;
  kiem_tra_ket_qua: any;
  created_at: string;
};

function toDto(r: any): SupabaseNgoai {
  return {
    id: r.id,
    ten: r.ten,
    url: r.url,
    publishable_key_masked: mask(r.publishable_key),
    service_role_key_masked: mask(r.service_role_key),
    co_service_key: !!r.service_role_key,
    ghi_chu: r.ghi_chu,
    kich_hoat: r.kich_hoat,
    kiem_tra_luc: r.kiem_tra_luc,
    kiem_tra_ket_qua: r.kiem_tra_ket_qua,
    created_at: r.created_at,
  };
}

export const listSupabaseNgoai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SupabaseNgoai[]> => {
    const sb = await guard(context, "list");
    const { data, error } = await sb
      .from("supabase_ngoai")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toDto);
  });

export const saveSupabaseNgoai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid().optional(),
        ten: z.string().min(1).max(120),
        url: z.string().url().max(300),
        publishable_key: z.string().min(10).max(2000).optional(),
        service_role_key: z.string().min(10).max(4000).optional(),
        ghi_chu: z.string().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "save", { id: data.id, url: data.url, ten: data.ten });
    const patch: Record<string, unknown> = {
      ten: data.ten,
      url: normUrl(data.url),
      ghi_chu: data.ghi_chu ?? null,
    };
    if (data.publishable_key) patch.publishable_key = data.publishable_key.trim();
    if (data.service_role_key) patch.service_role_key = data.service_role_key.trim();

    if (data.id) {
      const { error } = await sb.from("supabase_ngoai").update(patch).eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    if (!patch.publishable_key) throw new Error("Cần khoá công khai (publishable/anon key)");
    const { data: row, error } = await sb
      .from("supabase_ngoai")
      .insert({ ...patch, created_by: context.userId })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string };
  });

export const deleteSupabaseNgoai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "delete", { id: data.id });
    const { error } = await sb.from("supabase_ngoai").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ------------------------------------------------------------------ */
/* Kiểm tra kết nối trực tiếp                                          */
/* ------------------------------------------------------------------ */

export type KetQuaKiemTra = {
  ok: boolean;
  luc: string;
  do_tre_ms: number;
  rest: { ok: boolean; status: number; message?: string };
  service: { ok: boolean; status: number; message?: string };
  auth: { ok: boolean; so_tai_khoan?: number; message?: string };
  bang_thieu: string[];
  bang_co: number;
};

export const testSupabaseNgoai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<KetQuaKiemTra> => {
    const sb = await guard(context, "test", { id: data.id });
    const cfg = await layCauHinh(sb, data.id, false);

    const t0 = Date.now();
    const url = normUrl(cfg.url);
    const res: KetQuaKiemTra = {
      ok: false,
      luc: new Date().toISOString(),
      do_tre_ms: 0,
      rest: { ok: false, status: 0 },
      service: { ok: false, status: 0 },
      auth: { ok: false },
      bang_thieu: [],
      bang_co: 0,
    };

    try {
      const r = await fetch(`${url}/rest/v1/`, { headers: targetHeaders(cfg.publishable_key) });
      res.rest = { ok: r.ok, status: r.status, message: r.ok ? undefined : (await r.text()).slice(0, 300) };
    } catch (e: any) {
      res.rest = { ok: false, status: 0, message: e?.message ?? "Không kết nối được" };
    }

    if (cfg.service_role_key) {
      try {
        const r = await fetch(`${url}/rest/v1/`, { headers: targetHeaders(cfg.service_role_key) });
        res.service = { ok: r.ok, status: r.status, message: r.ok ? undefined : (await r.text()).slice(0, 300) };
        if (r.ok) {
          const dich = await lucDoDich(cfg);
          const { data: tbls } = await sb.rpc("admin_list_backup_tables");
          const names: string[] = (tbls ?? []).map((x: any) => x.table_name);
          res.bang_thieu = dich ? names.filter((n) => !dich.has(n)) : names;
          res.bang_co = names.length - res.bang_thieu.length;
        }
      } catch (e: any) {
        res.service = { ok: false, status: 0, message: e?.message ?? "Không kết nối được" };
      }

      try {
        const r = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
          headers: targetHeaders(cfg.service_role_key),
        });
        if (r.ok) {
          const j: any = await r.json().catch(() => ({}));
          res.auth = { ok: true, so_tai_khoan: j?.total ?? (j?.users?.length ?? 0) };
        } else {
          res.auth = { ok: false, message: `${r.status} ${(await r.text()).slice(0, 200)}` };
        }
      } catch (e: any) {
        res.auth = { ok: false, message: e?.message };
      }
    } else {
      res.service = { ok: false, status: 0, message: "Chưa nhập khoá bí mật (service role)" };
    }

    res.do_tre_ms = Date.now() - t0;
    res.ok = res.rest.ok && res.service.ok;

    await sb.from("supabase_ngoai").update({ kiem_tra_luc: res.luc, kiem_tra_ket_qua: res }).eq("id", data.id);
    return res;
  });

/* ------------------------------------------------------------------ */
/* Đối chiếu lược đồ / RLS / extension                                 */
/* ------------------------------------------------------------------ */

export const kiemTraTuongThich = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<BaoCaoTuongThich> => {
    const sb = await guard(context, "kiem_tra_tuong_thich", { id: data.id });
    const cfg = await layCauHinh(sb, data.id);

    const { data: snap, error } = await sb.rpc("mirats_schema_snapshot");
    if (error) throw new Error(error.message);
    const dich = await lucDoDich(cfg);

    const bc: BaoCaoTuongThich = {
      tuong_thich: false,
      luc: new Date().toISOString(),
      thieu_bang: [],
      thieu_cot: [],
      thieu_extension: [],
      thieu_policy: 0,
      bang_dich: dich?.size ?? 0,
      bang_nguon: (snap?.tables ?? []).length,
      canh_bao: [],
    };

    if (!dich) {
      bc.canh_bao.push("Không đọc được lược đồ của Supabase đích (REST không phản hồi).");
      return bc;
    }

    for (const t of snap?.tables ?? []) {
      const cotDich = dich.get(t.name);
      if (!cotDich) {
        bc.thieu_bang.push(t.name);
        continue;
      }
      const thieu = (t.columns ?? []).map((c: any) => c.name).filter((c: string) => !cotDich.has(c));
      if (thieu.length) bc.thieu_cot.push({ bang: t.name, cot: thieu });
    }

    // Extension và policy chỉ đọc được khi dự án đích có RPC trợ giúp.
    const ext = (snap?.extensions ?? []).map((e: any) => e.name as string);
    const probe = await execTarget(cfg, "select 1");
    if (!probe.ok) {
      bc.thieu_extension = ext;
      bc.canh_bao.push(
        "Chưa kiểm tra được tiện ích mở rộng và chính sách RLS ở đích (dự án đích chưa có hàm chạy SQL). Bấm “Đồng bộ lược đồ” để nhận câu lệnh SQL cần chạy thủ công một lần.",
      );
    }
    if ((snap?.policies ?? []).length === 0) bc.canh_bao.push("Nguồn không có chính sách RLS nào.");

    bc.tuong_thich = bc.thieu_bang.length === 0 && bc.thieu_cot.length === 0;
    if (!bc.tuong_thich)
      bc.canh_bao.push("Lược đồ đích chưa khớp — cần đồng bộ trước khi import dữ liệu hoặc chuyển nguồn.");

    await sb.from("supabase_ngoai").update({ kiem_tra_luc: bc.luc }).eq("id", data.id);
    return bc;
  });

/** Sinh (và áp dụng nếu có thể) toàn bộ DDL: extension, kiểu, hàm, bảng, cột, RLS, policy. */
export const dongBoLucDo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), ap_dung: z.boolean().default(true) }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "dong_bo_luoc_do", { id: data.id, ap_dung: data.ap_dung });
    const cfg = await layCauHinh(sb, data.id);

    const { data: stmts, error } = await sb.rpc("mirats_ddl_dong_bo");
    if (error) throw new Error(error.message);
    const cauLenh: string[] = stmts ?? [];

    if (!data.ap_dung) {
      return { ap_dung: false, tong: cauLenh.length, thanh_cong: 0, that_bai: 0, loi: [] as string[], sql: cauLenh.join(";\n") + ";" };
    }

    const probe = await execTarget(cfg, "select 1");
    if (!probe.ok) {
      return {
        ap_dung: false,
        tong: cauLenh.length,
        thanh_cong: 0,
        that_bai: 0,
        loi: [
          "Dự án đích chưa có hàm chạy SQL. Hãy chạy một lần trong SQL editor của dự án đích: " +
            "create or replace function public.__restore_exec(p_sql text) returns void language plpgsql security definer as $$ begin execute p_sql; end $$; " +
            "grant execute on function public.__restore_exec(text) to service_role;",
        ],
        sql: cauLenh.join(";\n") + ";",
      };
    }

    // Gộp theo lô để giảm số vòng gọi mạng.
    const LO = 40;
    let thanh_cong = 0;
    let that_bai = 0;
    const loi: string[] = [];
    for (let i = 0; i < cauLenh.length; i += LO) {
      const lo = cauLenh.slice(i, i + LO);
      const r = await execTarget(cfg, lo.join(";\n") + ";");
      if (r.ok) {
        thanh_cong += lo.length;
        continue;
      }
      // Lô lỗi → chạy lại từng câu để bỏ qua câu hỏng.
      for (const s of lo) {
        const one = await execTarget(cfg, s + ";");
        if (one.ok) thanh_cong++;
        else {
          that_bai++;
          if (loi.length < 20) loi.push(`${s.slice(0, 90)}… → ${one.message ?? ""}`);
        }
      }
    }
    return { ap_dung: true, tong: cauLenh.length, thanh_cong, that_bai, loi, sql: "" };
  });

/* ------------------------------------------------------------------ */
/* Phiên di chuyển dữ liệu (có thể chạy thử, tạm dừng, chạy tiếp)      */
/* ------------------------------------------------------------------ */

async function docPhien(sb: any, jobId: string): Promise<Phien> {
  const { data: job, error } = await sb.from("supabase_ngoai_job").select("*").eq("id", jobId).single();
  if (error || !job) throw new Error("Không tìm thấy phiên di chuyển");
  const { data: bang } = await sb
    .from("supabase_ngoai_job_bang")
    .select("*")
    .eq("job_id", jobId)
    .order("ten_bang");
  return {
    id: job.id,
    ngoai_id: job.ngoai_id,
    che_do: job.che_do,
    trang_thai: job.trang_thai,
    tong_dong: Number(job.tong_dong),
    da_chuyen: Number(job.da_chuyen),
    bat_dau: job.bat_dau,
    ket_thuc: job.ket_thuc,
    loi: job.loi,
    bang: (bang ?? []).map(
      (b: any): PhienBang => ({
        ten_bang: b.ten_bang,
        tong_dong: Number(b.tong_dong),
        da_chuyen: Number(b.da_chuyen),
        offset_tiep: Number(b.offset_tiep),
        dich_dong_truoc: b.dich_dong_truoc === null ? null : Number(b.dich_dong_truoc),
        trang_thai: b.trang_thai,
        loi: b.loi,
      }),
    ),
  };
}

/** Tạo phiên mới: đếm dòng nguồn + dòng sẵn có ở đích (mốc khôi phục). */
export const taoPhienDiChuyen = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid(), che_do: z.enum(["dry_run", "that"]) }).parse(i))
  .handler(async ({ data, context }): Promise<Phien> => {
    const sb = await guard(context, "tao_phien", { id: data.id, che_do: data.che_do });
    const cfg = await layCauHinh(sb, data.id);

    const { data: tbls, error } = await sb.rpc("admin_list_backup_tables");
    if (error) throw new Error(error.message);
    const names: string[] = (tbls ?? []).map((x: any) => x.table_name);

    const { data: job, error: e2 } = await sb
      .from("supabase_ngoai_job")
      .insert({ ngoai_id: data.id, che_do: data.che_do, created_by: context.userId })
      .select("id")
      .single();
    if (e2) throw new Error(e2.message);

    const rows: any[] = [];
    let tong = 0;
    for (const name of names) {
      const { count } = await sb.from(name).select("*", { count: "exact", head: true });
      const nguon = count ?? 0;
      tong += nguon;
      rows.push({
        job_id: job.id,
        ten_bang: name,
        tong_dong: nguon,
        dich_dong_truoc: await demDongDich(cfg, name),
        trang_thai: nguon === 0 ? "bo_qua" : "cho",
      });
    }
    await sb.from("supabase_ngoai_job_bang").insert(rows);
    await sb
      .from("supabase_ngoai_job")
      .update({
        tong_dong: tong,
        trang_thai: data.che_do === "dry_run" ? "hoan_thanh" : "dang_chay",
        ket_thuc: data.che_do === "dry_run" ? new Date().toISOString() : null,
      })
      .eq("id", job.id);

    return docPhien(sb, job.id);
  });

export const layPhien = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ job_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<Phien> => {
    const sb = await guard(context, "xem_phien", { id: data.job_id });
    return docPhien(sb, data.job_id);
  });

export const phienGanNhat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }): Promise<Phien | null> => {
    const sb = await guard(context, "xem_phien_gan_nhat", { id: data.id });
    const { data: job } = await sb
      .from("supabase_ngoai_job")
      .select("id")
      .eq("ngoai_id", data.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return job ? docPhien(sb, job.id) : null;
  });

/** Chuyển tiếp một lô của một bảng — có thể gọi song song nhiều bảng. */
export const chuyenLo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        job_id: z.string().uuid(),
        table: z.string().min(1).max(120),
        limit: z.number().int().min(50).max(1000).default(500),
      })
      .parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "chuyen_lo", { id: data.job_id, bang: data.table });
    const { data: job } = await sb
      .from("supabase_ngoai_job")
      .select("id,ngoai_id,che_do,trang_thai")
      .eq("id", data.job_id)
      .single();
    if (!job) throw new Error("Không tìm thấy phiên");
    if (job.che_do === "dry_run") throw new Error("Phiên chạy thử không ghi dữ liệu");
    if (job.trang_thai === "tam_dung") return { sent: 0, done: false, tam_dung: true, error: null as string | null };

    const cfg = await layCauHinh(sb, job.ngoai_id);
    const { data: row } = await sb
      .from("supabase_ngoai_job_bang")
      .select("*")
      .eq("job_id", data.job_id)
      .eq("ten_bang", data.table)
      .single();
    if (!row) throw new Error("Bảng không thuộc phiên này");
    if (row.trang_thai === "hoan_thanh" || row.trang_thai === "bo_qua")
      return { sent: 0, done: true, tam_dung: false, error: null as string | null };

    const off = Number(row.offset_tiep);
    const { data: rows, error } = await sb
      .from(data.table)
      .select("*")
      .range(off, off + data.limit - 1);
    if (error) {
      await sb
        .from("supabase_ngoai_job_bang")
        .update({ trang_thai: "that_bai", loi: error.message })
        .eq("id", row.id);
      return { sent: 0, done: true, tam_dung: false, error: `Đọc ${data.table}: ${error.message}` };
    }
    const batch = (rows ?? []) as any[];
    if (batch.length === 0) {
      await sb.from("supabase_ngoai_job_bang").update({ trang_thai: "hoan_thanh" }).eq("id", row.id);
      return { sent: 0, done: true, tam_dung: false, error: null as string | null };
    }

    const r = await fetch(`${normUrl(cfg.url)}/rest/v1/${encodeURIComponent(data.table)}`, {
      method: "POST",
      headers: targetHeaders(cfg.service_role_key, { Prefer: "resolution=merge-duplicates,return=minimal" }),
      body: JSON.stringify(batch),
    });
    if (!r.ok) {
      const msg = `${r.status}: ${(await r.text()).slice(0, 300)}`;
      await sb.from("supabase_ngoai_job_bang").update({ trang_thai: "that_bai", loi: msg }).eq("id", row.id);
      return { sent: 0, done: true, tam_dung: false, error: `${data.table} — ${msg}` };
    }

    const xong = batch.length < data.limit;
    await sb
      .from("supabase_ngoai_job_bang")
      .update({
        offset_tiep: off + batch.length,
        da_chuyen: Number(row.da_chuyen) + batch.length,
        trang_thai: xong ? "hoan_thanh" : "dang_chay",
        loi: null,
      })
      .eq("id", row.id);

    const { data: tong } = await sb
      .from("supabase_ngoai_job_bang")
      .select("da_chuyen")
      .eq("job_id", data.job_id);
    const daChuyen = (tong ?? []).reduce((s: number, x: any) => s + Number(x.da_chuyen), 0);
    await sb.from("supabase_ngoai_job").update({ da_chuyen: daChuyen }).eq("id", data.job_id);

    return { sent: batch.length, done: xong, tam_dung: false, error: null as string | null };
  });

export const capNhatTrangThaiPhien = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z
      .object({
        job_id: z.string().uuid(),
        trang_thai: z.enum(["dang_chay", "tam_dung", "hoan_thanh", "that_bai"]),
        loi: z.string().max(2000).optional().nullable(),
      })
      .parse(i),
  )
  .handler(async ({ data, context }): Promise<Phien> => {
    const sb = await guard(context, "cap_nhat_phien", { id: data.job_id, trang_thai: data.trang_thai });
    await sb
      .from("supabase_ngoai_job")
      .update({
        trang_thai: data.trang_thai,
        loi: data.loi ?? null,
        ket_thuc: data.trang_thai === "dang_chay" ? null : new Date().toISOString(),
      })
      .eq("id", data.job_id);
    return docPhien(sb, data.job_id);
  });

/**
 * Khôi phục sau khi chuyển dở dang: xoá dữ liệu vừa ghi ở đích.
 * An toàn: chỉ dọn những bảng trước khi chuyển **đang rỗng** ở đích;
 * bảng đã có dữ liệu từ trước sẽ được giữ nguyên và báo lại cho quản trị.
 */
export const hoanTacPhien = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ job_id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "hoan_tac", { id: data.job_id });
    const phien = await docPhien(sb, data.job_id);
    const cfg = await layCauHinh(sb, phien.ngoai_id);

    const { data: snap } = await sb.rpc("mirats_schema_snapshot");
    const pkTheoBang = new Map<string, string[]>(
      (snap?.tables ?? []).map((t: any) => [t.name as string, (t.pk ?? []) as string[]]),
    );

    const daDon: string[] = [];
    const boQua: string[] = [];
    const loi: string[] = [];
    const canDon = phien.bang.filter((b) => b.da_chuyen > 0);

    // Xoá theo thứ tự ngược để giảm vướng khoá ngoại; lặp tối đa 3 lượt.
    let conLai = [...canDon].reverse();
    for (let pass = 0; pass < 3 && conLai.length; pass++) {
      const lai: typeof conLai = [];
      for (const b of conLai) {
        if ((b.dich_dong_truoc ?? 0) > 0) {
          if (pass === 0) boQua.push(b.ten_bang);
          continue;
        }
        const pk = pkTheoBang.get(b.ten_bang) ?? [];
        if (!pk.length) {
          if (pass === 0) boQua.push(b.ten_bang);
          continue;
        }
        const r = await fetch(
          `${normUrl(cfg.url)}/rest/v1/${encodeURIComponent(b.ten_bang)}?${encodeURIComponent(pk[0])}=not.is.null`,
          { method: "DELETE", headers: targetHeaders(cfg.service_role_key, { Prefer: "return=minimal" }) },
        );
        if (r.ok) daDon.push(b.ten_bang);
        else {
          const msg = `${b.ten_bang} [${r.status}]: ${(await r.text()).slice(0, 160)}`;
          lai.push(b);
          if (pass === 2 && loi.length < 20) loi.push(msg);
        }
      }
      conLai = lai;
    }

    await sb
      .from("supabase_ngoai_job")
      .update({ trang_thai: "da_hoan_tac", ket_thuc: new Date().toISOString() })
      .eq("id", data.job_id);

    return { da_don: [...new Set(daDon)], bo_qua: boQua, loi };
  });

/** Chép danh sách tài khoản (auth.users) sang Supabase đích — không kèm mật khẩu. */
export const migrateAuthUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    const sb = await guard(context, "chuyen_tai_khoan", { id: data.id });
    const cfg = await layCauHinh(sb, data.id);

    let created = 0;
    let skipped = 0;
    const loi: string[] = [];
    for (let page = 1; page <= 50; page++) {
      const { data: list, error } = await sb.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const users = (list as any)?.users ?? [];
      for (const u of users) {
        const r = await fetch(`${normUrl(cfg.url)}/auth/v1/admin/users`, {
          method: "POST",
          headers: targetHeaders(cfg.service_role_key),
          body: JSON.stringify({
            id: u.id,
            email: u.email,
            phone: u.phone || undefined,
            email_confirm: !!u.email_confirmed_at,
            user_metadata: u.user_metadata ?? {},
            app_metadata: u.app_metadata ?? {},
          }),
        });
        if (r.ok) created++;
        else {
          skipped++;
          if (loi.length < 5) loi.push(`${u.email}: ${(await r.text()).slice(0, 160)}`);
        }
      }
      if (users.length < 200) break;
    }
    return { created, skipped, loi };
  });

/* ------------------------------------------------------------------ */
/* Kích hoạt nguồn dữ liệu                                             */
/* ------------------------------------------------------------------ */

export const setActiveSupabaseNgoai = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().uuid(), kich_hoat: z.boolean(), bo_qua_canh_bao: z.boolean().default(false) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    const sb = await guard(context, data.kich_hoat ? "kich_hoat" : "bo_kich_hoat", {
      id: data.id,
      bo_qua_canh_bao: data.bo_qua_canh_bao,
    });

    let baoCao: BaoCaoTuongThich | null = null;
    if (data.kich_hoat) {
      const cfg = await layCauHinh(sb, data.id);
      const { data: snap } = await sb.rpc("mirats_schema_snapshot");
      const dich = await lucDoDich(cfg);
      baoCao = {
        tuong_thich: false,
        luc: new Date().toISOString(),
        thieu_bang: [],
        thieu_cot: [],
        thieu_extension: [],
        thieu_policy: 0,
        bang_dich: dich?.size ?? 0,
        bang_nguon: (snap?.tables ?? []).length,
        canh_bao: [],
      };
      if (!dich) baoCao.canh_bao.push("Không đọc được lược đồ của Supabase đích.");
      else
        for (const t of snap?.tables ?? []) {
          const cot = dich.get(t.name);
          if (!cot) baoCao.thieu_bang.push(t.name);
          else {
            const thieu = (t.columns ?? []).map((c: any) => c.name).filter((c: string) => !cot.has(c));
            if (thieu.length) baoCao.thieu_cot.push({ bang: t.name, cot: thieu });
          }
        }
      baoCao.tuong_thich = !!dich && baoCao.thieu_bang.length === 0 && baoCao.thieu_cot.length === 0;

      if (!baoCao.tuong_thich && !data.bo_qua_canh_bao) {
        throw new Error(
          `Chặn chuyển nguồn: lược đồ chưa tương thích — thiếu ${baoCao.thieu_bang.length} bảng, ` +
            `${baoCao.thieu_cot.length} bảng thiếu cột. Hãy chạy “Đồng bộ lược đồ” trước.`,
        );
      }
      await sb.from("supabase_ngoai").update({ kich_hoat: false }).eq("kich_hoat", true);
    }

    const { error } = await sb.from("supabase_ngoai").update({ kich_hoat: data.kich_hoat }).eq("id", data.id);
    if (error) throw new Error(error.message);

    const { data: cfg } = await sb.from("supabase_ngoai").select("*").eq("id", data.id).single();
    const envSnippet = cfg
      ? [
          `VITE_SUPABASE_URL=${cfg.url}`,
          `VITE_SUPABASE_PUBLISHABLE_KEY=${cfg.publishable_key}`,
          `SUPABASE_URL=${cfg.url}`,
          `SUPABASE_PUBLISHABLE_KEY=${cfg.publishable_key}`,
          `SUPABASE_SERVICE_ROLE_KEY=<khoá bí mật đã lưu>`,
        ].join("\n")
      : "";

    return { ok: true, env: envSnippet, bao_cao: baoCao };
  });

/**
 * Nguồn dữ liệu đang được chọn (công khai, chỉ trả URL + khoá công khai).
 * Trình duyệt gọi lúc khởi động để tự trỏ về đúng Supabase; không có → Lovable Cloud.
 */
export const getActiveBackend = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ url: string; publishableKey: string; ten: string } | null> => {
    try {
      const sb = await admin();
      if (!sb?.from) return null; // Tránh lỗi khi admin client chưa sẵn sàng hoặc thiếu key
      const { data, error } = await sb
        .from("supabase_ngoai")
        .select("ten,url,publishable_key")
        .eq("kich_hoat", true)
        .limit(1)
        .maybeSingle();
      if (error || !data?.url || !data?.publishable_key) return null;
      return { url: normUrl(data.url), publishableKey: data.publishable_key, ten: data.ten };
    } catch (err) {
      console.error("[getActiveBackend] Lỗi truy vấn nguồn dữ liệu:", err);
      return null;
    }
  },
);
