import { timingSafeEqual } from "crypto";

/**
 * So sánh an toàn thời gian để chống timing attacks.
 */
export function safeEqual(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  try {
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Kiểm tra secret từ header so với biến môi trường.
 */
export async function verifyApiSecret(
  request: Request,
  secretEnvName: string = "CRON_SECRET",
  headerName: string = "x-cron-secret"
): Promise<{ authorized: boolean; errorStatus: 401 | 404 | null }> {
  const expected = process.env[secretEnvName];
  
  // Nếu secret không được cấu hình, fail closed bằng 404 để giấu endpoint
  if (!expected || expected.trim() === "") {
    console.warn(`[API Security] Secret ${secretEnvName} is not configured or empty.`);
    return { authorized: false, errorStatus: 404 };
  }

  const provided = request.headers.get(headerName);
  
  if (!provided || !safeEqual(provided, expected)) {
    return { authorized: false, errorStatus: 401 };
  }

  return { authorized: true, errorStatus: null };
}

/**
 * Ghi log audit cho các truy cập public endpoint.
 */
export async function auditPublicApiCall(
  endpoint: string,
  outcome: string,
  metadata: Record<string, any> = {}
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/backend/admin.server");
    // Sử dụng try-catch nội bộ để không làm crash endpoint chính nếu logging lỗi
    await supabaseAdmin.from("audit_log").insert({
      action: `api.public.hook.${endpoint}`,
      detail: {
        outcome,
        timestamp: new Date().toISOString(),
        ...metadata,
      },
    }).catch(err => console.error(`[Audit Log DB Error] ${endpoint}:`, err));
  } catch (err) {
    console.error(`[API Security Audit Failed] ${endpoint}:`, err);
  }
}
