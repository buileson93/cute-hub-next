DO $seed$
DECLARE
  v_tpl_id uuid;
  v_ver_id uuid;
  v_sec_a uuid;
  v_sec_b uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM public.form_template WHERE code = 'PL-KTAWOS-01') THEN
    RAISE NOTICE 'Template PL-KTAWOS-01 already exists, skip.';
    RETURN;
  END IF;

  INSERT INTO public.form_template(code, ten, mo_ta, thiet_bi_mode, active, version, require_signature, nhom)
  VALUES ('PL-KTAWOS-01',
          'Phiếu kiểm tra hệ thống AWOS 900 tại trạm (hàng tuần)',
          'Bảng kiểm tra định kỳ hàng tuần các cảm biến và tủ thiết bị AWOS 900 tại trạm.',
          'single', true, 1, true, 'AWOS')
  RETURNING id INTO v_tpl_id;

  INSERT INTO public.form_template_version(template_id, version, status, compiled_schema)
  VALUES (v_tpl_id, 1, 'published', '{}'::jsonb)
  RETURNING id INTO v_ver_id;

  INSERT INTO public.form_section(template_id, ma_section, ten, mo_ta, position, col_layout, repeatable)
  VALUES (v_tpl_id, 'AWOS01', 'Nội dung kiểm tra', NULL, 1, 1, false)
  RETURNING id INTO v_sec_a;

  -- Nhóm A + B đưa vào cùng 1 section, phân biệt bằng options.nhom_lon.
  INSERT INTO public.form_check_item(section_id, template_id, item_code, ten, huong_dan, result_kind, don_vi, tieu_chuan, tuy_chon, bat_buoc, position)
  VALUES
  (v_sec_a, v_tpl_id, 'A1', 'Đo trần mây (Ceilometer)', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo trần mây (Ceilometer)','noi_dung_chi_tiet','- Kiểm tra vật lý bên ngoài (vỏ, giá đỡ).'||E'\n'||'- Lau sạch bụi bẩn trên ống kính phát/thu bằng vải mềm và dung dịch chuyên dụng.'), true, 1),
  (v_sec_a, v_tpl_id, 'A2', 'Đo gió (Wind Sensor)', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo gió (Wind Sensor)','noi_dung_chi_tiet','- Kiểm tra đầu dò của cảm biến siêu âm có bị kẹt, nứt vỡ, có vật lạ không.'||E'\n'||'- Kiểm tra hướng lắp đặt có bị lệch không.'), true, 2),
  (v_sec_a, v_tpl_id, 'A3', 'Đo tầm nhìn (Visibility)', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo tầm nhìn (Visibility)','noi_dung_chi_tiet','- Kiểm tra vật lý bên ngoài.'||E'\n'||'- Lau sạch bụi bẩn trên ống kính phát/thu.'), true, 3),
  (v_sec_a, v_tpl_id, 'A4', 'Đo thời tiết hiện tại', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo thời tiết hiện tại','noi_dung_chi_tiet','- Kiểm tra vật lý bên ngoài.'||E'\n'||'- Lau sạch bụi bẩn trên ống kính cảm biến.'), true, 4),
  (v_sec_a, v_tpl_id, 'A5', 'Đo nhiệt độ, độ ẩm', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo nhiệt độ, độ ẩm','noi_dung_chi_tiet','- Kiểm tra, vệ sinh tấm chắn bức xạ, đảm bảo thông thoáng.'), true, 5),
  (v_sec_a, v_tpl_id, 'A6', 'Đo lượng mưa', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo lượng mưa','noi_dung_chi_tiet','- Kiểm tra, làm sạch phễu đo mưa, loại bỏ rác, lá cây.'), true, 6),
  (v_sec_a, v_tpl_id, 'A7', 'Đo khí áp, giông sét (nếu có)', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','A. CẢM BIẾN','hang_muc','Đo khí áp, giông sét (nếu có)','noi_dung_chi_tiet','- Kiểm tra vật lý bên ngoài, tình trạng cáp nối.'), false, 7),
  (v_sec_a, v_tpl_id, 'B1', 'Tủ DCP, Tủ nguồn', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','B. TỦ THIẾT BỊ VÀ PHỤ TRỢ','hang_muc','Tủ DCP, Tủ nguồn','noi_dung_chi_tiet','- Kiểm tra bên ngoài tủ (khóa, bản lề).'||E'\n'||'- Kiểm tra gioăng cửa tủ có kín không, có dấu hiệu côn trùng/nước xâm nhập không.'), true, 8),
  (v_sec_a, v_tpl_id, 'B2', 'Ắc quy, Bộ sạc', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','B. TỦ THIẾT BỊ VÀ PHỤ TRỢ','hang_muc','Ắc quy, Bộ sạc','noi_dung_chi_tiet','- Kiểm tra trực quan ắc quy (có bị phồng, rò rỉ dung dịch không).'||E'\n'||'- Kiểm tra đèn trạng thái trên bộ sạc.'), true, 9),
  (v_sec_a, v_tpl_id, 'B3', 'Chống sét, Tiếp địa', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','B. TỦ THIẾT BỊ VÀ PHỤ TRỢ','hang_muc','Chống sét, Tiếp địa','noi_dung_chi_tiet','- Kiểm tra các đầu nối của cáp tiếp địa, dây chống sét lan truyền.'), true, 10),
  (v_sec_a, v_tpl_id, 'B4', 'Thiết bị truyền dẫn', NULL, 'dat_khong_dat', NULL, NULL,
   jsonb_build_object('nhom_lon','B. TỦ THIẾT BỊ VÀ PHỤ TRỢ','hang_muc','Thiết bị truyền dẫn','noi_dung_chi_tiet','- Kiểm tra đèn trạng thái của Switch, Converter quang.'), true, 11);

  RAISE NOTICE 'Seeded PL-KTAWOS-01 with 11 items.';
END $seed$;