---
name: Chuẩn hóa chiều cao và căn lề TreeView
description: Chuẩn hóa chiều cao và căn lề ngang của các nút cây trong TreeView Sổ lý lịch để đảm bảo tính nhất quán về thị giác giữa các cấp độ và loại nút khác nhau.
type: design
---

## Mục tiêu
- Đảm bảo tất cả các nút cây có căn lề dọc nhất quán bất kể nội dung hoặc độ sâu của chúng.
- Khắc phục sự cố các "ô" mục cây (vùng hover) có chiều dài không bằng nhau hoặc căn lề không khớp.
- Căn chỉnh các icon và nhãn (label) trên các mức độ phân cấp khác nhau.

## Chi tiết triển khai
- **Chiều cao nhất quán**: Thiết lập chiều cao cố định hoặc chiều cao tối thiểu cho các hàng nút (ví dụ: `h-8` hoặc `h-9`) để ngăn chặn việc thay đổi bố cục.
- **Căn lề Icon**: Sử dụng chiều rộng container tiêu chuẩn cho các mũi tên mở rộng và icon nút (ví dụ: `w-6`) để giữ cho các nhãn văn bản được căn thẳng hàng theo chiều dọc.
- **Logic phân cấp**: Điều chỉnh chiến lược lề trái/padding để sử dụng khoảng cách thụt đầu dòng nhất quán cho mỗi cấp độ (ví dụ: `20px` mỗi cấp) thay vì sử dụng các class `ml-*` thay đổi.
- **Chuẩn hóa Badge**: Cố định chiều rộng của các badge đếm số lượng để ngăn chúng đẩy các thành phần khác hoặc gây ra vấn đề căn lề.
- **Nút hành động**: Đảm bảo các nút "ghost" ở bên phải không ảnh hưởng đến chiều cao hàng và luôn được căn giữa theo chiều dọc.

## Nhiệm vụ kỹ thuật
- Tái cấu trúc hàm `renderNode` trong `src/components/mirats/so-ly-lich/TreeView.tsx`.
- Thay thế `ml-4` có điều kiện bằng `style={{ paddingLeft: level * 20 }}` hoặc padding Tailwind nhất quán.
- Chuẩn hóa các wrapper icon thành `w-5` hoặc `w-6` với flex-center.
- Đảm bảo container hàng `astryx-control` có chiều cao cố định và `items-center`.
