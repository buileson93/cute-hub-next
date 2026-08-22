import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/backend/auth-middleware";
import { z } from "zod";
import {
  validateR2Config,
  hasBlockingIssue,
  summarizeIssues,
  type R2ValidationIssue,
} from "./r2-validate";

/** Tham số cấu hình Cloudflare R2 do admin nhập trong ứng dụng. */
export type R2ConfigView = {
  enabled: boolean;
  endpoint: string;
  accountId: string;
  bucketName: string;
  keyPrefix: string;
  publicBaseUrl: string;
  accessKeyId: string;
  /** Chỉ hiển thị dạng che (••••1234); không bao giờ trả về giá trị thật. */
  secretMasked: string;
  hasSecret: boolean;
  /** Nguồn tham số đang có hiệu lực: cấu hình trong app hay biến môi trường. */
  source: "db" | "env";
};

const saveSchema = z.object({
  enabled: z.boolean(),
  endpoint: z.string().trim().max(300),
  accountId: z.string().trim().max(100),
  bucketName: z.string().trim().max(100),
  keyPrefix: z.string().trim().max(200),
  publicBaseUrl: z.string().trim().max(300),
  accessKeyId: z.string().trim().max(200),
  /** Bỏ trống = giữ nguyên khoá bí mật hiện tại. */
  secretAccessKey: z.string().max(300).optional(),
  /** Bỏ qua chặn khi cấu hình có lỗi (admin đã xác nhận trong hộp cảnh báo). */
  force: z.boolean().optional(),
});

async function assertAdmin(context: any) {
  const { data: isAdmin, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!isAdmin) throw new Error("Chỉ quản trị viên mới được xem/sửa cấu hình R2");
}

async function logR2ConfigAction(supabaseAdmin: any, userId: string, action: string, detail: any) {
  await supabaseAdmin.from("audit_log").insert({
    user_id: userId,
    action,
    entity: "r2_config",
    detail,
    severity: "info",
  });
}

function mask(secret: string | null | undefined): string {
  if (!secret) return "";
  return `••••••••${secret.slice(-4)}`;
}

export const getR2Config = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<R2ConfigView> => {
    await assertAdmin(context);
    const { getR2Settings } = await import("./r2.server");
    const s = await getR2Settings(true);
    return {
      enabled: s.enabled,
      endpoint: s.endpoint ?? "",
      accountId: s.accountId ?? "",
      bucketName: s.bucketName ?? "",
      keyPrefix: s.keyPrefix ?? "",
      publicBaseUrl: s.publicBaseUrl ?? "",
      accessKeyId: s.accessKeyId ?? "",
      secretMasked: mask(s.secretAccessKey),
      hasSecret: !!s.secretAccessKey,
      source: s.source,
    };
  });

export const saveR2Config = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ ok: boolean; issues: R2ValidationIssue[] }> => {
    await assertAdmin(context);

    const { getR2Settings } = await import("./r2.server");
    const current = await getR2Settings(true);
    const issues = validateR2Config({ ...data, hasStoredSecret: !!current.secretAccessKey });
    if (hasBlockingIssue(issues) && !data.force) {
      throw new Error(
        "Cấu hình R2 chưa hợp lệ — " + summarizeIssues(issues.filter((i) => i.level === "error")),
      );
    }

    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    const { resetR2Cache } = await import("./r2.server");

    const patch: Record<string, unknown> = {
      id: 1,
      enabled: data.enabled,
      endpoint: data.endpoint || null,
      account_id: data.accountId || null,
      bucket_name: data.bucketName || null,
      key_prefix: data.keyPrefix || null,
      public_base_url: data.publicBaseUrl || null,
      access_key_id: data.accessKeyId || null,
      updated_by: context.userId,
      updated_at: new Date().toISOString(),
    };
    if (data.secretAccessKey && data.secretAccessKey.trim()) {
      patch.secret_access_key = data.secretAccessKey.trim();
    }

    const { error } = await supabaseAdmin
      .from("r2_cau_hinh")
      .upsert(patch as any, { onConflict: "id" });
    if (error) throw new Error(error.message);

    await logR2ConfigAction(supabaseAdmin, context.userId, "save_r2_config", {
      enabled: data.enabled,
    });
    resetR2Cache();
    return { ok: true, issues };
  });

