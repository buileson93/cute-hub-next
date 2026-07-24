# 02 — Code map: Routes

TanStack Router flat routing trong `src/routes/`. Quy ước: `_app.*` = layout đã đăng nhập (gate `_authenticated`), `_app.tsx` là parent layout.

## Public / auth

| Route | File | Vai trò |
|---|---|---|
| `/` (khi chưa login) | qua `_app.index.tsx` redirect | Landing |
| `/auth` | `auth.tsx` | Đăng nhập (Google + email + passkey) — có scene ATC tower |
| `/forgot-password` | `forgot-password.tsx` | Quên mật khẩu |
| `/reset-password` | `reset-password.tsx` | Đặt lại mật khẩu |
| `/pending` | `pending.tsx` | Chờ admin duyệt tài khoản |
| `/q/$maThietBi` | `q.$maThietBi.tsx` | QR landing (không cần login) |
| `/qr/thiet-bi/$id` | `qr.thiet-bi.$id.tsx` | QR chi tiết tài sản |
| `/verify/$id` | `verify.$id.tsx` | Xác thực chữ ký form |

## App (đăng nhập)

### Tổng quan & báo cáo
| Route | File | Mục đích |
|---|---|---|
| `/` | `_app.index.tsx` | Overview + Daily Brief |
| `/tong-quan` | `_app.tong-quan.tsx` | Dashboard KPI (N8) |
| `/bao-cao/do-tin-cay` | `_app.bao-cao.do-tin-cay.tsx` | Reliability MTBF/MTTR (N9) |
| `/tuan-thu` | `_app.tuan-thu.tsx` | Compliance/giấy phép |
| `/sap-het-han` | `_app.sap-het-han.tsx` | Cảnh báo hết hạn (N5) |
| `/tuoi-tho` | `_app.tuoi-tho.tsx` | Lifecycle |

### Hệ thống & tài sản
| Route | File | Mục đích |
|---|---|---|
| `/he-thong/cay` | `_app.he-thong.cay.tsx` | Cây hệ thống — thêm/sửa/xoá nhánh |
| `/he-thong/thanh-phan` | `_app.he-thong.thanh-phan.tsx` | Bảng thành phần hệ thống |
| `/he-thong/lien-ket` | `_app.he-thong.lien-ket.tsx` | Liên kết giữa hệ thống |
| `/he-thong/thung-rac` | `_app.he-thong.thung-rac.tsx` | Soft-delete restore |
| `/he-thong/$id` | `_app.he-thong.$id.tsx` | Chi tiết hệ thống |
| `/topology` | `_app.topology.tsx` | Graph view (N13) |
| `/thiet-bi` | `_app.thiet-bi.tsx` / `_app.thiet-bi.index.tsx` | Danh sách tài sản |
| `/thiet-bi/$maThietBi` | `_app.thiet-bi.$maThietBi.tsx` | Sổ lý lịch tài sản |
| `/nhan` | `_app.nhan.tsx` | Nhãn/QR |

### Vận hành
| Route | File | Mục đích |
|---|---|---|
| `/su-co` | `_app.su-co.tsx` / `.index.tsx` | Danh sách sự cố |
| `/su-co/moi` | `_app.su-co.moi.tsx` | Báo cáo sự cố mới |
| `/su-co/$maSuCo` | `_app.su-co.$maSuCo.tsx` | Chi tiết + FSM |
| `/hong-hoc` | `_app.hong-hoc.tsx` | Danh sách hỏng hóc |
| `/hong-hoc/moi`, `/hong-hoc/$maHongHoc` | tương ứng | CRUD hỏng hóc |
| `/bao-tri`, `.moi`, `.pm`, `.cong-viec`, `.$maBaoTri` | `_app.bao-tri.*` | Bảo dưỡng, PM (N4) |
| `/ban-giao`, `/ban-giao/moi` | tương ứng | Bàn giao ca |
| `/van-de` | `_app.van-de.tsx` | Vấn đề tổng hợp |
| `/kiem-ke` | `_app.kiem-ke.tsx` | Kiểm kê |
| `/kiem-dinh` | `_app.kiem-dinh.tsx` | Kiểm định |
| `/giay-phep` | `_app.giay-phep.tsx` | Giấy phép khai thác |
| `/vat-tu` | `_app.vat-tu.tsx` | Vật tư kho |

