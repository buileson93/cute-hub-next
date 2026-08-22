# Phục hồi giao diện trang Đăng nhập (Logo và Tabs)

Người dùng phản hồi rằng các thay đổi gần đây đối với kích thước logo và bố cục các tab (Đăng nhập/Đăng ký) không đẹp bằng phiên bản cũ. Kế hoạch này sẽ khôi phục lại các thành phần này về trạng thái tốt nhất trước đó trong khi vẫn đảm bảo sự cân đối.

## Các thay đổi chính

### 1. Phục hồi kích thước Logo

- Thay đổi `h-16 w-auto` hiện tại thành `h-auto w-full max-w-[560px]`.
- Điều này sẽ giúp logo hiển thị lớn và rõ nét hơn như trong thiết kế ban đầu.

### 2. Khôi phục bố cục Tabs (Đăng nhập/Đăng ký)

- Chuyển từ bố cục `flex` hiện tại quay lại `grid grid-cols-2`.
- Hiệu chỉnh lại `motion.div` (nền trắng chạy dưới các tab) để đảm bảo căn giữa hoàn hảo và khớp với lưới 2 cột.
- Sử dụng `w-[calc(100%-12px)]` (tương đương với việc trừ đi `p-1.5` ở cả hai bên) và logic dịch chuyển `x` dựa trên phần trăm để chính xác hơn.

### 3. Tinh chỉnh căn giữa văn bản

- Đảm bảo các nút trong tab sử dụng `flex items-center justify-center` để văn bản luôn nằm chính giữa, bất kể kích thước màn hình.

## Chi tiết kỹ thuật

### Tệp tin bị ảnh hưởng:

- `src/routes/auth.tsx`

### Cấu trúc dự kiến cho Tabs:

```tsx
<div className="relative mb-10 grid grid-cols-2 rounded-2xl bg-[#f1f5f9] p-1.5">
  <motion.div
    className="absolute inset-y-1.5 w-[calc(50%-4.5px)] rounded-xl bg-white shadow-sm ring-1 ring-black/5"
    animate={{ x: mode === "signin" ? "0%" : "100%" }}
    // Cần điều chỉnh logic x để khớp với vị trí thực tế trong container p-1.5
  />
  {/* Buttons... */}
</div>
```

Tôi sẽ kiểm tra lại kỹ lưỡng bằng công cụ xem trước (Playwright) sau khi áp dụng để đảm bảo độ chính xác 100% so với yêu cầu "đẹp như cũ".
