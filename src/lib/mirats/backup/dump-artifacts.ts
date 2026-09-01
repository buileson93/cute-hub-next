/**
 * Trợ giúp thuần (không I/O) cho gói sao lưu toàn diện `supbase/dump/`.
 * Tách riêng để kiểm thử được: tên thư mục, thứ tự phục hồi, manifest, tài liệu.
 */

export type DumpArtifactStatus = "ok" | "partial" | "failed" | "skipped";

export type DumpArtifact = {
  /** Đường dẫn tương đối trong gói, ví dụ `data/thiet_bi.json` */
  path: string;
  kind: "manifest" | "schema" | "rls" | "grants" | "data" | "auth" | "storage" | "doc";
  status: DumpArtifactStatus;
  rows?: number;
  bytes?: number;
  note?: string;
};

export type DumpManifestFile = {
  formatVersion: 1;
  createdAt: string;
  /** Định danh môi trường KHÔNG nhạy cảm (host của API, không kèm khoá) */
  environment: string;
  generator: string;
  counts: { tables: number; rows: number; policies: number; views: number; functions: number };
  restoreOrder: string[];
  artifacts: DumpArtifact[];
  limitations: string[];
};

/** Nhãn thư mục gói dump: supbase-dump-YYYYMMDD-HHmmss */
export function dumpFolderName(now: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `supbase-dump-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(
    now.getHours(),
  )}${p(now.getMinutes())}${p(now.getSeconds())}`;
}

/**
 * Sắp xếp bảng theo phụ thuộc khoá ngoại (cha trước, con sau).
 * Chu trình (self/vòng tròn) được giữ nguyên thứ tự alphabet ở cuối —
 * script phục hồi khuyến nghị hoãn ràng buộc bằng `SET session_replication_role`.
 */
export function restoreOrder(
  tables: string[],
  fks: { from_table: string; to_table: string }[],
): string[] {
  const set = new Set(tables);
  const deps = new Map<string, Set<string>>(tables.map((t) => [t, new Set<string>()]));
  for (const fk of fks) {
    if (fk.from_table === fk.to_table) continue;
    if (!set.has(fk.from_table) || !set.has(fk.to_table)) continue;
    deps.get(fk.from_table)!.add(fk.to_table);
  }
  const out: string[] = [];
  const done = new Set<string>();
  const sorted = [...tables].sort();
  for (let pass = 0; pass < sorted.length && done.size < sorted.length; pass++) {
    let progressed = false;
    for (const t of sorted) {
      if (done.has(t)) continue;
      if ([...deps.get(t)!].every((d) => done.has(d))) {
        out.push(t);
        done.add(t);
        progressed = true;
      }
    }
    if (!progressed) break;
  }
  for (const t of sorted) if (!done.has(t)) out.push(t);
  return out;
}

export const DUMP_LIMITATIONS: string[] = [
  "Không xuất mật khẩu băm (auth.users.encrypted_password) — nền tảng không cấp API đọc.",
  "Không xuất JWT signing secret, service role key, OAuth client secret, API key hay biến môi trường.",
  "Cấu hình nền tảng (Auth providers, SMTP, rate limit, cron, secrets) phải sao lưu bằng Dashboard/CLI chính thức.",
  "Lịch sử/source code dự án Lovable không nằm trong gói này.",
  "Extension và role cấp cụm (cluster role) chỉ được ghi nhận, không tái tạo tự động.",
];

/** Nhóm phạm vi hiển thị trên UI. */
export type ScopeLevel = "full" | "partial" | "blocked";
export const DUMP_SCOPE: { label: string; level: ScopeLevel; desc: string }[] = [
  {
    label: "Cấu trúc CSDL (schema.sql)",
    level: "full",
    desc: "Bảng, cột, kiểu, mặc định, khoá chính/ngoại, unique/check, index, view, function, trigger, enum.",
  },
  {
    label: "Dữ liệu bảng ứng dụng (data/*.json)",
    level: "full",
    desc: "Toàn bộ dòng của mọi bảng ứng dụng, đọc theo lô, kèm thứ tự phục hồi an toàn khoá ngoại.",
  },
  {
    label: "RLS & phân quyền (rls-policies.sql, grants.sql)",
    level: "full",
    desc: "Trạng thái RLS từng bảng, mọi policy (command, roles, USING, WITH CHECK) và GRANT bảng/sequence.",
  },
  {
    label: "Metadata Storage & R2 (storage/)",
    level: "partial",
    desc: "Danh sách bucket, đường dẫn, kích thước. Nội dung tệp chỉ tải khi bật tuỳ chọn kèm tệp.",
  },
  {
    label: "Tài khoản & quyền ứng dụng (auth/)",
    level: "partial",
    desc: "Metadata người dùng (id, email, trạng thái xác nhận, timestamps) và bảng user_roles/profiles.",
  },
  {
    label: "Mật khẩu, secret, khoá nền tảng",
    level: "blocked",
    desc: "Không thể và không nên xuất qua ứng dụng — dùng Dashboard/CLI chính thức.",
  },
];

