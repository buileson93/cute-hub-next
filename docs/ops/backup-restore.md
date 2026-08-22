# Backup & Restore — MIRATS 2.0

Bảo vệ dữ liệu production khỏi mất mát do lỗi migration, sự cố hạ tầng, hoặc thao tác nhầm. Áp dụng cho project `mirats-prod` và `mirats-staging` (staging cũng backup để phục vụ diễn tập restore).

## 1. Chiến lược tổng thể

| Lớp                | Công nghệ                             | Tần suất       | Giữ lại      | Mục đích                       |
| ------------------ | ------------------------------------- | -------------- | ------------ | ------------------------------ |
| PITR               | Supabase Point-in-Time Recovery       | Liên tục (WAL) | 7 ngày       | Khôi phục theo mốc giây bất kỳ |
| Snapshot hàng ngày | Supabase daily backup                 | 1 lần/ngày     | 30 ngày      | Rollback nhanh về đầu ngày     |
| Dump logic         | `pg_dump` scheduled (cron GH Actions) | 1 lần/ngày     | 90 ngày (S3) | Off-site, độc lập với Supabase |
| Export storage     | Rsync bucket → S3                     | 1 lần/ngày     | 90 ngày      | Backup file đính kèm           |

> Bật PITR trong Supabase project cho `mirats-prod` (yêu cầu gói phù hợp). Đây là lớp phòng thủ chính.

## 2. Dump logic hàng ngày (off-site)

Workflow `.github/workflows/backup.yml` (được tạo khi hạ tầng sẵn sàng) chạy 02:00 UTC:

```yaml
name: Nightly DB dump
on:
  schedule: [{ cron: "0 2 * * *" }]
  workflow_dispatch:
jobs:
  dump:
    runs-on: ubuntu-latest
    steps:
      - uses: supabase/setup-cli@v1
      - name: Dump prod
        env:
          PGPASSWORD: ${{ secrets.PROD_SUPABASE_DB_PASSWORD }}
        run: |
          DATE=$(date -u +%Y%m%d-%H%M)
          pg_dump "postgresql://postgres.${{ secrets.PROD_SUPABASE_PROJECT_REF }}:$PGPASSWORD@aws-0-*.pooler.supabase.com:5432/postgres" \
            --no-owner --no-privileges --format=custom \
            -f mirats-prod-$DATE.dump
      - name: Upload to S3
        uses: aws-actions/configure-aws-credentials@v4
        # ... aws s3 cp ... s3://mirats-backups/prod/
```

File dump được đặt tên `mirats-prod-YYYYMMDD-HHMM.dump`. S3 bucket bật versioning + lifecycle 90 ngày.

## 3. Quy trình khôi phục

### 3.1. Kịch bản A — PITR (khuyến nghị)

Dùng khi cần rollback vài phút/giờ (ví dụ: `UPDATE` sai toàn bảng vừa xảy ra).

1. Xác định **thời điểm T** ngay TRƯỚC sự cố (timestamp UTC).
2. Trong Supabase project: **Database → Backups → Point-in-Time Recovery** → chọn T → **Restore**.
3. Supabase tạo project mới từ mốc T (hoặc restore in-place, tuỳ gói).
4. Verify: đếm bảng chính, kiểm 1–2 record đã biết.
5. Switch DNS/URL nếu là project mới. Ghi incident report.

### 3.2. Kịch bản B — Restore từ dump

Dùng khi cần backup off-site (Supabase incident) hoặc phục hồi ở project khác.

```bash
aws s3 cp s3://mirats-backups/prod/mirats-prod-20260714-0200.dump .
pg_restore --clean --if-exists --no-owner --no-privileges \
  -d "postgresql://postgres:...@aws-0-*.pooler.supabase.com:5432/postgres" \
  mirats-prod-20260714-0200.dump
```

Với môi trường mục tiêu là **staging** (phục vụ diễn tập), thay connection string bằng của `mirats-staging`.

## 4. Diễn tập restore — bắt buộc

**Định kỳ mỗi tháng**, ops phải khôi phục dump mới nhất lên `mirats-staging` và chạy smoke test. Không có diễn tập = coi như không có backup.

Checklist diễn tập (điền vào `docs/ops/log-restore-drills.md` — tạo khi diễn tập lần đầu):

- [ ] Ngày diễn tập / người thực hiện.
- [ ] File dump nguồn (tên + timestamp).
- [ ] Thời gian bắt đầu → kết thúc (RTO thực tế).
- [ ] Số bảng, số dòng ở bảng lớn nhất (`thiet_bi`, `su_co`, `bao_tri`).
- [ ] Smoke test đăng nhập + đọc 1 bảng có RLS + gọi 1 RPC.
- [ ] Kết quả: PASS / FAIL + nguyên nhân nếu FAIL.

Ngưỡng chấp nhận: **RTO ≤ 60 phút, RPO ≤ 24 giờ** cho kịch bản dump; PITR đạt RPO ≤ 5 phút.

## 5. Backup file đính kèm (Supabase Storage)

Bucket public/private → export hàng đêm bằng `supabase storage cp` hoặc rclone sang S3. File đính kèm không nằm trong dump SQL, phải backup riêng.

## 6. Xoá backup

Không xoá tay. Chỉ dựa vào S3 lifecycle (90 ngày) và Supabase retention (7/30 ngày). Trước khi xoá dump ngoài quy trình, phải có 2 người duyệt.
