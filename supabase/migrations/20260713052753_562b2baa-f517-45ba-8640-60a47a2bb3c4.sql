-- Seed idempotent 4 mẫu bảo dưỡng AWOS PLK (PL-KT-AWOS-01..04)
-- Thứ tự: version=draft -> include -> publish (do trigger chặn include khi parent published)

-- 1) Mẫu
INSERT INTO public.form_template (code, ten, mo_ta, thiet_bi_mode, active, version, require_signature, nhom)
VALUES
  ('PL-KT-AWOS-01', 'PL01 - Bảo dưỡng AWOS (Ngày/Tuần)', 'Kiểm tra ngoại quan, nguồn và cảm biến khí tượng hệ thống AWOS PLK.', 'none', true, 1, true, 'bao_duong'),
  ('PL-KT-AWOS-02', 'PL02 - Bảo dưỡng AWOS (Tháng)', 'Bảo dưỡng định kỳ tháng: đấu nối, nguồn, UPS, sao lưu cấu hình.', 'none', true, 1, true, 'bao_duong'),
  ('PL-KT-AWOS-03', 'PL03 - Bảo dưỡng AWOS (Quý)', 'Bao gồm PL01 và bổ sung vệ sinh môi trường, thiết bị ngoài trời.', 'none', true, 1, true, 'bao_duong'),
  ('PL-KT-AWOS-04', 'PL04 - Bảo dưỡng AWOS (Năm)', 'Bao gồm PL02 và PL03; bổ sung đo tiếp địa, hiệu chuẩn và đánh giá tổng hợp năm.', 'none', true, 1, true, 'bao_duong')
ON CONFLICT (code) DO UPDATE
  SET ten = EXCLUDED.ten, mo_ta = EXCLUDED.mo_ta, nhom = EXCLUDED.nhom,
      thiet_bi_mode = EXCLUDED.thiet_bi_mode, require_signature = EXCLUDED.require_signature, active = true;

-- 2) Section
INSERT INTO public.form_section (template_id, ma_section, ten, mo_ta, position)
SELECT t.id, v.ma_section, v.ten, v.mo_ta, v.position
FROM (VALUES
  ('PL-KT-AWOS-01', 'S01', 'Kiểm tra ngoại quan & nguồn', NULL::text, 0),
  ('PL-KT-AWOS-01', 'S02', 'Kiểm tra cảm biến khí tượng', NULL::text, 1),
  ('PL-KT-AWOS-02', 'S01', 'Bảo dưỡng định kỳ tháng', NULL::text, 0),
  ('PL-KT-AWOS-03', 'S01', 'Vệ sinh môi trường & thiết bị ngoài trời', NULL::text, 0),
  ('PL-KT-AWOS-04', 'S01', 'Đo kiểm tiếp địa & hiệu chuẩn', NULL::text, 0),
  ('PL-KT-AWOS-04', 'S02', 'Đánh giá tổng hợp năm', NULL::text, 1)
) AS v(code, ma_section, ten, mo_ta, position)
JOIN public.form_template t ON t.code = v.code
ON CONFLICT (template_id, ma_section) DO UPDATE
  SET ten = EXCLUDED.ten, mo_ta = EXCLUDED.mo_ta, position = EXCLUDED.position;

-- 3) Hạng mục
INSERT INTO public.form_check_item
  (template_id, section_id, item_code, ten, huong_dan, result_kind, don_vi, tieu_chuan, tuy_chon, bat_buoc, position)
SELECT t.id, s.id, v.item_code, v.ten, v.huong_dan,
       v.result_kind::public.form_result_kind, v.don_vi, v.tieu_chuan, NULL::jsonb, v.bat_buoc, v.position