export function buildRestoreReadme(m: DumpManifestFile): string {
  return [
    "# Hướng dẫn phục hồi gói sao lưu MIRATS",
    "",
    `Tạo lúc: ${m.createdAt} · format v${m.formatVersion} · môi trường: ${m.environment}`,
    "",
    "## Thứ tự thực hiện",
    "",
    "1. `schema.sql` — tạo enum, bảng, ràng buộc, index, view, function, trigger.",
    "2. `rls-policies.sql` — bật RLS và tạo lại toàn bộ policy.",
    "3. `grants.sql` — cấp quyền cho `anon`, `authenticated`, `service_role`.",
    "4. Dữ liệu trong `data/` theo đúng `manifest.json → restoreOrder`.",
    "5. `auth/` — tạo lại người dùng bằng Admin API rồi nạp lại mapping quyền.",
    "",
    "## Nạp dữ liệu",
    "",
    "```bash",
    "psql \"$DB_URL\" -f schema.sql",
    "psql \"$DB_URL\" -f rls-policies.sql",
    "psql \"$DB_URL\" -f grants.sql",
    "# Nạp JSON theo thứ tự restoreOrder trong manifest.json:",
    "node restore-data.mjs   # xem đoạn mẫu bên dưới",
    "```",
    "",
    "Hoặc nạp nhanh trong ứng dụng: **Quản trị → Sao lưu → Phục hồi CSDL từ gói .zip**.",
    "",
    "### restore-data.mjs (tối thiểu, chạy được)",
    "",
    "```js",
    "import { readFileSync, readdirSync } from 'node:fs'",
    "import postgres from 'postgres'",
    "const sql = postgres(process.env.DB_URL, { max: 1 })",
    "const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'))",
    "await sql`SET session_replication_role = replica`  // hoãn kiểm tra khoá ngoại",
    "for (const t of manifest.restoreOrder) {",
    "  const rows = JSON.parse(readFileSync(`data/${t}.json`, 'utf8'))",
    "  if (!rows.length) continue",
    "  for (let i = 0; i < rows.length; i += 500)",
    "    await sql`INSERT INTO ${sql(t)} ${sql(rows.slice(i, i + 500))} ON CONFLICT DO NOTHING`",
    "}",
    "await sql`SET session_replication_role = origin`",
    "await sql.end()",
    "```",
    "",
    "## Cảnh báo",
    "",
    ...m.limitations.map((l) => `- ${l}`),
    "",
    "Người dùng phải được tạo lại bằng `supabase.auth.admin.createUser()` (giữ nguyên `id` trong `auth/users-metadata.json`) rồi mời đặt lại mật khẩu; mật khẩu cũ không thể khôi phục.",
    "",
    "## Lưu vào repository",
    "",
    "Giải nén và đặt nội dung vào `supbase/dump/` của repo nếu cần lưu trữ cùng mã nguồn.",
    "Thư mục này đã được `.gitignore` bỏ qua (trừ `README.md`) để tránh vô tình commit dữ liệu thật.",
  ].join("\n");
}

export function buildLimitationsDoc(m: DumpManifestFile): string {
  return [
    "# Giới hạn của bản sao lưu",
    "",
    `Tạo lúc: ${m.createdAt}`,
    "",
    ...m.limitations.map((l) => `- ${l}`),
    "",
    "## Cần làm thủ công bằng Dashboard/CLI chính thức",
    "",
    "- `supabase db dump --db-url ...` để có bản dump SQL cấp cụm (bao gồm schema `auth`, `storage`).",
    "- Sao lưu secrets/biến môi trường trong phần quản lý dự án.",
    "- Cấu hình Auth providers, email template, SMTP, redirect URLs.",
    "",
    "## Trạng thái từng phần trong lần chạy này",
    "",
    ...m.artifacts.map((a) => `- \`${a.path}\` — ${a.status}${a.note ? ` (${a.note})` : ""}`),
  ].join("\n");
}
