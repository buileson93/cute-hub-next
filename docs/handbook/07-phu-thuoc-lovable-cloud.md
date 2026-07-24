# 07 — Phụ thuộc Lovable Cloud & cách chạy khi không có Lovable

Tài liệu này gộp 2 câu hỏi:
1. **Những tính năng nào đang phụ thuộc vào Lovable Cloud?**
2. **Làm sao triển khai dự án khi không dùng hạ tầng Lovable?**

Tin tốt: MIRATS được viết trên các chuẩn mở (React 19, TanStack Start, Vite,
PostgreSQL + Supabase self-host được, Cloudflare Workers hoặc Node runtime).
Rời Lovable là **cấu hình lại**, không phải viết lại.

---

## Phần A. Bản đồ phụ thuộc Lovable Cloud

### A.1. Phụ thuộc cứng (bắt buộc thay khi rời)

| Tính năng | Đang dùng gì của Lovable Cloud | Thay bằng gì |
|---|---|---|
| **Database** | PostgreSQL do Cloud quản lý (Supabase quản lý bởi Lovable) | Supabase self-host / Supabase.com / Postgres bất kỳ |
| **Auth** | Supabase Auth (`auth.users`, JWT, provider Google) | Supabase Auth tự vận hành / Auth0 / Clerk (nếu chấp nhận viết adapter) |
| **Storage** | Supabase Storage — bucket `avatars`, `chat-files`, `model-anh`, `database-backups`, … | Supabase Storage tự vận hành / S3 / R2 (cần adapter) |
| **Realtime** | Supabase Realtime channels | Supabase Realtime tự vận hành / PowerSync / socket riêng |
| **Edge runtime** | Cloudflare Workers do Lovable vận hành | Cloudflare Workers riêng / Node server (Vercel, Fly, VPS) |
| **Secret store** | Cloud secrets injected vào Worker env | `.env` server / KV / Vault / GitHub Secrets |

### A.2. Phụ thuộc mềm (có sẵn đường thoát trong code)

| Tính năng | Cơ chế | Đường thoát |
|---|---|---|
| **MIRATS AI** (chat, vision, parse sự cố) | Lovable AI Gateway qua `LOVABLE_API_KEY` | Đổi provider sang `custom` trong `/admin/ai` (OpenAI/Gemini key riêng). Code tại `src/lib/ai/gateway.server.ts` đã hỗ trợ sẵn |
| **Email** | Lovable Email (tuỳ tính năng bật) | SMTP riêng / Resend / SendGrid |
| **Cron sao lưu** | Lịch của Cloud gọi `/api/public/hooks/daily-backup` | pg_cron / GitHub Actions / cron VPS gọi cùng URL |
| **Publish/Deploy** | Nút Publish trong Lovable UI | Build bằng Vite + deploy Cloudflare/Vercel |

### A.3. KHÔNG phụ thuộc Lovable (đã chuẩn mở)

- Toàn bộ mã nguồn React + TanStack Start.
- 200+ file migration SQL trong `supabase/migrations/` — chạy trên mọi Postgres.
- RLS, function, trigger, enum, extension (`pg_trgm`, `unaccent`) — Postgres gốc.
- Realtime channels — cơ chế Postgres LISTEN/NOTIFY chuẩn (Supabase mở nguồn).
- MCP tools, OAuth per-user connector — chuẩn mở.

### A.4. Biến môi trường

| Nhóm | Biến | Ghi chú |
|---|---|---|
| Công khai (FE) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` | Nhúng vào bundle. Chỉ khoá publishable/anon, an toàn để lộ |
| Server-only | `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | KHÔNG bao giờ `VITE_*`. Service role bỏ qua RLS |
| AI | `LOVABLE_API_KEY` **hoặc** key provider riêng | Xem `/admin/ai` để đổi provider |
| Backup / đồng bộ | `GOOGLE_DRIVE_API_KEY`, `AWS_S3_*`, `BACKUP_CRON_SECRET` | Chỉ cần nếu bật Drive/S3 và cron |
| Bảo mật | `BOOTSTRAP_ADMIN_SECRET`, `RESET_CHALLENGE_SECRET`, `SESSION_SECRET` | Thao tác admin đặc biệt |
| Telegram | `TELEGRAM_BOT_TOKEN` | Cảnh báo + OTP ký form |

---

## Phần B. Ba khối phải mang theo (không chỉ file .zip)

### B.1. Mã nguồn
Đưa lên GitHub (menu (+) → GitHub → Connect project). Repo chứa `src/` +
`supabase/migrations/`. KHÔNG chứa dữ liệu bảng, file Storage, secrets.

