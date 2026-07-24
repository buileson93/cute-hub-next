# 35. Chuyển dự án sang tài khoản Lovable khác

> Hướng dẫn từng bước để chuyển toàn bộ MIRATS (code + database + storage + secrets) sang một tài khoản Lovable / workspace khác **KHÔNG mất dữ liệu**.

## Tổng quan

Một dự án MIRATS gồm **4 khối** cần chuyển:

| Khối | Nằm ở đâu | Có tự chuyển kèm project không? |
|---|---|---|
| **Code** (routes, components, migrations) | Repo Lovable | ✅ Có |
| **Database** (Postgres + RLS) | Lovable Cloud | ⚠️ Chỉ khi **Transfer ownership** |
| **Storage** (avatars, model-anh, chat-files, database-backups) | Lovable Cloud | ⚠️ Chỉ khi **Transfer ownership** |
| **Secrets** (Telegram, Cron secret, backup keys…) | Project settings | ❌ Không, phải khai lại |

Có 2 kịch bản:

- **Kịch bản A — Transfer ownership** (khuyến nghị): giữ nguyên project, chỉ đổi chủ sở hữu. Database + storage đi theo. Chỉ cần khai lại secrets.
- **Kịch bản B — Remix / Self-host**: tạo project mới ở tài khoản đích, sau đó **import lại DB + storage** bằng file backup.

---

## KỊCH BẢN A — Transfer ownership (khuyến nghị)

### Bước 1. Backup phòng hờ trước khi chuyển

Dù transfer ownership không mất dữ liệu, luôn luôn backup trước:

```bash
bash scripts/export-full-backup.sh
```

Kết quả: `/mnt/documents/mirats-backup-YYYYMMDD-HHMMSS.zip`

Tải file này về máy trước khi làm bước tiếp theo.

### Bước 2. Mời tài khoản đích vào workspace

1. Vào **Workspace Settings → People → Invite**
2. Nhập email tài khoản đích
3. Chọn role **Admin**
4. Gửi lời mời và yêu cầu tài khoản đích chấp nhận

### Bước 3. Transfer

1. Mở project MIRATS
2. Vào **Settings → Project → General → Transfer ownership**
3. Chọn workspace của tài khoản đích
4. Xác nhận

Sau khi chuyển xong: Cloud (DB + storage + auth users) đi theo project.

### Bước 4. Khai lại secrets ở tài khoản đích

Vào **Project Settings → Secrets** trên tài khoản mới, khai lại:

| Secret | Bắt buộc? | Ghi chú |
|---|---|---|
| `LOVABLE_API_KEY` | Tự cấp | Không cần copy |
| `TELEGRAM_BOT_TOKEN` | Nếu dùng cảnh báo | Copy từ BotFather |
| `TELEGRAM_CHAT_ID` | Nếu dùng cảnh báo | |
| `CRON_SECRET` | Nếu dùng cron | Random 32 ký tự |
| `X_CRON_SECRET` | Nếu dùng cron pg_cron | Giống trên |
| Google OAuth Client ID/Secret | Nếu bật Google login | Cấu hình trong Cloud → Users → Auth Settings |

### Bước 5. Kiểm tra sau chuyển (checklist)

- [ ] Đăng nhập được bằng tài khoản admin cũ
- [ ] Số bản ghi khớp: `thiet_bi`, `he_thong_thanh_phan`, `su_co`, `bao_tri`, `giay_phep`
- [ ] Ảnh thiết bị hiển thị OK (bucket `model-anh`)
- [ ] Realtime badge cập nhật (tạo thử 1 sự cố mới)
- [ ] Cron `daily-backup` và `canh-bao-het-han` chạy (kiểm tra sau 24h)
- [ ] Telegram nhận cảnh báo thử

---

## KỊCH BẢN B — Remix hoặc Self-host

Dùng khi không thể transfer ownership (khác workspace/tổ chức, hoặc muốn tách hoàn toàn).

### Bước 1. Backup đầy đủ ở project nguồn

```bash
# Trong sandbox Lovable của project cũ
bash scripts/export-full-backup.sh
```

Output: `/mnt/documents/mirats-backup-YYYYMMDD-HHMMSS.zip` — chứa:

