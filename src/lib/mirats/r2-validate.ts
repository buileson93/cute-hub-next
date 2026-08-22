// Kiểm tra tính hợp lệ của tham số Cloudflare R2 trước khi lưu / kiểm tra kết nối.
// Dùng chung cho cả trình duyệt (cảnh báo trước khi lưu) và máy chủ (chặn cấu hình sai).

export type R2ValidationIssue = {
  field: string;
  level: "error" | "warning";
  message: string;
};

export type R2ConfigInput = {
  enabled: boolean;
  endpoint: string;
  accountId: string;
  bucketName: string;
  keyPrefix: string;
  publicBaseUrl: string;
  accessKeyId: string;
  /** Chuỗi rỗng = giữ nguyên khoá đang lưu. */
  secretAccessKey?: string;
  /** Máy chủ đã có secret lưu sẵn hay chưa. */
  hasStoredSecret?: boolean;
};

const BUCKET_RE = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;

export function validateR2Config(cfg: R2ConfigInput): R2ValidationIssue[] {
  const issues: R2ValidationIssue[] = [];
  const t = (s: string | undefined) => (s ?? "").trim();

  // Khi tắt R2 thì chỉ nhắc nhở, không chặn.
  const level: R2ValidationIssue["level"] = cfg.enabled ? "error" : "warning";

  // Endpoint
  const endpoint = t(cfg.endpoint);
  if (!endpoint) {
    issues.push({ field: "endpoint", level, message: "Chưa nhập Endpoint S3 API của R2." });
  } else {
    let url: URL | null = null;
    try {
      url = new URL(endpoint);
    } catch {
      issues.push({
        field: "endpoint",
        level: "error",
        message:
          "Endpoint không phải URL hợp lệ (ví dụ: https://<account_id>.r2.cloudflarestorage.com).",
      });
    }
    if (url) {
      if (url.protocol !== "https:") {
        issues.push({
          field: "endpoint",
          level: "error",
          message: "Endpoint phải dùng giao thức https://.",
        });
      }
      if (url.pathname && url.pathname !== "/") {
        issues.push({
          field: "endpoint",
          level: "error",
          message:
            "Endpoint không được chứa đường dẫn (bỏ phần sau tên miền, tên bucket nhập ở ô riêng).",
        });
      }
      if (!/r2\.cloudflarestorage\.com$/i.test(url.hostname)) {
        issues.push({
          field: "endpoint",
          level: "warning",
          message:
            "Endpoint không thuộc tên miền r2.cloudflarestorage.com — hãy kiểm tra lại nếu bạn không dùng proxy riêng.",
        });
      }
      const m = url.hostname.match(/^([0-9a-f]{32})\.r2\.cloudflarestorage\.com$/i);
      if (m && t(cfg.accountId) && m[1].toLowerCase() !== t(cfg.accountId).toLowerCase()) {
        issues.push({
          field: "accountId",
          level: "warning",
          message: "Account ID khác với account trong Endpoint.",
        });
      }
    }
  }

  // Account ID
  const acc = t(cfg.accountId);
  if (acc && !/^[0-9a-f]{32}$/i.test(acc)) {
    issues.push({
      field: "accountId",
      level: "warning",
      message: "Account ID thường là 32 ký tự hex.",
    });
  }

  // Bucket
  const bucket = t(cfg.bucketName);
  if (!bucket) {
    issues.push({ field: "bucketName", level, message: "Chưa nhập tên bucket." });
  } else if (!BUCKET_RE.test(bucket)) {
    issues.push({
      field: "bucketName",
      level: "error",
      message:
        "Tên bucket chỉ gồm chữ thường, số, dấu chấm và gạch ngang; dài 3–63 ký tự và không bắt đầu/kết thúc bằng ký tự đặc biệt.",
    });
  }

  // Prefix
  const prefix = t(cfg.keyPrefix);
  if (prefix) {
    if (prefix.startsWith("/")) {
      issues.push({
        field: "keyPrefix",
        level: "error",
        message: "Tiền tố không được bắt đầu bằng dấu “/”.",
      });
    }
    if (!prefix.endsWith("/")) {
      issues.push({
        field: "keyPrefix",
        level: "warning",
        message: "Nên kết thúc tiền tố bằng “/” (ví dụ: mirats/).",
      });
    }
    if (prefix.includes("..")) {
      issues.push({ field: "keyPrefix", level: "error", message: "Tiền tố không được chứa “..”." });
    }
  }

  // Khoá truy cập
  if (!t(cfg.accessKeyId)) {
    issues.push({ field: "accessKeyId", level, message: "Chưa nhập Access Key ID." });
  }
  const hasSecret = !!t(cfg.secretAccessKey) || !!cfg.hasStoredSecret;
  if (!hasSecret) {
    issues.push({ field: "secretAccessKey", level, message: "Chưa có Secret Access Key." });
  }

  // URL công khai
  const pub = t(cfg.publicBaseUrl);
  if (pub) {
    try {
      const u = new URL(pub);
      if (u.protocol !== "https:") {
        issues.push({
          field: "publicBaseUrl",
          level: "error",
          message: "URL công khai phải dùng https://.",
        });
      }
    } catch {
      issues.push({
        field: "publicBaseUrl",
        level: "error",
        message: "URL công khai không hợp lệ.",
      });
    }
  }

  return issues;
}

export function hasBlockingIssue(issues: R2ValidationIssue[]): boolean {
  return issues.some((i) => i.level === "error");
}

export function summarizeIssues(issues: R2ValidationIssue[]): string {
  return issues.map((i) => `${i.level === "error" ? "Lỗi" : "Cảnh báo"}: ${i.message}`).join(" | ");
}
