---
name: U7 UI Integrity Fixes
description: Hướng dẫn sửa lỗi chồng lấn UI và duy trì liêm chính giao diện MIRATS.
type: feature
---

# Hướng dẫn Phục hồi Liêm chính UI (Phase U7)

## 1. Sửa lỗi Chồng lấn (Overlap)

**Nguyên nhân:** Sử dụng `position: absolute` cho các icon/shortcut bên trong nút mà không dự phòng khoảng trống (padding) tương ứng, hoặc sử dụng `pl-10` nhưng text vẫn tràn.

**Giải pháp:**

- Ưu tiên sử dụng `flex` hoặc `grid` để phân vùng rõ ràng cho Icon, Text, và Shortcut.
- Nếu dùng `absolute`, phải đảm bảo phần text có `padding` tương ứng với chiều rộng của phần tử absolute đó.

## 2. Ổn định Layout khi Loading

**Nguyên nhân:** Khi hiện spinner, text bị ẩn đi làm thay đổi kích thước nút, gây nhảy layout cho các phần tử bên cạnh.

**Giải pháp:**

- Text gốc nên được đặt trong một container có `visibility: hidden` hoặc `opacity: 0` để giữ nguyên diện tích chiếm chỗ.
- Spinner được đặt `absolute` ở giữa nút.

## 3. Chống tràn văn bản (Truncate)

**Nguyên nhân:** Text quá dài đè lên các nút hành động bên phải.

**Giải pháp:**

- Luôn sử dụng `truncate` hoặc `line-clamp` cho các vùng tiêu đề/mô tả.
- Container cha phải có `min-w-0` để cơ chế `truncate` hoạt động chính xác trong `flex`.

## 4. Kiểm tra bằng Tool

- Chạy `python3 scripts/verify-ui-integrity.py` sau mỗi lần thay đổi UI quan trọng.
- Sử dụng phím tắt `Shift + D` trong preview để bật `Density Toggle` kiểm tra ở các chế độ khác nhau.