```
mirats-backup-YYYYMMDD-HHMMSS/
├── BACKUP_INFO.txt          # Metadata (số bảng, số rows, thời điểm)
├── tables/
│   ├── _manifest.tsv        # Danh sách bảng + số dòng + byte
│   ├── thiet_bi.csv
│   ├── he_thong_thanh_phan.csv
│   ├── ... (tất cả bảng public.*)
├── schema/
│   ├── migrations/          # Bản sao supabase/migrations
│   ├── rls_policies.txt
│   ├── functions.txt
│   └── columns.txt
└── storage/
    ├── buckets.csv          # Danh sách bucket
    ├── objects.csv          # Danh sách file
    └── README.txt
```

Xuất bổ sung qua UI (bảo đảm chuẩn nhất): **Cloud → Advanced settings → Export data**.

### Bước 2. Tải toàn bộ file storage

Script `export-full-backup.sh` chỉ xuất **danh sách file**. File nhị phân (ảnh) phải tải riêng:

```bash
# Trên máy local hoặc sandbox (có Node.js)
export SUPABASE_URL="https://<project-cũ>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key-project-cũ>"
node scripts/download-storage.mjs
# → tạo ./storage-dump/<bucket>/<path>
zip -r /mnt/documents/mirats-storage-$(date +%Y%m%d).zip storage-dump
```

> Lấy `SUPABASE_SERVICE_ROLE_KEY` trong Cloud → Settings → API. Lovable Cloud KHÔNG hiển thị key này trong UI — chỉ tự host mới có. Với Lovable Cloud, dùng UI **Cloud → Storage → Download bucket** cho từng bucket.

### Bước 3. Chuẩn bị project đích

**Tùy chọn B1 — Remix trên Lovable:**
1. Ở project cũ: **Settings → Project → General** → bật **Public remixing**
2. Đăng nhập tài khoản đích → mở URL project cũ → nút **Remix**
3. Ở project đích: bật **Cloud** (tạo Supabase instance mới, trống)

**Tùy chọn B2 — Self-host trên Supabase riêng:**
1. Tạo project Supabase mới ở supabase.com
2. Clone code repo về máy
3. Cấu hình theo `docs/HUONG_DAN_CAI_DAT_BUILD.md`

### Bước 4. Áp dụng migrations (schema)

Cực kỳ quan trọng: **chạy migration trước khi import CSV**.

```bash
# Với Lovable Cloud project đích: các migration trong supabase/migrations
# tự chạy khi bật Cloud lần đầu. Không cần thao tác.

# Với self-host:
supabase link --project-ref <project-mới>
supabase db push
```

Xác minh: số bảng trong project đích phải = số bảng trong `BACKUP_INFO.txt` (~99 bảng).

### Bước 5. Import CSV vào project đích

Script khôi phục (chạy trong sandbox của project ĐÍCH):

```bash
bash scripts/restore-from-backup.sh /mnt/documents/mirats-backup-YYYYMMDD-HHMMSS.zip
```

Script này (xem file bên dưới):
1. Giải nén ZIP
2. Import từng CSV vào bảng tương ứng với `\COPY FROM STDIN`
3. Import theo **thứ tự phụ thuộc FK** (danh mục → thiết bị → sự cố / bảo dưỡng)
4. In báo cáo `rows_imported / rows_expected` cho mỗi bảng

### Bước 6. Import lại storage

```bash
# Giải nén file storage đã tải ở Bước 2
unzip mirats-storage-YYYYMMDD.zip -d ./storage-dump

# Upload từng file lên bucket tương ứng
export SUPABASE_URL="https://<project-mới>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key-project-mới>"
node scripts/upload-storage.mjs ./storage-dump
```

### Bước 7. Khai secrets & kiểm tra (như Kịch bản A - Bước 4 & 5)

---

## Script khôi phục — `scripts/restore-from-backup.sh`

Bạn có thể tạo file này khi cần dùng. Nội dung tham khảo:

