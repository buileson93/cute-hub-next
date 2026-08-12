---
name: Task T14 - Responsiveness for Group 2 Tables
description: Apply hideBelow to columns in 5 specific route files following strict responsiveness conventions.
type: feature
---

# T14 - Rải hideBelow cho nhóm bảng thứ hai (Đợt 4)

## Mục tiêu
Tối ưu hóa khả năng hiển thị trên di động cho 5 bảng dữ liệu tiếp theo bằng cách sử dụng thuộc tính `hideBelow` của `StandardTable`.

## Quy ước áp dụng (BP_PX: sm=640, md=768, lg=1024, xl=1280, 2xl=1536)
- **Tên và mã**: Luôn hiện (Không đặt `hideBelow`).
- **Trạng thái**: `sm`.
- **Vị trí, đơn vị**: `md`.
- **Model, số serial**: `lg`.
- **Ngày tháng, nhà cung cấp**: `xl`.
- **Cột dẫn xuất, ảnh chụp, file**: `2xl`.

## Các bảng mục tiêu và kế hoạch chỉnh sửa

### 1. `src/routes/_app.ban-giao.tsx`
- **Bảng `ban_giao_all`**:
    - `ma`: Luôn hiện.
    - `loai`: `hideBelow: "sm"`.
    - `thiet_bi`: Luôn hiện.
    - `nguoi_nhan`: Luôn hiện.
    - `don_vi_nhan`: `hideBelow: "md"`.
    - `ngay_nhan`: `hideBelow: "xl"`.
    - `ngay_tra`: `hideBelow: "xl"`.
    - `thoi_gian_giu`: `hideBelow: "2xl"`.
    - `trang_thai`: `hideBelow: "sm"`.
    - `bien_ban`: `hideBelow: "2xl"`.
- **Bảng `ban_giao_holding`**:
    - `thiet_bi`: Luôn hiện.
    - `nguoi_nhan`: Luôn hiện.
    - `don_vi_nhan`: `hideBelow: "md"`.
    - `loai`: `hideBelow: "sm"`.
    - `ngay_nhan`: `hideBelow: "xl"`.
    - `thoi_gian_giu`: `hideBelow: "2xl"`.
    - `tinh_trang`: `hideBelow: "2xl"`.
    - `actions`: Luôn hiện.

### 2. `src/routes/_app.hong-hoc.tsx`
- **Bảng `hong_hoc_phieu_list`**:
    - `ma_hong_hoc`: Luôn hiện.
    - `ngay_hong`: `hideBelow: "xl"`.
    - `thiet_bi_hong`: Luôn hiện.
    - `bo_phan_hong`: Luôn hiện.
    - `phuong_an`: `hideBelow: "sm"`.
    - `thay_the`: `hideBelow: "2xl"`.
    - `chi_phi`: `hideBelow: "2xl"`.
    - `trang_thai`: `hideBelow: "sm"`.
    - `actions`: Luôn hiện.

### 3. `src/routes/_app.kiem-dinh.tsx`
- **Bảng `kiem_dinh_hieu_chuan`**:
    - `ma_thiet_bi`: Luôn hiện.
    - `ten_thiet_bi`: Luôn hiện.
    - `don_vi`: `hideBelow: "md"`.
    - `loai`: `hideBelow: "sm"`.
    - `so_giay`: Luôn hiện.
    - `ngay_bat_dau`: `hideBelow: "xl"`.
    - `ngay_het_han`: `hideBelow: "xl"`.
    - `canh_bao`: `hideBelow: "2xl"`.
    - `actions`: Luôn hiện.

### 4. `src/routes/_app.phan-mem-ban-quyen.tsx`
- **Bảng `phan_mem_ban_quyen_visual`**:
    - `ten_phan_mem`: Luôn hiện.
    - `nha_phat_hanh`: `hideBelow: "xl"`.
    - `loai`: `hideBelow: "sm"`.
    - `ghe`: `hideBelow: "2xl"`.
    - `ngay_het_han`: `hideBelow: "xl"`.
    - `trang_thai`: `hideBelow: "sm"`.
    - `gia_tri`: `hideBelow: "2xl"`.
    - `actions`: Luôn hiện.

### 5. `src/routes/_app.tuoi-tho.tsx`
- **Bảng `tuoi_tho_all`**:
    - `thiet_bi`: Luôn hiện.
    - `don_vi`: `hideBelow: "md"`.
    - `he_thong`: `hideBelow: "md"`.
    - `health`: `hideBelow: "2xl"`.
    - `xep_loai`: `hideBelow: "sm"`.
    - `pt_vong_doi`: `hideBelow: "2xl"`.
    - `su_co_12t`: `hideBelow: "2xl"`.
    - `downtime`: `hideBelow: "2xl"`.
    - `con_lai`: `hideBelow: "2xl"`.
    - `khuyen_nghi`: `hideBelow: "2xl"`.
- **Bảng `tuoi_tho_critical`**:
    - `thiet_bi`: Luôn hiện.
    - `don_vi`: `hideBelow: "md"`.
    - `health`: `hideBelow: "2xl"`.
    - `xep_loai`: `hideBelow: "sm"`.
    - `pt_vong_doi`: `hideBelow: "2xl"`.
    - `ty_le_chi_phi`: `hideBelow: "2xl"`.
    - `nam_thay`: `hideBelow: "xl"`.
    - `gia_tri`: `hideBelow: "2xl"`.

## Tiêu chí hoàn thành
1. Chỉnh sửa xong 5 tệp trên.
2. Kiểm tra `npx tsc --noEmit` không có lỗi.
3. Kiểm tra `npm test` không có lỗi mới.
4. Đảm bảo trên di động (375px) mỗi bảng hiển thị tối đa 4 cột.
