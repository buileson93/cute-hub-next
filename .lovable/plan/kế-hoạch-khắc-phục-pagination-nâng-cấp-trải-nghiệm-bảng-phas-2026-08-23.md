# Kế hoạch Khắc phục Pagination & Nâng cấp Trải nghiệm Bảng (Phase 11D)

Người dùng phản ánh dữ liệu bị dừng ở mức 500 bản ghi (trước đó là 100) và khó khăn trong việc quan sát toàn bộ (>1000) bản ghi. Kế hoạch này tập trung vào tính tin cậy của Infinite Scroll, tối ưu tìm kiếm và bổ sung kiểm thử tự động.

## 1. Cập nhật Lộ trình Văn bản (Verbatim Edits)
- Cập nhật tooltip trong `src/components/mirats/app-shell/TopBar.tsx` và `aria-label` trong `src/components/mirats/TzClock.tsx` với nội dung tiếng Việt mới theo yêu cầu.

## 2. Khắc phục lỗi "Dừng ở 500/All" & Tối ưu Pagination
- **Phân tích nguyên nhân**: Kiểm tra `getNextPageParam` và logic `fetchKeyset` để đảm bảo khi `rows.length === 500`, trang tiếp theo luôn được yêu cầu.
- **Giải pháp "Nhìn thấy hết"**:
    - Tăng `overscan` của virtualizer để tải trước nhiều dữ liệu hơn.
    - Đảm bảo `HorizontalScrollRail` không che khuất vùng nhận diện "Bottom Reached".
    - Bổ sung nút "Tải tất cả còn lại" (Load All Remaining) ở cuối danh sách nếu người dùng muốn bỏ qua chế độ tải từng phần.
- **Theo dõi hiệu năng**: Thêm logging vào `fetchKeyset` để ghi lại thời gian phản hồi và số lượng bản ghi thực tế từ Supabase.

## 3. Tối ưu Search & Filter (Debounce & Sync)
- Đồng bộ hóa `useDebounce` chặt chẽ hơn trong `ComponentTablePanel.tsx` và `AssetTablePanel.tsx`.
- Đảm bảo khi tìm kiếm, `infiniteQuery` được reset hoàn toàn (`initialPageParam: null`) để tránh trộn lẫn dữ liệu cũ/mới.
- Bổ sung `loadingIndicator` rõ ràng ngay tại ô search khi đang chờ API phản hồi.

## 4. Cải thiện Trạng thái UI (Loading/Empty/Error)
- Nâng cấp `TableSkeleton` để khớp chính xác với số cột và chiều rộng cột hiện tại.
- Hiển thị thông báo "Đang tải thêm..." (Infinite loading spinner) ở cuối bảng thay vì chỉ có spinner chung của cả trang.
- Xử lý trường hợp "Không tìm thấy kết quả" (Empty State) với nút Xóa bộ lọc nhanh.

## 5. Kiểm thử Tự động (Playwright E2E)
- Xây dựng file test `tests/table-integrity.test.py` để:
    - Kiểm tra Select All có hoạt động trên toàn bộ dữ liệu (cả trang đã tải và chưa tải nếu logic backend cho phép).
    - Cuộn xuống cuối trang 3-5 lần để xác nhận dữ liệu tải tiếp tục vượt qua mốc 500/1000.
    - Kiểm tra responsive layout trên Mobile (375px) và Tablet (768px).

## Chi tiết kỹ thuật
- Tệp tin ảnh hưởng:
    - `src/components/mirats/StandardTable.tsx`: Tối ưu logic trigger `fetchNextPage`.
    - `src/components/mirats/inventory/ComponentTablePanel.tsx`: Thêm loading states và debounce sync.
    - `src/components/mirats/ThanhPhanTable.tsx`: Nâng `kichThuoc` hoặc chuyển sang dynamic sizing nếu cần.
    - `src/lib/mirats/db/keyset-supabase.ts`: Thêm telemetry logs.

```python
# Mẫu E2E test cho Table Selection & Pagination
async def test_table_pagination(page):
    await page.goto("http://localhost:8080/he-thong/thanh-phan")
    # Kiểm tra ban đầu
    initial_rows = await page.locator(".astryx-table-row").count()
    # Cuộn xuống
    await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    # Đợi loading...
    # Kiểm tra rows mới > initial_rows
```