FROM (VALUES
  ('PL-KT-AWOS-01','S01','AWOS01-S01-01','Kiểm tra nguồn cấp AC/UPS','Quan sát đèn báo, đo áp nếu cần','dat_khong_dat',NULL::text,'Có điện, không cảnh báo',true,0),
  ('PL-KT-AWOS-01','S01','AWOS01-S01-02','Kiểm tra đèn báo trạng thái tủ điều khiển','Đối chiếu bảng trạng thái','dat_khong_dat',NULL,'Không đèn lỗi',true,1),
  ('PL-KT-AWOS-01','S01','AWOS01-S01-03','Kiểm tra kết nối cáp tín hiệu','Kiểm tra chắc chắn, không lỏng','dat_khong_dat',NULL,'Kết nối chắc chắn',true,2),
  ('PL-KT-AWOS-01','S01','AWOS01-S01-04','Vệ sinh bên ngoài tủ thiết bị','Lau sạch bụi bẩn','dat_khong_dat',NULL,'Sạch sẽ',false,3),
  ('PL-KT-AWOS-01','S01','AWOS01-S01-05','Kiểm tra tiếp địa vỏ tủ (quan sát)','Quan sát dây tiếp địa','dat_khong_dat',NULL,'Còn nguyên vẹn',true,4),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-01','Cảm biến gió (hướng/tốc độ)','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',true,0),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-02','Cảm biến nhiệt độ/độ ẩm','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',true,1),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-03','Cảm biến áp suất khí quyển','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',true,2),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-04','Cảm biến tầm nhìn (visibility)','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',true,3),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-05','Cảm biến trần mây (ceilometer)','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',true,4),
  ('PL-KT-AWOS-01','S02','AWOS01-S02-06','Cảm biến lượng mưa','So sánh giá trị hiển thị','dat_khong_dat',NULL,'Số liệu hợp lý',false,5),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-01','Kiểm tra & siết lại đầu nối cáp','Siết chặt các đầu nối','dat_khong_dat',NULL,'Chắc chắn',true,0),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-02','Đo điện áp nguồn AC','Dùng đồng hồ đo','so','V','220 ± 22 V',true,1),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-03','Kiểm tra dung lượng ắc quy UPS','Đọc thông số UPS','so','%','>= 80%',true,2),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-04','Vệ sinh bộ lọc quạt tản nhiệt','Tháo và vệ sinh','dat_khong_dat',NULL,'Sạch, thông thoáng',false,3),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-05','Kiểm tra đồng bộ thời gian hệ thống','Đối chiếu nguồn thời gian chuẩn','dat_khong_dat',NULL,'Đồng bộ',true,4),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-06','Sao lưu dữ liệu cấu hình','Lưu ra thiết bị an toàn','dat_khong_dat',NULL,'Đã sao lưu',true,5),
  ('PL-KT-AWOS-02','S01','AWOS02-S01-07','Kiểm tra hiển thị số liệu màn hình khai thác','Quan sát màn hình','dat_khong_dat',NULL,'Hiển thị đầy đủ',true,6),
  ('PL-KT-AWOS-03','S01','AWOS03-S01-01','Vệ sinh đầu cảm biến tầm nhìn/trần mây','Lau kính quang học','dat_khong_dat',NULL,'Sạch, không bám bẩn',true,0),
  ('PL-KT-AWOS-03','S01','AWOS03-S01-02','Vệ sinh cánh/trục cảm biến gió','Kiểm tra xoay trơn','dat_khong_dat',NULL,'Quay trơn, sạch',true,1),
  ('PL-KT-AWOS-03','S01','AWOS03-S01-03','Phát quang cỏ cây quanh khu vực trạm','Đảm bảo thông thoáng','dat_khong_dat',NULL,'Quang đãng',false,2),
  ('PL-KT-AWOS-03','S01','AWOS03-S01-04','Kiểm tra thoát nước, chống ngập chân trạm','Kiểm tra rãnh thoát','dat_khong_dat',NULL,'Thoát nước tốt',false,3),
  ('PL-KT-AWOS-04','S01','AWOS04-S01-01','Đo điện trở tiếp địa trong nhà','Dùng máy đo tiếp địa','so','Ω','< 4 Ω',true,0),
  ('PL-KT-AWOS-04','S01','AWOS04-S01-02','Đo điện trở tiếp địa tại trạm ngoài trời','Dùng máy đo tiếp địa','so','Ω','< 10 Ω',true,1),
  ('PL-KT-AWOS-04','S01','AWOS04-S01-03','Hiệu chuẩn cảm biến áp suất','Theo quy trình calibration','dat_khong_dat',NULL,'Đạt chuẩn hiệu chuẩn',true,2),
  ('PL-KT-AWOS-04','S01','AWOS04-S01-04','Hiệu chuẩn cảm biến nhiệt độ/độ ẩm','Theo quy trình calibration','dat_khong_dat',NULL,'Đạt chuẩn hiệu chuẩn',true,3),
  ('PL-KT-AWOS-04','S01','AWOS04-S01-05','Hiệu chuẩn cảm biến gió','Theo quy trình calibration','dat_khong_dat',NULL,'Đạt chuẩn hiệu chuẩn',true,4),
  ('PL-KT-AWOS-04','S02','AWOS04-S02-01','Đánh giá tình trạng hoạt động tổng thể','Ghi nhận đánh giá năm','text',NULL,NULL,true,0),
  ('PL-KT-AWOS-04','S02','AWOS04-S02-02','Kiến nghị / kế hoạch thay thế','Ghi kiến nghị nếu có','text',NULL,NULL,false,1)
) AS v(code, ma_section, item_code, ten, huong_dan, result_kind, don_vi, tieu_chuan, bat_buoc, position)
JOIN public.form_template t ON t.code = v.code
JOIN public.form_section s ON s.template_id = t.id AND s.ma_section = v.ma_section
ON CONFLICT (template_id, item_code) DO UPDATE
  SET section_id = EXCLUDED.section_id, ten = EXCLUDED.ten, huong_dan = EXCLUDED.huong_dan,
      result_kind = EXCLUDED.result_kind, don_vi = EXCLUDED.don_vi, tieu_chuan = EXCLUDED.tieu_chuan,
      tuy_chon = EXCLUDED.tuy_chon, bat_buoc = EXCLUDED.bat_buoc, position = EXCLUDED.position;

