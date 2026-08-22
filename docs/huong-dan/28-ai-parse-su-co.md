# 28. AI hỗ trợ nhập liệu sự cố (Beta)

## Khi nào dùng

Khi bạn có 1 đoạn text mô tả sự cố dài (email, tin nhắn Zalo, biên bản viết tay đã OCR…) và muốn nhanh chóng điền vào form.

## Cách dùng

1. Vào `/su-co/moi`.
2. Bấm nút **AI** thu gọn ở đáy form.
3. Dán nguyên đoạn mô tả vào textarea.
4. Bấm **Phân tích**.
5. AI trả về JSON các trường đã suy luận:
   - Thiết bị / Hệ thống ảnh hưởng.
   - Thời điểm.
   - Mức độ.
   - Hiện tượng, nguyên nhân dự đoán.
6. Xem preview → **Áp dụng vào form** — các ô sẽ được điền, bạn kiểm tra lại rồi **Lưu**.

## Mẹo

- Nếu AI không tìm thấy mã thiết bị, nó ghi vào phần "Mô tả" và bạn tự chọn từ dropdown.
- AI ưu tiên khớp theo Serial > Tên > Mô tả.
