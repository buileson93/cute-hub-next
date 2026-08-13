# Kế hoạch sửa lỗi tùy chỉnh cột (Column Customization)

## A. Bảng xác nhận nguyên nhân

| Nguyên nhân | Xác nhận | Vị trí (file:dòng) | Bằng chứng / Giải thích |
| :--- | :---: | :--- | :--- |
| **1. hideBelow thắng isCurrentlyVisible** | **ĐÚNG** | `StandardTable.tsx:290-302` | `shownCols` lọc bằng `hideBelow` (Tầng 2), nhưng `DropdownMenu` chỉ check `prefs.isHidden` (Tầng 1). |
| **2. Preset "Đầy đủ" ẩn toàn bộ** | **ĐÚNG** | `StandardTable.tsx:241` & `view-presets.ts:56` | `cot: []` là mảng rỗng (truthy), dẫn đến `visibleKeys` rỗng, làm ẩn mọi cột trong `useColumnPrefs.ts`. |
| **3. Tên trường preset không khớp** | **ĐÚNG** | `view-presets.ts` vs `tp-presets.ts` | Một bên dùng `cot`, một bên dùng `columns`. `StandardTable` dùng `any[]` nên không báo lỗi. |
| **4. Thiếu UI chọn preset / Ghim cứng** | **ĐÚNG** | `ThanhPhanTable.tsx:258` | `activePreset="co-ban"` bị ghim cứng làm `useEffect` luôn áp lại preset sau khi Reset. |
| **5. Nạp lại từ Supabase ghi đè** | **ĐÚNG** | `use-column-prefs.ts:119` | `allKeysSig` thay đổi làm `useEffect` chạy lại, `applyPrefs` ghi đè state hiện tại bằng dữ liệu server cũ. |
| **Phụ 1: setHidden thiếu widths** | **ĐÚNG** | `use-column-prefs.ts:170` | Gọi `persist` nhưng thiếu trường `widths` trong object payload. |
| **Phụ 2: Chặn ẩn cột cuối sai** | **ĐÚNG** | `StandardTable.tsx:738` | Dùng `shownCols.length` (đã bị `hideBelow` lọc) thay vì tổng số cột người dùng muốn hiện. |

## B. Giải pháp chi tiết

### Nguyên nhân 1: Xung đột hideBelow (Chọn Phương án B+)
- **Giải pháp**: Giữ `hideBelow` để bảo vệ layout bảng, nhưng cập nhật UI Menu:
    - Nếu cột bị ẩn do bề rộng: Hiện badge "Ẩn do màn hình hẹp" (hoặc icon cảnh báo) cạnh checkbox.
    - Thêm Tooltip giải thích: "Màn hình hiện tại quá hẹp để hiển thị cột này. Hãy mở rộng trình duyệt hoặc xem ở dòng mở rộng."
- **Rủi ro**: Menu có thể trông hơi rối nếu có quá nhiều badge cảnh báo.

### Nguyên nhân 2 & 3: Chuẩn hóa Preset
- **Giải pháp**:
    - Trong `StandardTable`: Nếu `visibleKeys` rỗng VÀ id là `day-du`, tự động điền `allKeys`.
    - Chuẩn hóa kiểu dữ liệu `ViewPreset` dùng chung cho toàn dự án. Ưu tiên trường `columns`.
    - `StandardTable` sẽ ưu tiên `columns` > `cot` > `visibleKeys`.

### Nguyên nhân 4: UI Preset & Ghim cứng
- **Giải pháp**: 
    - Thêm một `DropdownMenuSub` trong menu "Cột hiển thị" để chọn Preset.
    - Sửa `ThanhPhanTable` và các route: Không truyền `activePreset` dưới dạng string hằng nếu muốn cho phép người dùng tùy chỉnh. Chỉ dùng làm `defaultValue` khi chưa có dữ liệu lưu.

### Nguyên nhân 5: Chống ghi đè (Race Condition)
- **Giải pháp**: 
    - Thêm `isDirty` flag hoặc `lastUpdated` timestamp vào state của `useColumnPrefs`. 
    - Nếu người dùng vừa thao tác (trong vòng 2-3s) thì không cho phép `applyPrefs` từ server ghi đè.
    - Hoặc: `applyPrefs` chỉ chạy khi `ready === false`. Sau khi `ready`, chỉ cho phép `persist` đẩy lên, không cho phép kéo về trừ khi chủ động `reload`.

### Sửa lỗi phụ
- **setHidden**: Thêm `widths` vào payload của `persist`.
- **Chặn ẩn cột cuối**: Dùng `allKeys.length - hidden.size > 1`.

## C. Khuyến nghị cho Nguyên nhân 1
**Chọn Phương án B (Giữ hideBelow nhưng thông báo rõ)**.
*Lý do*: Phương án A (cho phép thắng) sẽ làm vỡ layout bảng trên mobile/tablet, gây tràn ngang cực khó chịu và vi phạm nguyên tắc "Responsive by default" của MIRATS 2.0. Việc thông báo rõ giúp người dùng không cảm thấy bị "im lặng", đồng thời giáo dục người dùng về tính năng tự động tối ưu không gian.

## D. Kế hoạch Commit

1. **Commit 1**: Sửa lỗi Logic cơ bản (`setHidden` thiếu `widths`, chặn ẩn cột cuối, chuẩn hóa trường `cot`/`columns`).
2. **Commit 2**: Sửa lỗi nạp/ghi Supabase (Nguyên nhân 5) để ổn định state.
3. **Commit 3**: Sửa lỗi Preset "Đầy đủ" và logic nạp preset mặc định (Nguyên nhân 2 & 3).
4. **Commit 4**: Nâng cấp UI Menu (Nguyên nhân 1 & 4): Thêm cảnh báo `hideBelow` và Menu chọn Preset.

## E. Danh sách Test bắt buộc
- [ ] Mở menu, tích chọn cột đang bị `hideBelow` ẩn -> Thấy cảnh báo "Màn hình hẹp" và cột không hiện (đúng logic B).
- [ ] Kéo rộng màn hình -> Cột tự xuất hiện, cảnh báo biến mất.
- [ ] Chọn preset "Đầy đủ" -> Tất cả các cột (không bị ẩn cứng) đều hiện ra.
- [ ] Kéo rộng 1 cột, sau đó ẩn/hiện cột khác -> Độ rộng cột cũ vẫn giữ nguyên.
- [ ] Reset bảng -> Bảng về trạng thái mặc định, không bị preset cũ đè lại sau 1s.

## F. Kịch bản kiểm thử tay (UAT)
1. **Bước 1**: Thu nhỏ trình duyệt xuống ~1000px. Mở trang Danh mục thiết bị.
2. **Bước 2**: Bấm "Cột hiển thị". Tìm cột "Ngày mua" (thường có `hideBelow`). 
3. **Bước 3**: Tích chọn. Kiểm tra: Có badge cảnh báo không? Bảng có bị tràn ngang không?
4. **Bước 4**: Phóng to trình duyệt lên > 1440px. Kiểm tra cột có tự hiện không.
5. **Bước 5**: Chọn Preset "Nhà cung cấp". Kiểm tra các cột có đổi đúng tập hợp không.
6. **Bước 6**: F5 trang web. Kiểm tra các tùy chỉnh có giữ nguyên không.
