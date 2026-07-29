// Bóc tách chi tiết lỗi PostgREST/Supabase khi gọi RPC — đặc biệt là trường hợp
// hàm không tồn tại (PGRST202) — để hiển thị đủ: mã lỗi, tên hàm, payload đã gửi.

export type PostgrestLikeError = {
  code?: string | null;
  message?: string | null;
  details?: string | null;
  hint?: string | null;
};

export type RpcErrorInfo = {
  /** Mã lỗi PostgREST/Postgres, ví dụ PGRST202, 42883, 23503. */
  code: string;
  fn: string;
  message: string;
  details: string;
  hint: string;
  /** Đúng khi hàm RPC không tồn tại trong schema cache. */
  missingFunction: boolean;
  /** Danh sách tên tham số đã gửi (không kèm giá trị nhạy cảm). */
  argNames: string[];
  payload: unknown;
  /** Chuỗi hiển thị đầy đủ cho người dùng/nhật ký. */
  text: string;
};

export function describeRpcError(fn: string, payload: unknown, error: unknown): RpcErrorInfo {
  const e = (error ?? {}) as PostgrestLikeError & { toString?: () => string };
  const code = String(e.code ?? "").trim();
  const message = String(e.message ?? (error instanceof Error ? error.message : "") ?? "").trim();
  const details = String(e.details ?? "").trim();
  const hint = String(e.hint ?? "").trim();
  const missingFunction =
    code === "PGRST202" ||
    code === "42883" ||
    /could not find the function/i.test(message) ||
    /does not exist/i.test(message) && /function/i.test(message);

  const argNames =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? Object.keys(payload as Record<string, unknown>)
      : [];

  const lines: string[] = [];
  if (missingFunction) {
    lines.push(`Hàm CSDL "${fn}" không tồn tại (chưa chạy migration tạo hàm).`);
  } else {
    lines.push(`Gọi hàm CSDL "${fn}" thất bại.`);
  }
  lines.push(`Mã lỗi: ${code || "(không có)"}`);
  if (message) lines.push(`Thông báo: ${message}`);
  if (details) lines.push(`Chi tiết: ${details}`);
  if (hint) lines.push(`Gợi ý: ${hint}`);
  if (argNames.length) lines.push(`Tham số đã gửi: ${argNames.join(", ")}`);
  lines.push(`Payload: ${safeJson(payload)}`);

  return { code: code || "", fn, message, details, hint, missingFunction, argNames, payload, text: lines.join("\n") };
}

export class RpcCallError extends Error {
  readonly info: RpcErrorInfo;
  constructor(info: RpcErrorInfo) {
    super(info.text);
    this.name = "RpcCallError";
    this.info = info;
  }
}

/** Ném lỗi đã được làm giàu thông tin; dùng ngay sau khi supabase.rpc trả error. */
export function throwRpcError(fn: string, payload: unknown, error: unknown): never {
  throw new RpcCallError(describeRpcError(fn, payload, error));
}

export function safeJson(value: unknown, maxLen = 4000): string {
  try {
    const s = JSON.stringify(value, replacer, 2) ?? String(value);
    return s.length > maxLen ? s.slice(0, maxLen) + "\n… (đã cắt bớt)" : s;
  } catch {
    return String(value);
  }
}

function replacer(key: string, value: unknown) {
  if (/secret|password|token|key$/i.test(key) && typeof value === "string" && value.length > 4) {
    return `••••${value.slice(-4)}`;
  }
  return value;
}

/** Tách lỗi RPC thành tiêu đề + mô tả chi tiết để hiện toast. */
export function rpcErrorToast(error: unknown): { title: string; description?: string } {
  const msg = error instanceof Error ? error.message : String(error);
  const [first, ...rest] = msg.split("\n");
  const description = rest.join("\n").trim();
  return { title: first, description: description || undefined };
}
