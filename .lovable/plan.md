# Kế hoạch T15: Cập nhật tài liệu kỹ thuật (Handbook)

Cập nhật Handbook sau đợt cải tiến lớn (T1-T14) để khớp với thực tế mã nguồn. Đảm bảo số lượng route và component trong tài liệu phản ánh chính xác trạng thái dự án.

## Mục tiêu
- Khớp 107 route (hiện tại trong tài liệu liệt kê thiếu ~39 route).
- Khớp 212 component (hiện tại tài liệu ghi 128).
- Thống kê lại 154 module trong `src/lib/mirats/` và 15 hook chính.
- Ghi lại các quyết định kiến trúc quan trọng từ T1-T14.

## Các bước thực hiện

### 1. Cập nhật README.md
- Thêm dòng cảnh báo: "Bộ tài liệu này là tham khảo, nguồn sự thật về CSDL là supabase/dump/schema.sql."

### 2. Cập nhật routes.md
- Bổ sung `/gop-gach` (`_app.gop-gach.tsx`) - Gamification.
- Bổ sung `/chat-luong-du-lieu` (`_app.chat-luong-du-lieu.tsx`) - KPI Data quality.
- Bổ sung các route thiếu khác (phân quyền mới, admin mới...).
- Cập nhật số tổng cộng là 107 route.

### 3. Cập nhật components.md
- Cập nhật cấu trúc thư mục mới: `app-shell/`, `he-thong-cay/`, `thiet-bi-detail/`, `phan-quyen/`, `vat-tu/`, `tuan-thu/`, `so-ly-lich/`.
- Cập nhật số tổng cộng là 212 component.
- Phân loại lại các component quan trọng mới thêm (ResponsiveDialog, MultiRoleBadge...).

### 4. Cập nhật lib-mirats.md (nếu có) hoặc cập nhật trong components.md
- Đính chính con số 154 module thực tế.

### 5. Ghi nhận bài học kinh nghiệm (06-bai-hoc-kinh-nghiem.md)
- Quyết định gỡ bỏ `react-virtual` (T10).
- Áp dụng `ResponsiveDialog` cho các form quan trọng (T9).
- Quy ước `hideBelow` cho tính đáp ứng (T13, T14).
- Nối lại `useColumnPrefs` cho `StandardTable` (T6).
- Đồng bộ `IndexedDBStorage` cho offline queue (T8).

## Kiểm tra
- Chạy lệnh đếm lại file để verify con số trong tài liệu.
- Đảm bảo không sửa file mã nguồn nào.