### B.2. Cấu trúc + dữ liệu database
1. **Cấu trúc**: `supabase/migrations/` — chạy lại là dựng lại y hệt.
2. **Dữ liệu bảng public**: file `.zip` từ trang Sao lưu **hoặc**
   Cloud → Advanced settings → Export data.
3. **`auth.users`** ⚠️: KHÔNG nằm trong `.zip` (đó là schema `auth`).
   Muốn giữ user phải dùng **Export data** hoặc Supabase Auth Admin API.
   Nếu không, người dùng phải đăng ký/đặt lại mật khẩu ở hệ thống mới.

### B.3. Tệp trong Storage
File `.zip` sao lưu đã gom toàn bộ bucket. Ở hệ thống mới: tạo lại bucket
**đúng tên & đúng public/private**, rồi tải file lên đúng đường dẫn.

---

## Phần C. Quy trình di dời (theo thứ tự)

1. **Tạo Postgres/Supabase mới** (self-host bằng Docker hoặc Supabase.com).
2. **Chạy migrations**: `supabase link` → `supabase db push` (hoặc chạy tuần
   tự các file trong `supabase/migrations/`). Dựng lại toàn bộ bảng, RLS,
   function, trigger.
3. **Tạo lại Storage buckets** đúng tên & policy — RLS đã có trong migrations.
4. **Nạp dữ liệu**: dùng chức năng *Khôi phục từ .zip* hoặc import
   `data.json` / `database.sql`. Upload file Storage lên bucket tương ứng.
5. **Migrate tài khoản** (nếu cần giữ user cũ): import `auth.users` từ Export data.
6. **Khai biến môi trường** ở host mới (xem A.4).
7. **Đổi AI sang provider riêng** trong `/admin/ai` → provider `custom`,
   nhập `base_url` (ví dụ `https://api.openai.com/v1`) + tên secret chứa key.
8. **Đặt lại cron sao lưu** trỏ tới `/api/public/hooks/daily-backup` (kèm
   `BACKUP_CRON_SECRET`). Xem `docs/pg-cron-setup.md`.
9. **Cấu hình lại Google/Apple OAuth** trong Auth settings của Supabase mới.
10. **Build & deploy** mã nguồn lên host chạy được Node/Edge (Cloudflare,
    Vercel, Fly, VPS…).

---

## Phần D. Mức độ khóa cứng theo lớp

| Lớp | Mức lock-in | Ghi chú |
|---|---|---|
| **Database** | THẤP ✅ | Postgres chuẩn. Chỉ dính `auth.uid()`/`auth.jwt()` — dễ thay bằng GUC/shim |
| **Auth** | TRUNG BÌNH ⚠️ | `auth.users` không có trong `.zip`; đổi provider phải viết lại claim mapping |
| **Storage** | THẤP ✅ | Đã có `src/lib/storage/adapter.ts` — chỉ đổi implementation là xong |
| **Realtime** | TRUNG BÌNH | Supabase Realtime dùng WAL logical replication — self-host được |
| **Edge runtime** | THẤP ✅ | TanStack Start build ra bundle chuẩn — deploy được Node/Worker |
| **AI Gateway** | THẤP ✅ | Đã có provider `custom` OpenAI-compat |

---

## Phần E. Những thứ KHÔNG tự động đi theo (dễ quên nhất)

- ❌ **`auth.users`** — tài khoản đăng nhập (phải Export data riêng).
- ❌ **Secrets** — không nằm trong `.zip` cũng không trong GitHub; phải khai lại thủ công.
- ❌ **Lịch cron của Cloud** — phải tự dựng lại ở host mới.
- ❌ **Cấu hình provider Google/Apple OAuth** — khai lại trong Auth settings.
- ⚠️ **RLS/policy/function/trigger/enum** — CÓ đi theo, nhưng chỉ khi bạn
  **chạy lại migrations**, không có trong `data.json`.

---

## Phần F. Kết luận

Rời Lovable Cloud = **(mã nguồn trên GitHub) + (chạy lại migrations) + (nạp
dữ liệu từ .zip/Export) + (khai lại secrets & buckets & auth users) + (đổi
AI sang key riêng) + (đổi cron/OAuth)**.

Dự án được thiết kế theo chuẩn mở nên di dời là **cấu hình**, không phải
viết lại. Điểm cần chuẩn bị kỹ nhất: **tài khoản đăng nhập (`auth.users`)**
và **secrets** — hai thứ duy nhất không nằm trong bản sao lưu `.zip`.
