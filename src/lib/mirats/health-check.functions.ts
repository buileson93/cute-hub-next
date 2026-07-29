import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { z } from "zod";

export type JsonValue = string | number | boolean | null | JsonValue[] | { [k: string]: JsonValue };

/** Một lần kiểm tra sức khoẻ kho lưu trữ. */
export type HealthCheckRow = {
  id: string;
  backend: "cloud" | "r2";
  ok: boolean;
  latency_ms: number | null;
  message: string | null;
  error_code: string | null;
  detail: JsonValue;
  nguon: string;
  created_at: string;
};

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Chỉ quản trị viên mới xem/chạy kiểm tra kho lưu trữ");
}

function errInfo(e: any) {
  return {
    code: String(e?.name ?? e?.code ?? "ERROR"),
    message: String(e?.message ?? e ?? "Lỗi không xác định"),
    detail: {
      name: e?.name ?? null,
      code: e?.Code ?? e?.code ?? null,
      httpStatus: e?.$metadata?.httpStatusCode ?? null,
      requestId: e?.$metadata?.requestId ?? null,
      stack: typeof e?.stack === "string" ? e.stack.split("\n").slice(0, 5).join("\n") : null,
    } as Record<string, JsonValue>,
  };
}

async function checkCloud(): Promise<{ ok: boolean; message: string; code: string | null; detail: JsonValue }> {
  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
  try {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
      const i = errInfo(error);
      return { ok: false, message: i.message, code: i.code, detail: i.detail };
    }
    return {
      ok: true,
      message: `Lovable Cloud Storage sẵn sàng (${data?.length ?? 0} bucket).`,
      code: null,
      detail: { buckets: (data ?? []).map((b: any) => b.name) },
    };
  } catch (e: any) {
    const i = errInfo(e);
    return { ok: false, message: i.message, code: i.code, detail: i.detail };
  }
}

async function checkR2(): Promise<{ ok: boolean; message: string; code: string | null; detail: JsonValue }> {
  const { getR2Settings, getR2Client, resetR2Cache } = await import("./r2.server");
  resetR2Cache();
  const s = await getR2Settings(true);
  const missing: string[] = [];
  if (!s.endpoint) missing.push("Endpoint");
  if (!s.accessKeyId) missing.push("Access Key ID");
  if (!s.secretAccessKey) missing.push("Secret Access Key");
  if (!s.bucketName) missing.push("Bucket");
  if (missing.length) {
    return { ok: false, message: `Thiếu tham số: ${missing.join(", ")}`, code: "CONFIG_MISSING", detail: { missing } };
  }
  try {
    const client = await getR2Client();
    const { ListObjectsV2Command } = await import("@aws-sdk/client-s3");
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: s.bucketName!, MaxKeys: 1, Prefix: s.keyPrefix ?? undefined }),
    );
    return {
      ok: true,
      message: `R2 sẵn sàng — bucket "${s.bucketName}" (${res.KeyCount ?? 0} đối tượng mẫu).`,
      code: null,
      detail: { bucket: s.bucketName, prefix: s.keyPrefix ?? null, source: s.source },
    };
  } catch (e: any) {
    const i = errInfo(e);
    return { ok: false, message: i.message, code: i.code, detail: { ...i.detail, bucket: s.bucketName, source: s.source } };
  }
}

async function logCheck(row: {
  backend: "cloud" | "r2";
  ok: boolean;
  latency_ms: number;
  message: string;
  error_code: string | null;
  detail: JsonValue;
  nguon: string;
  checked_by: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
  await supabaseAdmin.from("luu_tru_health_log").insert(row as any);
}

/** Chạy kiểm tra sức khoẻ 1 hoặc cả 2 kho, ghi lại kết quả vào nhật ký. */
export const runStorageHealthCheck = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ backend: z.enum(["cloud", "r2", "both"]).default("both"), nguon: z.string().max(50).default("manual") }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const targets: ("cloud" | "r2")[] = data.backend === "both" ? ["cloud", "r2"] : [data.backend];
    const results: { backend: "cloud" | "r2"; ok: boolean; message: string; latency_ms: number; error_code: string | null }[] = [];

    for (const backend of targets) {
      const t0 = Date.now();
      const r = backend === "cloud" ? await checkCloud() : await checkR2();
      const latency = Date.now() - t0;
      await logCheck({
        backend,
        ok: r.ok,
        latency_ms: latency,
        message: r.message,
        error_code: r.code,
        detail: r.detail,
        nguon: data.nguon,
        checked_by: context.userId,
      });
      results.push({ backend, ok: r.ok, message: r.message, latency_ms: latency, error_code: r.code });
    }
    return { results };
  });

/** Lấy lịch sử kiểm tra sức khoẻ gần nhất. */
export const listStorageHealthChecks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ backend: z.enum(["cloud", "r2", "all"]).default("all"), limit: z.number().int().min(1).max(200).default(50) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }): Promise<HealthCheckRow[]> => {
    await assertAdmin(context);
    let q = context.supabase
      .from("luu_tru_health_log")
      .select("id,backend,ok,latency_ms,message,error_code,detail,nguon,created_at")
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.backend !== "all") q = q.eq("backend", data.backend);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []) as unknown as HealthCheckRow[];
  });
