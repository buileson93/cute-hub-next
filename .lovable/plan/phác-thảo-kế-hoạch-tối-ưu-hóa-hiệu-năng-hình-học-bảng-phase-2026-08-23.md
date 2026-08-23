# Phác thảo Kế hoạch: Tối ưu hóa Hiệu năng & Hình học Bảng (Phase 10Z+)

Tập trung vào việc giải quyết các vấn đề về hiệu năng, cuộn vô tận và tính toàn vẹn của giao diện trong tab "Thành phần & Tài sản".

## Các vấn đề cốt lõi (Root Causes)
1. **Xung đột Scroll**: `PageFrame` dùng `min-h-screen` gây tràn trang; `StandardTable` thiếu ràng buộc chiều cao từ cha.
2. **Dữ liệu dư thừa**: Hai hook infinite mount đồng thời, nạp registry quá sớm.
3. **Logic lọc sai**: `filteredTaiSan` được tính nhưng không được dùng trong bảng.
4. **Hiệu năng Render**: File `ThanhPhanTable.tsx` quá lớn (>2200 dòng), Virtualization chưa tối ưu cho máy yếu.
5. **Thiếu Horizontal Rail**: Thanh cuộn ngang khó tiếp cận khi dữ liệu dài.

## Kế hoạch triển khai

### Giai đoạn 0: Chuẩn bị & Chẩn đoán
- Thiết lập kịch bản kiểm thử TDD để xác nhận lỗi geometry (cuộn trang vs cuộn bảng).
- Kiểm tra số lượng request và bytes khi chuyển đổi giữa các mode.

### Giai đoạn 1: Tách Panel & Tối ưu hóa Hook (Mount-on-Demand)
- Tách `ThanhPhanTable.tsx` thành các component nhỏ:
    - `ThanhPhanTablePanel`: Chứa logic `useInfiniteThanhPhanRows`.
    - `TaiSanTablePanel`: Chứa logic `useInfiniteTaiSanRows`.
- Đảm bảo chỉ mount Panel tương ứng với `viewMode` hiện tại.
- Sử dụng `AbortSignal` để hủy request cũ khi người dùng đổi tab nhanh.

### Giai đoạn 2: Khóa Hình học Bảng (Scroll Ownership)
- **PageFrame**: Loại bỏ `min-h-screen` để tránh scroll trang không mong muốn.
- **AppShell/PageBody**: Đảm bảo chuỗi CSS `height: 100%` hoặc `flex-1 min-h-0` được áp dụng xuyên suốt để bảng có thể xác định chiều cao viewport.
- **StandardTable**: Triển khai "Horizontal Scroll Rail" luôn hiển thị ở đáy vùng nhìn thấy (không phải đáy toàn bộ dữ liệu).

### Giai đoạn 3: Tối ưu hóa Truy vấn & Lọc
- Chuyển search `q` và `bucket` vào server-side filter trong `fetchKeyset`.
- Sửa lỗi mapping: Đảm bảo bảng "Theo tài sản" sử dụng đúng `filteredTaiSan`.
- Cấu hình `staleTime` và `gcTime` hợp lý để giữ cache mà không gây lag khi đổi tab.

### Giai đoạn 4: Tối ưu hóa Virtualization & Render
- **Registry Lazy Loading**: Chỉ tải `modelRegistry` và `multiRoleMap` khi cần thiết (ví dụ: khi mở drawer hoặc hover).
- **Cell Optimization**: Đơn giản hóa các cell trong `StandardTable` khi đang cuộn nhanh.
- **Adaptive Overscan**: Điều chỉnh `overscan` từ 4-15 hàng dựa trên tốc độ phản hồi của thiết bị.

## Chi tiết kỹ thuật
- **Tệp tin ảnh hưởng**:
    - `src/components/mirats/layout/PageFrame.tsx`
    - `src/components/mirats/ThanhPhanTable.tsx`
    - `src/components/mirats/StandardTable.tsx`
    - `src/lib/mirats/db/keyset-supabase.ts`
- **Công cụ xác nhận**: Playwright script đo FPS và kiểm tra geometry (scroll position).

---
*Lưu ý: Không thay đổi thư viện bảng hiện tại, chỉ tối ưu hóa cách sử dụng.*