/** Thử kết nối R2 với tham số đang lưu: kiểm tra cấu hình, bucket tồn tại và quyền đọc/ghi. */
export const testR2Config = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(
    async ({
      context,
    }): Promise<{
      ok: boolean;
      message: string;
      issues: R2ValidationIssue[];
      steps: { ten: string; ok: boolean; message: string }[];
    }> => {
      await assertAdmin(context);
      const { getR2Settings, getR2Client, resetR2Cache } = await import("./r2.server");
      resetR2Cache();
      const s = await getR2Settings(true);

      const issues = validateR2Config({
        enabled: s.enabled,
        endpoint: s.endpoint ?? "",
        accountId: s.accountId ?? "",
        bucketName: s.bucketName ?? "",
        keyPrefix: s.keyPrefix ?? "",
        publicBaseUrl: s.publicBaseUrl ?? "",
        accessKeyId: s.accessKeyId ?? "",
        hasStoredSecret: !!s.secretAccessKey,
      });
      const steps: { ten: string; ok: boolean; message: string }[] = [];
      if (hasBlockingIssue(issues)) {
        const msg = summarizeIssues(issues.filter((i) => i.level === "error"));
        steps.push({ ten: "Kiểm tra tham số", ok: false, message: msg });
        return { ok: false, message: "Tham số chưa hợp lệ — " + msg, issues, steps };
      }
      steps.push({ ten: "Kiểm tra tham số", ok: true, message: "Tham số hợp lệ." });

      const errText = (e: any) =>
        [
          e?.name ?? e?.Code,
          e?.$metadata?.httpStatusCode ? `HTTP ${e.$metadata.httpStatusCode}` : null,
          e?.message,
        ]
          .filter(Boolean)
          .join(" — ");

      try {
        const client = await getR2Client();
        const { HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, DeleteObjectCommand } =
          await import("@aws-sdk/client-s3");

        // 1) Bucket tồn tại & truy cập được
        try {
          await client.send(new HeadBucketCommand({ Bucket: s.bucketName! }));
          steps.push({
            ten: "Bucket tồn tại",
            ok: true,
            message: `Truy cập được bucket "${s.bucketName}".`,
          });
        } catch (e: any) {
          const m = errText(e);
          steps.push({ ten: "Bucket tồn tại", ok: false, message: m });
          return {
            ok: false,
            message: `Không truy cập được bucket "${s.bucketName}": ${m}`,
            issues,
            steps,
          };
        }

        // 2) Quyền đọc (list)
        try {
          const res = await client.send(
            new ListObjectsV2Command({
              Bucket: s.bucketName!,
              MaxKeys: 1,
              Prefix: s.keyPrefix ?? undefined,
            }),
          );
          steps.push({
            ten: "Quyền đọc (List)",
            ok: true,
            message: `Đọc được danh sách (${res.KeyCount ?? 0} đối tượng mẫu).`,
          });
        } catch (e: any) {
          const m = errText(e);
          steps.push({ ten: "Quyền đọc (List)", ok: false, message: m });
          return { ok: false, message: `Thiếu quyền đọc bucket: ${m}`, issues, steps };
        }

        // 3) Quyền ghi & xoá (tệp thử, tự xoá ngay)
        const probeKey = `${s.keyPrefix ?? ""}_healthcheck/${Date.now()}.txt`;
        try {
          await client.send(
            new PutObjectCommand({
              Bucket: s.bucketName!,
              Key: probeKey,
              Body: "mirats-healthcheck",
              ContentType: "text/plain",
            }),
          );
          steps.push({ ten: "Quyền ghi (Put)", ok: true, message: "Ghi thử thành công." });
          try {
            await client.send(new DeleteObjectCommand({ Bucket: s.bucketName!, Key: probeKey }));
            steps.push({ ten: "Quyền xoá (Delete)", ok: true, message: "Xoá tệp thử thành công." });
          } catch (e: any) {
            steps.push({
              ten: "Quyền xoá (Delete)",
              ok: false,
              message: `${errText(e)} (tệp thử còn lại: ${probeKey})`,
            });
          }
        } catch (e: any) {
          const m = errText(e);
          steps.push({ ten: "Quyền ghi (Put)", ok: false, message: m });
          return { ok: false, message: `Token R2 không đủ quyền ghi: ${m}`, issues, steps };
        }

        const warn = issues.filter((i) => i.level === "warning");
        return {
          ok: true,
          message:
            `Kết nối thành công tới bucket "${s.bucketName}" (đủ quyền đọc/ghi/xoá).` +
            (warn.length ? ` Có ${warn.length} cảnh báo cấu hình.` : ""),
          issues,
          steps,
        };
      } catch (e: any) {
        return { ok: false, message: e?.message || "Không kết nối được tới R2", issues, steps };
      }
    },
  );
