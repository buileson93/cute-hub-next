# Kế hoạch Thống nhất Hệ thống Trạng thái (Status Unification)

Kế hoạch này nhằm đưa 3 hệ thống trạng thái đang chạy song song về một nguồn sự thật duy nhất (Single Source of Truth), sử dụng các biến semantic thay vì màu sắc Tailwind cố định, đảm bảo tính nhất quán và khả năng truy cập.

## Phân tích hiện trạng

- **Hệ 1 (Chuẩn)**: `astryx-component-skins.css` sử dụng biến semantic (`success`, `warning`, v.v.).
- **Hệ 2 (Cũ)**: `status-tokens.ts` dùng bảng màu Tailwind cứng (`bg-emerald-500/10`).
- **Hệ 3 (Tự phát)**: ~500 vị trí dùng màu cứng trong các component.
- **Dữ liệu DB**: Bảng `dm_trang_thai_thiet_bi` có 6 mã: `DANG_KHAI_THAC`, `DANG_SUA_CHUA`, `HONG`, `CHO_XU_LY`, `NGUNG_KHAI_THAC`, `THANH_LY`. Trong khi file code đang khai báo 10 mã (có sự sai lệch cần xử lý).

## Các bước thực hiện

### 1. Chuẩn hóa Token (src/lib/mirats/ui/status-tokens.ts)

- Thay thế các màu palette (emerald, amber, red, v.v.) bằng các class semantic từ `astryx-component-skins.css` hoặc sử dụng `color-mix` trực tiếp trên các biến CSS (`--success`, `--warning`, v.v.).
- Định nghĩa lại `TYPO_STATUS` (tên mới thay cho `TRANG_THAI_TOKEN`) đảm bảo mỗi trạng thái có đủ 3 kênh:
  - **Màu sắc**: Semantic classes (ví dụ: `astryx-status-attention`).
  - **Biểu tượng**: Lucide icon name (ví dụ: `CheckCircle2`).
  - **Nhãn**: Tiếng Việt (ví dụ: `Đang khai thác`).
- Tách bảng ánh xạ tên cũ (`LEGACY_NAME_TO_MA`) để hỗ trợ tương thích ngược.
- Thêm cơ chế cảnh báo:
  - `getWarningCount()`: Đếm số lần gặp mã lạ.
  - `console.warn` trong môi trường dev khi không tìm thấy mã.
  - Fallback về màu xám trung tính.

### 2. Cập nhật Registry (src/lib/mirats/ui/status-registry.ts)

- Cập nhật hàm `getToken` để sử dụng hệ thống token mới.
- Hỗ trợ tra cứu theo cả mã mới (invariant) và tên cũ (legacy).

### 3. Cập nhật Component (src/components/mirats/StatusBadge.tsx)

- Sử dụng `TYPO_STATUS` để render đầy đủ Icon + Text.
- Đảm bảo độ tương phản tốt trong cả Light/Dark mode và phân biệt được khi in đen trắng (nhờ Icon).

### 4. Kiểm thử (src/lib/mirats/ui/**tests**/status-tokens.test.ts)

- Viết test case kiểm tra:
  - Đủ 3 kênh thông tin.
  - Không chứa tên màu Tailwind cứng.
  - Tăng bộ đệm cảnh báo khi gặp mã sai.
  - Sự nhất quán giữa mã và tên legacy.

## Chi tiết kỹ thuật

- **Màu sắc**: Sử dụng `.astryx-status-normal/attention/warning/danger/info`.
- **Icon**: Sử dụng `StatusIcon` hoặc `Icon` component hiện có.
- **Accessibility**: Đảm bảo `aria-label` đầy đủ cho các badge.

## Lưu ý quan trọng

- **Sai lệch mã DB**: Tôi đã kiểm tra `dm_trang_thai_thiet_bi` và thấy 6 mã, trong khi file có 10. Tôi sẽ ưu tiên 6 mã từ DB và ánh xạ các mã còn lại vào `LEGACY_NAME_TO_MA` hoặc gộp nhóm nếu chúng tương đương (ví dụ: `DANG_SU_DUNG` và `DANG_KHAI_THAC`).
