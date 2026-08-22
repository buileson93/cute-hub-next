# Kế hoạch Phục hồi và Nâng cấp StandardTable (Phase U10.2)

Mục tiêu: Áp dụng quy trình `obra/superpowers` để giải quyết triệt để lỗi render sai bản ghi, cuộn vô tận (Infinite Scroll) không ổn định và các vấn đề về hiệu năng ảo hóa (Virtualization) trong `StandardTable`.

## Ràng buộc & Nguyên tắc
- **Không redesign**: Giữ nguyên ngôn ngữ thiết kế MIRATS (palette/typography/radius).
- **Tính đúng đắn (Correctness)**: Không render sai bản ghi sau khi filter/sort.
- **Hiệu năng**: Chỉ render các dòng trong viewport + overscan.
- **Ổn định**: Một scroll owner duy nhất, không nhảy `scrollTop` khi tải thêm batch.

## Các tệp tin trọng tâm
- `src/components/mirats/StandardTable.tsx` (Core logic)
- `src/components/mirats/__tests__/StandardTable.test.tsx` (Integration tests)
- `src/lib/mirats/ui/table-geometry.ts` (Measurement logic)
- `src/routes/_app.vat-tu.tsx` (Pilot cho Infinite Query)

---

## Giai đoạn 0: Xác minh và Viết Test RED (TDD)
Trước khi sửa implementation, tạo các bài test thất bại (RED) để chứng minh lỗi:
1. **Virtual row correctness**: Tạo rows A, B, C; sort descending thành C, B, A; kiểm tra virtual index 0 phải render C và trỏ đúng ID của C.
2. **Client virtual mode**: Tạo 10.000 dòng, xác minh không có pagination UI và số lượng `<tr>` trong DOM không vượt quá giới hạn.
3. **Infinite mode**: Kiểm tra `fetchNextPage` được gọi đúng một lần khi cuộn gần cuối, không duplicate ID khi nối batch mới.
4. **Dynamic row**: Kiểm tra việc mở/đóng expanded row làm thay đổi `measured size` và không gây chồng dòng.
5. **Column preferences**: Kiểm tra tính nguyên tử (atomic) của việc reset/resize và tính độc lập giữa các `tableKey` khác nhau.

## Giai đoạn 1: Sửa Pipeline Dữ liệu (Data Integrity)
Chuẩn hóa luồng biến đổi dữ liệu:
`rawRows` → `filteredRows` → `sortedRows` → `visibleRows` → `virtualItems`

- Thiết lập `rowVirtualizer.count = visibleRows.length`.
- Render bằng `visibleRows[virtualRow.index]`, tuyệt đối không dùng `rows`.
- `getItemKey` của virtualizer sử dụng stable ID từ `getRowId`.
- Nếu row ID null/trùng, thông báo lỗi rõ trong môi trường dev thay vì âm thầm bỏ qua.

## Giai đoạn 2: Tách bạch Virtual và Paged Mode
- Dùng `discriminated union` để định nghĩa rõ các chế độ: `Client Virtual`, `Infinite Virtual`, và `Paged Legacy`.
- Không cho phép `clientPagination` và `virtual mode` cùng hoạt động đồng thời (báo lỗi nếu cấu hình xung đột).
- Cung cấp adapter tương thích ngược cho các màn hình chưa migrate.

## Giai đoạn 3: Kết nối Infinite Query (Pilot: /vat-tu)
- Truyền đủ `hasNextPage`, `isFetchingNextPage`, `fetchNextPage` vào Table.
- Sử dụng `intersection observer` hoặc threshold của virtualizer để preload batch kế tiếp.
- Hiển thị footer row trạng thái: "Đang tải thêm...", "Lỗi + Thử lại", "Đã đến cuối danh sách".
- Sử dụng keyset cursor `(sortField, id)` cho các tập dữ liệu thay đổi thường xuyên để tránh duplicate/skip.

## Giai đoạn 4: Một Scroll Owner & Đo lường Động
- Biến container của `StandardTable` thành scroll owner duy nhất (cả dọc và ngang).
- Loại bỏ các overflow container lồng nhau gây sai lệch đo lường.
- Sticky header phải đồng bộ với viewport của virtualizer.
- Gộp main row và expanded content vào mộtmeasurable item hoặc wrapper chung.
- Tự động remeasure khi thay đổi density hoặc resize cột gây wrap text.

## Giai đoạn 5: Sửa Column Preferences
- Cập nhật `use-column-prefs.ts` để xử lý layout mode chính xác.
- `resetAllWidths()` phải là một atomic update.
- Tối ưu hóa việc đo text: cache canvas context thay vì tạo mới liên tục.
- Đảm bảo `tableKey` là bắt buộc đối với các bảng cần persistence.

## Giai đoạn 6: Selection & Accessibility (A11y)
- Định nghĩa rõ "Select All" trong infinite mode (tất cả đã tải).
- Header checkbox phản ánh đúng trạng thái của các dòng đang hiển thị/đã tải.
- Mọi nút icon-only phải có `aria-label`.
- Đảm bảo focus không bị nhảy khi virtual row tái sử dụng DOM.

## Giai đoạn 7: Tối ưu hóa Pipeline
- Memo hóa các giá trị tìm kiếm (searchable values).
- Sử dụng `deferred value` cho text search để giữ input phản hồi tức thì.
- Cache facets cho bộ lọc categorical.

---

## Quy trình Xác minh (Verification)
Chạy và kiểm tra output của các lệnh sau:
1. `npm test` (Đặc biệt là các test case mới cho virtual pipeline).
2. `npm run typecheck`
3. `npm run lint`
4. `npm run build`
5. `npm run ui:audit`

Kiểm tra thủ công trên Playwright/Browser tại các độ phân giải: 390px, 768px, 1024px, 1440px.
Ghi nhận: Số lượng DOM rows, số lần fetch, hiện tượng giật lag khi append batch, và tính ổn định của sticky header.
