# MIRATS Handbook

Tài liệu **duy nhất** cho lập trình viên bảo trì/mở rộng dự án MIRATS (Vietnam Air Traffic Management — Maintenance & Inventory of Rules, Assets, Tasks, Systems).

> [!WARNING]
> Bộ tài liệu này là tham khảo để hiểu luồng và kiến trúc. Nguồn sự thật về cấu trúc dữ liệu (SSOT) luôn là `supabase/dump/schema.sql`.

> Nếu bạn mới vào dự án, đọc theo thứ tự bên dưới. Nếu đang debug, dùng `05-van-hanh/troubleshooting.md`.

## Đọc theo vai trò

| Vai trò | Bắt đầu ở |
|---|---|
| Dev mới (fullstack) | `00-kien-truc-tong-quan.md` → `02-code-map/routes.md` → `03-database/schema.md` |
| Dev bảo trì DB / migration | `03-database/` → `04-quy-uoc/grant-discipline.md` |
| Dev thêm tính năng | `01-tinh-nang/README.md` → chọn module tương ứng |
| Người vận hành | `05-van-hanh/` |
| Người dùng cuối | `docs/huong-dan/README.md` (tài liệu HDSD riêng) |

## Cấu trúc

```
docs/handbook/
├── 00-kien-truc-tong-quan.md      Sơ đồ khối, stack, luồng dữ liệu
├── 01-tinh-nang/                  Mỗi module nghiệp vụ 1 file
├── 02-code-map/                   Map thư mục src/ → chức năng
├── 03-database/                   Bảng, RPC, trigger, RLS, migration
├── 04-quy-uoc/                    Comment style, naming, GRANT, testing
├── 05-van-hanh/                   Dev local, deploy, troubleshoot, backup
├── 06-bai-hoc-kinh-nghiem.md      Sai lầm & lỗi đã gặp, cách phòng lặp
└── 07-phu-thuoc-lovable-cloud.md  Phụ thuộc Lovable + cách rời hạ tầng
```

## Quy tắc chung

- **Không refactor logic** khi cập nhật handbook — chỉ mô tả cái đang có.
- Khi thêm route/bảng/RPC mới, **cập nhật đồng thời** file tương ứng trong `02-code-map/` hoặc `03-database/`.
- Ngôn ngữ: tiếng Việt, thuật ngữ ngành hàng không giữ nguyên (ATC, NAVAID, VOR, DME, ILS…).
- Không lộ ID/URL Supabase; luôn gọi backend là "Lovable Cloud" trong tài liệu đối ngoại.

## Trạng thái

| Pha | Nội dung | Trạng thái |
|---|---|---|
| 1 | Khung + tổng quan | ✅ DONE |
| 2 | Tính năng N1–N13 + UX2026 | 🚧 |
| 3 | Code map | 🚧 |
| 4 | Database (bảng, RPC, RLS) | 🚧 |
| 5 | Comment inline (JSDoc + COMMENT ON) | ⏳ liên tục |

Xem chi tiết ở `.lovable/plan.md`.
