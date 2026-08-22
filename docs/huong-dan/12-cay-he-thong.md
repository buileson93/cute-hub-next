# 12. Cây Hệ thống

Đường dẫn: `/he-thong/cay` (mặc định).

## 2 chế độ xem

- **List view** (mặc định): bảng cây phân cấp.
- **Mindmap view**: sơ đồ tư duy tương tác.
  Bấm nút **List / Mindmap** trên PageHeader để chuyển.

## Cấu trúc 6 tầng

Phân loại → Ngành → Nhóm → **Hệ thống** → Vị trí → Thiết bị vật lý.

## Thao tác List view

1. Bấm mũi tên `▸` để mở rộng node.
2. Bấm tên node để mở drawer chi tiết.
3. Menu `⋯` → **Thêm con**, **Sửa**, **Xóa**, **Ghi chú**.
4. Lọc: gõ vào ô Search trên đầu bảng.
5. Xuất filter: bấm **Xuất** — dữ liệu xuất theo cây đã lọc.

## Thao tác Mindmap

1. Kéo thả node để sắp xếp.
2. Chuột giữa để pan, cuộn để zoom.
3. Bấm node → drawer chi tiết.
4. **Edit Mode** (chỉ Admin & role được cấp quyền):
   - Bật toggle **Chỉnh sửa** góc trên phải.
   - Sửa trực tiếp trường trên node.
   - **Lưu** để đồng bộ CSDL.
   - Nút **Back** để hoàn tác (Ctrl+Z).
5. **Khai trường mới cho layer thiết bị**: Admin → nút **Cấu hình schema**.

## Ghi chú Markdown & @mention

- Drawer node có tab **Ghi chú** hỗ trợ Markdown.
- Gõ `@` để mention hệ thống khác → tạo liên kết Obsidian-style.