```bash
#!/usr/bin/env bash
set -euo pipefail

ZIP="${1:?Cần đường dẫn ZIP backup}"
WORK="/tmp/mirats-restore-$$"

echo "==> Giải nén $ZIP"
mkdir -p "$WORK" && unzip -q "$ZIP" -d "$WORK"
ROOT="$(ls -d "$WORK"/*/ | head -1)"

# Thứ tự import theo phụ thuộc FK (danh mục trước, giao dịch sau)
ORDER=(
  dm_don_vi dm_linh_vuc dm_phan_loai dm_to_chuc dm_nhom_he_thong
  dm_vi_tri dm_noi_cap dm_loai_thiet_bi dm_nha_san_xuat dm_nha_cung_cap
  dm_model dm_model_dac_tinh dm_dac_tinh dm_trang_thai_thiet_bi
  dm_loai_lien_ket dm_loai_giay_phep dm_danh_gia_nien_han
  profiles user_roles user_scope nhan_vien
  dm_he_thong he_thong_thanh_phan he_thong_truong dinh_nghia_truong
  thiet_bi gan_chuc_nang gan_linh_kien thiet_bi_khe_linh_kien
  thiet_bi_do_dac thiet_bi_ket_noi thiet_bi_vong_doi chung_chi_thiet_bi
  su_co bao_tri hong_hoc kiem_ke ban_giao vat_tu kho kho_giao_dich
  giay_phep giay_phep_khai_thac lien_ket_he_thong lien_ket_khe
  # ... (thêm bảng còn lại theo _manifest.tsv)
)

for T in "${ORDER[@]}"; do
  CSV="$ROOT/tables/$T.csv"
  [ -f "$CSV" ] || { echo "-- bỏ qua $T (không có CSV)"; continue; }
  ROWS=$(($(wc -l < "$CSV") - 1))
  echo "==> Import $T ($ROWS rows)"
  psql -c "TRUNCATE public.\"$T\" CASCADE" || true
  psql -c "\COPY public.\"$T\" FROM '$CSV' WITH CSV HEADER"
done

echo "✅ Xong. Đối chiếu số dòng với $ROOT/tables/_manifest.tsv"
```

> ⚠️ **Cảnh báo**: `TRUNCATE ... CASCADE` xoá dữ liệu hiện có. Chỉ chạy trên project đích **trống**.
> Với bảng có RLS + reference đến `auth.users`, phải import lại users qua **Auth Admin API** trước (script riêng, không nằm trong CSV vì user thuộc schema `auth`).

---

## Xử lý auth.users

`auth.users` (user account) **không nằm** trong `public.*` nên không có trong backup CSV. Có 2 cách:

**Cách 1 — Người dùng đăng ký lại**: đơn giản, phù hợp nếu chỉ có vài admin.

**Cách 2 — Migrate qua Auth Admin API**:
```js
// Export ở project cũ
const { data: { users } } = await supabaseOld.auth.admin.listUsers();
// Import vào project mới
for (const u of users) {
  await supabaseNew.auth.admin.createUser({
    email: u.email, email_confirm: true, user_metadata: u.user_metadata,
    // Password không xuất được → gửi email đặt lại mật khẩu
  });
}
```

Sau khi tạo lại users → cập nhật `profiles.id` / `user_roles.user_id` để khớp UUID mới (viết SQL mapping).

---

## FAQ

**Q: Transfer ownership có mất downtime không?**
A: Vài giây, không ảnh hưởng dữ liệu.

**Q: Có thể chuyển sang Supabase self-host (docker) không?**
A: Có, dùng Kịch bản B. Xem thêm `docs/HUONG_DAN_ROI_LOVABLE_CLOUD.md`.

**Q: Backup thường xuyên?**
A: Cron `/api/public/hooks/daily-backup` đã chạy hằng ngày; kết quả trong bảng `backup_lich_su` và bucket `database-backups`. Trang `/admin/backup` để tải/khôi phục.

**Q: Sau khi chuyển, URL published có đổi không?**
A: Transfer ownership giữ nguyên project ID → URL `*.lovable.app` không đổi. Remix tạo project mới → URL mới, custom domain phải trỏ lại.

**Q: File ZIP backup nặng bao nhiêu?**
A: Tuỳ dữ liệu. Với ~1000 thiết bị + ~500 sự cố + không kể ảnh: khoảng 5-20 MB. Có kèm ảnh storage: 100 MB - vài GB.

---

## Tham chiếu

- `scripts/export-full-backup.sh` — export DB + schema + storage manifest
- `scripts/download-storage.mjs` — tải file nhị phân storage
- `src/lib/backup.functions.ts` — server function backup thủ công
- `src/routes/admin.backup.tsx` — UI backup/restore
- `docs/HUONG_DAN_BACKUP_VA_GITHUB.md` — sao lưu code sang GitHub
- `docs/HUONG_DAN_ROI_LOVABLE_CLOUD.md` — rời hoàn toàn khỏi Lovable
