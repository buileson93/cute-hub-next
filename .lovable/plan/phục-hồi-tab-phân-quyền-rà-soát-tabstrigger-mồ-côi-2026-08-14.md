# Phục hồi Tab Phân quyền & Rà soát TabsTrigger Mồ côi

## 1. Xác nhận lỗi Tab Phân quyền (src/routes/\_app.phan-quyen.tsx)

- **Hiện trạng**: Tệp đã được module hóa thành 5 component (`RoleOverview`, `PermissionMatrix`, `DistributionStats`, `AuditLogViewer`, `SecurityPolicies`).
- **Lỗi xác thực**: `TabsTrigger` hiện diện nhưng thiếu `TabsContent`. Bốn component nội dung đang render đồng thời bên dưới `TabsList`, khiến UI bị tràn và các nút tab không có tác dụng.
- **Hệ quả**: Trang Phân quyền bị vỡ bố cục hiển thị tất cả các tab cùng lúc.

## 2. Quyết định hướng xử lý

**Chọn Hướng A: Khôi phục cơ chế tab.**

- **Căn cứ**: Lượng nội dung của `PermissionMatrix` và `AuditLogViewer` rất lớn (ma trận hàng chục cột, log hàng trăm dòng). Việc dùng Tab giúp người dùng tập trung vào từng nghiệp vụ cụ thể (Cấu hình vs Kiểm toán) và tránh gây mệt mỏi thị giác.
- **Thực hiện**: Bọc các component vào `TabsContent` tương ứng với `value` đã định nghĩa.

## 3. Danh sách TabsTrigger mồ côi (Thiếu TabsContent)

Qua rà soát toàn bộ dự án, các tệp sau đang mắc lỗi tương tự:

| Tệp                                       | Số lượng Triggers | Tình trạng                                             |
| :---------------------------------------- | :---------------: | :----------------------------------------------------- |
| `src/routes/_app.phan-quyen.tsx`          |         5         | **Nặng**: Hiển thị tất cả tab cùng lúc.                |
| `src/routes/_app.bao-tri.pm.tsx`          |         4         | **Nặng**: Danh sách PM hiện chung, tab không lọc được. |
| `src/routes/_app.admin.forms.$id.tsx`     |         7         | **Nặng**: Designer, Checklist, Info hiện đè nhau.      |
| `src/routes/_app.bao-cao.do-tin-cay.tsx`  |         4         | **Nặng**: Các biểu đồ thời gian hiện cùng lúc.         |
| `src/routes/_app.he-thong.thanh-phan.tsx` |         6         | **Nặng**: View Bảng/Cây/Mindmap hiện chồng chéo.       |
| `src/routes/_app.he-thong.cay.tsx`        |         6         | **Nặng**: Tương tự như trên.                           |
| `src/routes/_app.tickets.tsx`             |         6         | **Nặng**: Tab lọc Ticket không hoạt động.              |

_Lưu ý: Có một số tệp có số lượng không khớp do logic render động hoặc dùng `Tabs` để điều khiển state bên ngoài thay vì dùng `TabsContent` (ví dụ: `DetailLayout.tsx`), nhưng các tệp trên là lỗi hiển thị rõ rệt._

## 4. Bảng tra cứu Hàm trợ giúp (phan-quyen)

| Tên hàm          | Trạng thái | Vị trí hiện tại                                       | Tính năng phụ thuộc                                   |
| :--------------- | :--------- | :---------------------------------------------------- | :---------------------------------------------------- |
| `permToTier`     | **CÒN**    | `src/components/mirats/phan-quyen/types.ts`           | Hiển thị màu sắc/nhãn trong `PermissionMatrix`.       |
| `describeAction` | **CÒN**    | `src/components/mirats/phan-quyen/AuditLogViewer.tsx` | Giải mã hành động (Create/Update...) trong Audit Log. |
| `fmtTs`          | **CÒN**    | `src/components/mirats/phan-quyen/AuditLogViewer.tsx` | Định dạng thời gian trong Audit Log.                  |

## 5. Kế hoạch thực hiện

1. **Sửa lỗi Tab Phân quyền**: Bọc nội dung vào `TabsContent`.
2. **Sửa lỗi Tab PM**: Chuyển table vào `TabsContent` hoặc dùng tab state để filter (hiện tại `bao-tri.pm.tsx` đang dùng `tab` state để filter `rows` nhưng vẫn thiếu `TabsContent` bọc ngoài table khiến UI không chuẩn shadcn).
3. **Sửa lỗi Designer**: Khôi phục `TabsContent` cho `SimpleFormDesigner`, `ChecklistDesigner`, v.v.
4. **Tạo script kiểm tra chống hồi quy**: Quét tệp `.tsx` có `TabsTrigger` nhưng không chứa `TabsContent`.

## 6. Kiểm thử tự động (Script dự kiến)

Tạo `src/scripts/check-broken-tabs.ts`:

- Đếm số node `<TabsTrigger` và `<TabsContent`.
- Nếu file chứa `TabsTrigger` mà `TabsContent` = 0 (và không thuộc danh sách whitelist điều khiển state): Báo lỗi.

## Kỹ thuật

- Không gộp file, giữ nguyên cấu trúc module.
- Import `TabsContent` từ `@/components/ui/tabs`.
- Đảm bảo `defaultValue` của `Tabs` khớp với các `value` của `TabsContent`.