### Forms
| Route | File | Mục đích |
|---|---|---|
| `/forms` | `_app.forms.tsx`, `.index.tsx` | Danh sách template |
| `/forms/new/$code` | `_app.forms.new.$code.tsx` | Tạo submission |
| `/forms/submissions/$id` | `_app.forms.submissions.$id.tsx` | Chi tiết + ký |
| `/admin/forms`, `/admin/forms/$id`, `.history` | `_app.admin.forms.*` | Form Designer 2.0 |

### Danh mục (N1)
| Route | File |
|---|---|
| `/danh-muc/thiet-bi` | `_app.danh-muc.thiet-bi.tsx` |
| `/danh-muc/model` | `_app.danh-muc.model.tsx` |
| `/danh-muc/nha-cung-cap` | `_app.danh-muc.nha-cung-cap.tsx` |
| `/danh-muc/nha-san-xuat` | `_app.danh-muc.nha-san-xuat.tsx` |
| `/danh-muc/loai-thiet-bi` | `_app.danh-muc.loai-thiet-bi.tsx` |
| `/danh-muc/he-thong` | `_app.danh-muc.he-thong.tsx` |
| `/danh-muc/vi-tri` | `_app.danh-muc.vi-tri.tsx` |
| `/danh-muc/don-vi` | `_app.danh-muc.don-vi.tsx` |
| `/danh-muc/dac-tinh` | `_app.danh-muc.dac-tinh.tsx` |

### Admin & quản trị
| Route | File | Mục đích |
|---|---|---|
| `/admin` | `admin.tsx` | Trang admin gốc |
| `/admin/users` | `admin.users.tsx` | Quản lý user (song song `/quan-tri/nguoi-dung`) |
| `/admin/backup` | `admin.backup.tsx` | Backup/restore |
| `/admin/schema` | `admin.schema.tsx` | Sửa schema qua UI (admin_add/drop/rename_column) |
| `/admin/audit`, `.lap-thao` | `admin.audit*.tsx` | Audit log + rollback |
| `/admin/ai` | `_app.admin.ai.tsx` | Cấu hình AI |
| `/admin/bao-tri-chinh-sach` | `_app.admin.bao-tri-chinh-sach.tsx` | PM policy (N4) |
| `/admin/nhap-lieu` | `_app.admin.nhap-lieu.tsx` | Import (N10) |
| `/admin/permissions` | `_app.admin.permissions.tsx` | RBAC ma trận |
| `/admin/review` | `_app.admin.review.tsx` | Data review |
| `/admin/thuong-hieu` | `_app.admin.thuong-hieu.tsx` | Branding |
| `/admin/kiem-tra-so-lieu`, `.layout` | tương ứng | Data quality N1 |
| `/cho-duyet` | `_app.cho-duyet.tsx` | Change request queue (N2) |
| `/thong-bao` | `_app.thong-bao.tsx` | Notification center |
| `/phan-quyen` | `_app.phan-quyen.tsx` | Xem quyền của mình |
| `/cai-dat/tai-khoan` | `_app.cai-dat.tai-khoan.tsx` | Cài đặt cá nhân + passkey |
| `/nhap-lieu` | `_app.nhap-lieu.tsx` | All-in-one Excel import |

### Khác
| Route | File | Mục đích |
|---|---|---|
| `/du-an`, `/du-an/$id` | `_app.du-an.*` | Dự án + Gantt |
| `/so-do`, `/so-do/$id` | `_app.so-do.*` | Sơ đồ hệ thống |
| `/tickets`, `/tickets/$id` | `_app.tickets.*` | Ticket hỗ trợ |
| `/messages`, `/messages/$convId` | `_app.messages.*` | Direct messages |

### API routes (server)
| Route | File |
|---|---|
| `/api/*` | `src/routes/api/**` (webhook, cron, public API) |
| `/.mcp/*` | `src/routes/[.mcp]/**` — MCP server endpoints |
| `/.well-known/*` | `src/routes/[.well-known]/**` |
| `/mcp` | `mcp.ts` | MCP manifest |
| `/.lovable/oauth/consent` | `[.]lovable.oauth.consent.tsx` | OAuth consent |

## Quy tắc thêm route mới

1. Tạo file trong `src/routes/` (Vite plugin tự sinh `routeTree.gen.ts` — **không sửa tay**).
2. Route xem cần đăng nhập → prefix `_app.`; API public → `api/public/*`.
3. Bổ sung head() với title/description riêng, không dùng "Lovable App".
4. Cập nhật bảng ở trên và `01-tinh-nang/` tương ứng.
