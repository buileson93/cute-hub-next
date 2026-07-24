COMMENT ON TABLE public.thiet_bi IS
  'Tài sản (Asset) — thiết bị vật lý. UI hiển thị là "Tài sản". Tên bảng giữ nguyên vì lý do lịch sử.';

COMMENT ON TABLE public.dm_model IS
  'Model — danh mục kiểu/mẫu thiết bị của nhà sản xuất. UI trước đây gọi là "Mẫu thiết bị".';

COMMENT ON TABLE public.dm_loai_thiet_bi IS
  'Chủng loại (Category) — phân loại tài sản. UI trước đây gọi là "Loại thiết bị".';

COMMENT ON TABLE public.dm_dac_tinh IS
  'Nhãn thiết bị (Tag) — nhãn đa trị M:N gán cho Model. UI trước đây gọi là "Đặc tính".';

COMMENT ON TABLE public.dm_model_dac_tinh IS
  'Bảng nối M:N giữa Model và Nhãn thiết bị.';

COMMENT ON TABLE public.dm_trang_thai_thiet_bi IS
  'Danh mục Trạng thái Tài sản.';

COMMENT ON COLUMN public.thiet_bi.loai_thiet_bi_id IS
  'FK -> dm_loai_thiet_bi (Chủng loại).';

COMMENT ON COLUMN public.thiet_bi.model_id IS
  'FK -> dm_model (Model). Quyết định loai_thiet_bi_id qua trigger đồng bộ.';

COMMENT ON COLUMN public.thiet_bi.ma_thiet_bi IS
  'Mã Tài sản dạng TB_XXXXXXXX — bất biến, không mã hoá đơn vị/vị trí.';