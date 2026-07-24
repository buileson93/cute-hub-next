-- Task 3: enforce trạng thái ⇔ mốc thời gian cho su_co
-- (a) Backfill: điền thoi_diem_khac_phuc cho các bản ghi đang "Đã khắc phục" mà thiếu mốc.
UPDATE public.su_co
SET thoi_diem_khac_phuc = COALESCE(
  updated_at,
  (ngay_phat_hien)::timestamptz,
  now()
)
WHERE trang_thai = 'Đã khắc phục'
  AND thoi_diem_khac_phuc IS NULL;

-- (b) CHECK constraint: trạng thái='Đã khắc phục' ⇒ thoi_diem_khac_phuc IS NOT NULL
ALTER TABLE public.su_co
  DROP CONSTRAINT IF EXISTS su_co_khac_phuc_yeu_cau_moc;

ALTER TABLE public.su_co
  ADD CONSTRAINT su_co_khac_phuc_yeu_cau_moc
  CHECK (trang_thai <> 'Đã khắc phục' OR thoi_diem_khac_phuc IS NOT NULL);
