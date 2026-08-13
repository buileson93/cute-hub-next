# Compact Dashboard UI Spec (MIRATS 2.0)

## A. Đặc tả component KpiCard (Standardized)

Component `KpiCard` là đơn vị nguyên tử hiển thị chỉ số, tập trung vào con số và xu hướng, loại bỏ văn bản giải thích dài dòng.

### 1. Props Definition
```typescript
interface KpiCardProps {
  // Bắt buộc
  label: string;          // Nhãn ngắn, tối đa 3 từ (VD: "Sẵn sàng", "PM Đúng hạn")
  value: string | number; // Giá trị chính, hiển thị font-black, tabular-nums
  
  // Tuỳ chọn
  unit?: string;          // Đơn vị hoặc mẫu số (VD: "%", "/ 1120")
  icon?: string;          // Icon ngữ nghĩa từ registry
  status?: 'normal' | 'attention' | 'warning' | 'danger'; // Màu ngữ nghĩa
  
  trend?: {
    value: number;        // Con số phần trăm biến động
    isUp: boolean;       // Hướng mũi tên
  };
  
  sparklineData?: { value: number }[]; // Mảng dữ liệu cho sparkline (32px height)
  tooltip?: string;       // Văn bản giải thích, hiển thị qua icon (?) nhỏ
  isLoading?: boolean;    // Trạng thái skeleton
  onClick?: () => void;   // Hành động khi nhấn
}
```

### 2. Visual Hierarchy (Thứ tự hiển thị)
1. **Label**: 11px, font-bold, text-muted-foreground, uppercase.
2. **Value Area**: 
   - Value: 26px - 28px, font-black, tabular-nums.
   - Unit: 12px, font-bold, text-muted-foreground, ngay sau value.
3. **Trend**: 11px, font-bold, ngay dưới value.
4. **Sparkline**: Cố định 32px ở đáy card, không trục/lưới.

---

## B. Thang chữ Dashboard (4 bậc)

Tuyệt đối loại bỏ `text-[9px]` và `text-[10px]`.

| Bậc | Vai trò | Token Tailwind | Cỡ (px) | Thuộc tính |
|:---:|:---|:---|:---|:---|
| 1 | Chỉ số chính (Hero) | `text-2xl` đến `text-3xl` | 24 - 30px | `font-black`, `tabular-nums` |
| 2 | Tiêu đề thẻ (Section) | `text-sm` | 14px | `font-bold`, `uppercase`, `tracking-wide` |
| 3 | Nội dung (Body) | `text-xs` | 12px | `font-medium` |
| 4 | Nhãn/Chú thích (Label) | `text-[11px]` | 11px | `font-bold`, `uppercase`, `text-muted-foreground` |

---

## C. Bảng rà chữ và Tối ưu hóa nội dung

| Thẻ / Vị trí | Nội dung cũ | Số từ | Nội dung mới | Số từ | Thông tin bị rút giữ ở đâu |
|:---|:---|:---:|:---|:---:|:---|
| Page Header | Chào mừng bạn quay lại MIRATS... | 18 | (Bỏ) | 0 | (Không cần thiết) |
| KpiCard (Avail) | Tỉ lệ thời gian tài sản sẵn sàng... | 12 | (Bỏ description) | 0 | Tooltip trên nhãn |
| KpiCard (MTTR) | Thời gian trung bình để khắc phục... | 12 | (Bỏ description) | 0 | Tooltip trên nhãn |
| KpiCard (MTBF) | Khoảng cách trung bình giữa các lần... | 12 | (Bỏ description) | 0 | Tooltip trên nhãn |
| Health Card | Sức khoẻ A - Tốt (Vận hành ổn định) | 8 | A - TỐT | 2 | Tooltip / Trang chi tiết |
| Heartbeat Tooltip | Hoạt động ổn định | 3 | OK | 1 | (Nhãn trạng thái) |

---

## D. Sơ đồ phân cấp 3 tầng

| Tầng | Nội dung | Số thẻ trước | Số thẻ sau | Lý do điều chỉnh |
|:---|:---|:---:|:---:|:---|
| **Tầng 1** | Avail, MTTR, MTBF, PM Đúng hạn | 4 | 4 | Giữ nguyên 4 KPI trụ cột. |
| **Tầng 2** | Xu hướng sự cố, Phân bố sức khỏe, Live Heartbeat | 6 | 3 | Gộp các chart chi tiết vào tab hoặc lưới cô đọng. |
| **Tầng 3** | Nhật ký (Timeline), Chất lượng hồ sơ, Danh mục rủi ro | 24 | 4 | Chuyển danh sách dài vào vùng scroll hoặc xem thêm. |

---

## E. Danh sách Sparklines & Nguồn dữ liệu

| Chỉ số | Nguồn chuỗi thời gian | Thư viện |
|:---|:---|:---|
| Sẵn sàng (%) | `trendData` (từ `dashboard_su_co_by_month`) | Recharts (AreaChart) |
| MTTR | Chuỗi 12 tháng gần nhất từ `useUnifiedDashboardStats` | Recharts (AreaChart) |
| MTBF | Chuỗi 12 tháng gần nhất từ `useUnifiedDashboardStats` | Recharts (AreaChart) |
| PM Đúng hạn | Dữ liệu lịch sử 6 tháng từ `usePmOnTimeKpi` | Recharts (AreaChart) |

---

## F. Danh sách kiểm tra (Safety Checklist)

- [ ] Toàn bộ `description` trong các thẻ Card hiện tại đã được chuyển vào `AppTooltip`.
- [ ] Con số "Sự cố khẩn", "PM quá hạn" không bị xóa mà được trình bày lại trong KpiCard tầng 1 hoặc thẻ Tầng 2.
- [ ] Nút "Xuất PDF" và "Xuất báo cáo" vẫn giữ nguyên vị trí ở Header.
- [ ] Các link điều hướng (`to="/su-co"`, `to="/bao-tri"`) được tích hợp vào `onClick` hoặc Link nhỏ ở góc thẻ.
- [ ] Kiểm tra font-size bằng công cụ dev tool sau khi áp dụng, đảm bảo không còn node nào < 11px.
