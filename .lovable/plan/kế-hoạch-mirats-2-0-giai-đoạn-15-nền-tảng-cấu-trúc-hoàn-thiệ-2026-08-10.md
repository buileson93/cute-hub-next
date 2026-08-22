# Kế hoạch MIRATS 2.0 - Giai đoạn 15: Nền tảng & Cấu trúc (Hoàn thiện GĐ 13 & 14 và mở rộng)

Dựa trên tài liệu rà soát toàn bộ giao diện, kế hoạch này tập trung vào việc xử lý các "điểm nóng" còn lại (Thành phần hệ thống, Cây hệ thống, Nền tảng thị giác) để đảm bảo tính nhất quán và hiệu năng cho MIRATS 2.0.

## Giai đoạn 15.1: Hoàn thiện Nền tảng thị giác (GĐ 8 mở rộng)

**Mục tiêu:** Xử lý triệt để màu hardcode, đảm bảo Dark Mode và nhất quán các trạng thái nền.

- **Status Registry mở rộng:** Cập nhật `src/lib/mirats/ui/status-tokens.ts` và `src/lib/mirats/trang-thai.ts` để bao phủ toàn bộ các domain: `su_co`, `van_de`, `cong_viec`, `hong_hoc`, `ban_giao`, `bao_tri`, `thiet_bi`.
- **StatusBadge thông minh:** Nâng cấp `<StatusBadge />` để tự động ánh xạ class màu từ registry dựa trên `domain` và `code`, loại bỏ việc định nghĩa màu thủ công tại các component.
- **Chuẩn hóa Page Layout:**
  - Triển khai `<PageBody />` và đảm bảo 100% route sử dụng `<PageHeader />`.
  - Tích hợp mặc định `EmptyState`, `Skeleton`, và `ErrorState` vào `StandardTable`.
- **Audit màu sắc:** Quét và thay thế các class màu Tailwind cứng (`bg-emerald-100`, `text-red-700`...) bằng các semantic tokens hoặc registry trạng thái.

## Giai đoạn 15.2: Tối ưu hóa Thành phần hệ thống & Cây hệ thống (GĐ 9 & 10)

**Mục tiêu:** Giảm tải cho hai trang nặng nhất hệ thống.

- **Thành phần hệ thống (56 cột → 8 cột):**
  - Áp dụng `ViewPreset` cho `ThanhPhanTable`. Mặc định hiển thị 8 cột cơ bản.
  - Chuyển các cột đặc tính động vào panel **row-expand** thay vì để ở cột chính.
- **Cây hệ thống (Module hóa file 6k dòng):**
  - Tách `_app.he-thong.cay.tsx` thành các sub-components: `TreeView`, `CayMindMap`, `useTreeData`, `TreeToolbar`.
  - Gộp 12 tab hiện tại thành 4 tab chức năng rõ rệt: `Cây phân cấp`, `Danh sách phẳng`, `Tương thích`, `Nâng cao`.
  - Triển khai Virtualization cho cây để xử lý >2.000 node mượt mà.

## Giai đoạn 15.3: Hợp nhất Dashboard & Tối ưu Form (GĐ 12 & 13)

**Mục tiêu:** Xóa bỏ sự chồng chéo và cải thiện trải nghiệm nhập liệu.

- **Hợp nhất Dashboard:**
  - Chuyển `_app.index` thành trung tâm hành động ("Hôm nay làm gì").
  - Chuyển `_app.tong-quan` thành trung tâm phân tích xu hướng dài hạn.
  - Xóa các widget trùng lặp giữa hai trang.
- **Form Wizard:**
  - Chuyển các form dài (`SuCoMoiForm`, `BaoTriMoiForm`) sang dạng Wizard 3 bước.
  - Triển khai `useOfflineDraft` để lưu nháp tự động vào `localStorage`.

## Giai đoạn 15.4: Kiểm tra & Chốt kết luận (GĐ 7 mở rộng)

- **Verify UI Consistency:** Chạy script quét toàn bộ route để đảm bảo không còn màu hardcode và đủ `PageHeader`.
- **Smoke Test Mobile:** Kiểm tra Card View của `StandardTable` và các nút hành động lớn trên trang QR hiện trường.
- **Tài liệu bàn giao:** Cập nhật `docs/ui-consistency-checklist.md` với các tiêu chuẩn mới.

---

**Tiêu chí hoàn thành:**

1. 0 màu hardcode trong `src/routes`.
2. `ThanhPhanTable` không cuộn ngang ở màn hình 1440px.
3. Trang chủ (`/`) tải và hiển thị KPI trong < 2s.
4. Dark mode hoạt động 100% không mất chữ/viền.

Bạn có đồng ý với thứ tự triển khai này (ưu tiên Nền tảng thị giác trước để tránh sửa lại lần hai) không?