-- 4) Version: tạo/ép về draft (cho phép sửa include)
INSERT INTO public.form_template_version (template_id, version, status, compiled_schema)
SELECT t.id, 1, 'draft'::public.form_template_version_status, '{}'::jsonb
FROM public.form_template t
WHERE t.code IN ('PL-KT-AWOS-01','PL-KT-AWOS-02','PL-KT-AWOS-03','PL-KT-AWOS-04')
ON CONFLICT (template_id, version) DO UPDATE SET status = 'draft';

-- 5) Include (parent đang draft nên hợp lệ)
INSERT INTO public.form_template_include (parent_version_id, child_version_id, position, section_code)
SELECT p.id, c.id, x.pos, NULL
FROM (VALUES
  ('PL-KT-AWOS-03','PL-KT-AWOS-01',0),
  ('PL-KT-AWOS-04','PL-KT-AWOS-02',0),
  ('PL-KT-AWOS-04','PL-KT-AWOS-03',1)
) AS x(parent_code, child_code, pos)
JOIN public.form_template pt ON pt.code = x.parent_code
JOIN public.form_template_version p ON p.template_id = pt.id AND p.version = 1
JOIN public.form_template ct ON ct.code = x.child_code
JOIN public.form_template_version c ON c.template_id = ct.id AND c.version = 1
ON CONFLICT (parent_version_id, child_version_id) DO UPDATE SET position = EXCLUDED.position;

