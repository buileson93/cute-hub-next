# MIRATS — Hệ thống quản lý tài sản & hạ tầng kỹ thuật

> Nền tảng quản lý vòng đời tài sản, hệ thống kỹ thuật, bảo dưỡng, sự cố và tài liệu vận hành — xây dựng trên TanStack Start + Lovable Cloud.

![Stack](https://img.shields.io/badge/TanStack_Start-v1-informational)
![React](https://img.shields.io/badge/React-19-blue)
![Backend](https://img.shields.io/badge/Lovable_Cloud-Supabase-green)
![Styling](https://img.shields.io/badge/TailwindCSS-v4-06B6D4)

> 📋 Lịch sử thay đổi theo từng commit: xem [CHANGELOG.md](./CHANGELOG.md).

---

## 🚀 Giới thiệu

MIRATS số hóa toàn bộ công tác quản lý kỹ thuật của một đơn vị vận hành hạ tầng: từ **kiểm kê tài sản**, **phân lớp hệ thống**, **theo dõi bảo dưỡng – hỏng hóc – sự cố**, đến **vẽ sơ đồ hệ thống trực quan** và **quản lý giấy phép khai thác**. Giao diện tiếng Việt, tối ưu cho người dùng nghiệp vụ.

---

## ✨ Tính năng chính

### 🗂️ Hệ Thống tài sản (phân lớp 7 tầng)

Cấu trúc dữ liệu có khả năng mở rộng (scalable) theo mô hình nghiệp vụ:

```text
Toàn hệ thống
 └─ Phân loại (Nhóm 1 / 2 / 3)
     └─ Lĩnh vực (Thông tin, Dẫn đường, Giám sát, ATM, Khí tượng…)
         └─ Nhóm hệ thống (VHF, VCCS, AMHS, AWOS…)
             └─ Hệ thống (hệ thống cụ thể)
                 └─ Tài sản
                     └─ Thành phần tài sản
```

- Kế thừa tự động theo **Model** (NSX / loại / bộ trường) qua trigger CSDL.
- Nhập/xuất **CSV idempotent** (nhập lại không nhân bản) và **mẫu All-in-one (.xlsx)** nhiều sheet có dropdown kiểm tra hợp lệ.
- Trường kỹ thuật mở rộng (JSONB) đồng bộ với CSDL; bulk edit / gộp trùng kiểu Snipe-IT.
- Nhãn giấy phép động: N1 → _Giấy phép khai thác_, N2 → _Quyết định khai thác_, N3 → không yêu cầu.

### 🧭 Sơ đồ hệ thống (phong cách FigJam)

- Thanh công cụ nổi: khối Tài sản, Hệ thống, Ghi chú dán, Hình khối, Văn bản, bảng màu.
- **Thư viện đường nối đa dạng:** cáp mạng, cáp quang (hiệu ứng dòng chảy), cáp điện, sóng vô tuyến, cáp đồng trục, liên kết logic.
- Chấm nối 4 cạnh, nối tự do giữa các node.
- **Link preview:** hover card tóm tắt tài sản + thumbnail sơ đồ liên kết.
- **Multi-node linking:** nối chuỗi tự động hoặc nối chùm tới 1 đích.
- **Hoàn tác / Làm lại** (Ctrl+Z / Ctrl+Shift+Z), **Auto-layout** (dagre), **Xuất ảnh PNG**.
- Chèn/upload hình ảnh cho từng khối (thư viện hình).

### 🛠️ Vận hành kỹ thuật

- **Bảo dưỡng**, **Hỏng hóc**, **Sự cố**, **Tuổi thọ tài sản**, **Kiểm kê định kỳ**.
- **Phiếu công việc bảo dưỡng (Work Order)** `/bao-tri/cong-viec`: chính sách PM → sinh phiếu định kỳ, KPI theo đơn vị.
- **Kho & vật tư** `/vat-tu`: sổ cái bất biến (NHAP/XUAT/CHUYEN/KIEM_KE), cảnh báo tồn tối thiểu.
- **Giấy phép hợp nhất** `/giay-phep`: gộp giấy phép tài sản + hệ thống, cảnh báo sắp hết hạn.
- **Sơ đồ đấu nối (Topology)** `/topology`: quản lý kết nối tài sản, đồng bộ từ sơ đồ.
- **Vấn đề (RCA)** `/van-de`: chuỗi ITIL Ticket → Sự cố → Vấn đề → Thay đổi, có SLA.
- **Bàn giao** ca trực, **Dự án**, **Biểu mẫu (Forms)** động, **Tin nhắn / Ticket** nội bộ.
- **Sổ lý lịch** tài sản & hệ thống: dòng thời gian bảo dưỡng/sự cố/thay thế.

### 🎓 Product Tour (hướng dẫn người dùng)

- Spotlight làm nổi bật phần tử, phần còn lại chìm tối.
- Thẻ hướng dẫn có animation, tự động định vị, điều hướng Quay lại / Tiếp / Bỏ qua.
- Tự khởi động cho người dùng mới, mở lại bất kỳ lúc nào qua nút Trợ giúp.
- Tooltip nhỏ khi hover các nút chức năng.

### 🔐 Quản trị & bảo mật

- **Phân quyền** theo vai trò (lưu ở bảng `user_roles` riêng, chống leo thang đặc quyền).
- **Nhật ký (Audit log)** ghi thay đổi từng trường, hỗ trợ **rollback** dữ liệu cũ.
- **Sơ đồ CSDL** tương tác (expand/thu gọn cột, phân màu nhóm bảng).
- Đăng nhập, đăng ký, quên/đặt lại mật khẩu; hàng chờ duyệt tài khoản.

---

## 🧱 Công nghệ

| Lớp       | Công nghệ                                                 |
| --------- | --------------------------------------------------------- |
| Framework | TanStack Start v1 (SSR + server functions)                |
| UI        | React 19, Tailwind CSS v4, shadcn/ui, Radix UI            |
| Sơ đồ     | @xyflow/react (React Flow), @dagrejs/dagre, html-to-image |
| Backend   | Lovable Cloud (Supabase): Postgres, Auth, Storage, RLS    |
| Data      | TanStack Query, Zod                                       |
| Build     | Vite 7, Bun                                               |

---

## 🏁 Bắt đầu

```bash
# Cài đặt dependencies
bun install

# Chạy môi trường phát triển
bun run dev

# Build production
bun run build
```

Ứng dụng chạy tại `http://localhost:8080`.

---

## 📁 Cấu trúc thư mục

```text
src/
├─ routes/          # Route file-based (TanStack Router)
│  ├─ _app.*.tsx    # Các trang trong khu vực đã đăng nhập
│  ├─ admin.*.tsx   # Trang quản trị (audit, schema, users)
│  └─ api/          # Server routes (webhook / public API)
├─ components/
│  └─ mirats/       # AppShell, ProductTour, CommandPalette…
├─ lib/mirats/      # Taxonomy phân lớp, tiện ích nghiệp vụ
├─ integrations/    # Client Supabase (auto-generated)
└─ styles.css       # Theme tokens Tailwind v4
supabase/
└─ migrations/      # Lịch sử migration CSDL
```

---

## 🔄 Đồng bộ GitHub

Dự án hỗ trợ **đồng bộ hai chiều** với GitHub qua Lovable:

1. Mở menu **(+) → GitHub → Connect project** trong Lovable.
2. Cấp quyền cho Lovable GitHub App và chọn tài khoản/tổ chức.
3. Nhấn **Create Repository** để tạo repo chứa mã nguồn.

Sau khi kết nối:

- Thay đổi trong Lovable **tự động push** lên GitHub.
- Commit đẩy lên GitHub **tự động sync** ngược về Lovable (thời gian thực).
- Có thể clone repo, phát triển ở IDE, dùng branch/pull request và CI/CD GitHub Actions song song.

> Tải mã nguồn: GitHub → **Code → Download ZIP** hoặc `git clone`.
> Xuất dữ liệu CSDL: Lovable → **Cloud → Advanced settings → Export data**.

---

## 📜 Giấy phép

Sản phẩm nội bộ phục vụ vận hành kỹ thuật. Vui lòng liên hệ đơn vị quản trị trước khi sử dụng lại.