-- 6) Hàm tạm biên dịch section
CREATE OR REPLACE FUNCTION pg_temp.awos_own_sections(_code text)
RETURNS jsonb LANGUAGE sql STABLE AS $$
  SELECT COALESCE(jsonb_agg(sec ORDER BY sec_pos), '[]'::jsonb)
  FROM (
    SELECT s.position AS sec_pos,
      jsonb_build_object(
        'ma_section', s.ma_section, 'ten', s.ten, 'mo_ta', s.mo_ta, 'position', s.position,
        'items', (
          SELECT COALESCE(jsonb_agg(jsonb_build_object(
            'item_code', i.item_code, 'ten', i.ten, 'huong_dan', i.huong_dan,
            'result_kind', i.result_kind, 'don_vi', i.don_vi, 'tieu_chuan', i.tieu_chuan,
            'tuy_chon', i.tuy_chon, 'bat_buoc', i.bat_buoc, 'position', i.position
          ) ORDER BY i.position), '[]'::jsonb)
          FROM public.form_check_item i WHERE i.section_id = s.id
        )
      ) AS sec
    FROM public.form_section s
    JOIN public.form_template t ON t.id = s.template_id
    WHERE t.code = _code
  ) x;
$$;

CREATE OR REPLACE FUNCTION pg_temp.awos_reindex(_secs jsonb)
RETURNS jsonb LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(jsonb_agg(jsonb_set(elem, '{position}', to_jsonb(ord - 1)) ORDER BY ord), '[]'::jsonb)
  FROM jsonb_array_elements(_secs) WITH ORDINALITY AS t(elem, ord);
$$;

-- 7) Publish + gắn compiled_schema đã giải include
UPDATE public.form_template_version v SET status = 'published',
  compiled_schema = jsonb_build_object('sections', pg_temp.awos_reindex(pg_temp.awos_own_sections('PL-KT-AWOS-01')))
FROM public.form_template t WHERE t.id = v.template_id AND t.code = 'PL-KT-AWOS-01' AND v.version = 1;

UPDATE public.form_template_version v SET status = 'published',
  compiled_schema = jsonb_build_object('sections', pg_temp.awos_reindex(pg_temp.awos_own_sections('PL-KT-AWOS-02')))
FROM public.form_template t WHERE t.id = v.template_id AND t.code = 'PL-KT-AWOS-02' AND v.version = 1;

UPDATE public.form_template_version v SET status = 'published',
  compiled_schema = jsonb_build_object('sections', pg_temp.awos_reindex(
    pg_temp.awos_own_sections('PL-KT-AWOS-01') || pg_temp.awos_own_sections('PL-KT-AWOS-03')))
FROM public.form_template t WHERE t.id = v.template_id AND t.code = 'PL-KT-AWOS-03' AND v.version = 1;

UPDATE public.form_template_version v SET status = 'published',
  compiled_schema = jsonb_build_object('sections', pg_temp.awos_reindex(
    pg_temp.awos_own_sections('PL-KT-AWOS-02') || pg_temp.awos_own_sections('PL-KT-AWOS-01')
    || pg_temp.awos_own_sections('PL-KT-AWOS-03') || pg_temp.awos_own_sections('PL-KT-AWOS-04')))
FROM public.form_template t WHERE t.id = v.template_id AND t.code = 'PL-KT-AWOS-04' AND v.version = 1;

-- 8) Gắn 4 mẫu vào hệ thống AWOS PLK
INSERT INTO public.form_template_he_thong (template_id, he_thong_id)
SELECT t.id, h.id FROM public.form_template t
CROSS JOIN public.dm_he_thong h
WHERE t.code IN ('PL-KT-AWOS-01','PL-KT-AWOS-02','PL-KT-AWOS-03','PL-KT-AWOS-04') AND h.ma = 'HT_PLK_AWOS'
ON CONFLICT (template_id, he_thong_id) DO NOTHING;

DROP FUNCTION IF EXISTS pg_temp.awos_own_sections(text);
DROP FUNCTION IF EXISTS pg_temp.awos_reindex(jsonb);