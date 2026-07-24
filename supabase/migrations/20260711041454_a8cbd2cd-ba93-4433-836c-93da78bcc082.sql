-- 1) Bảng PHÂN LOẠI (Nhóm 1/2/3 ...) — tách ra từ dm_nhom_he_thong hiện tại.
CREATE TABLE public.dm_phan_loai (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ma text,
  ten text NOT NULL,
  mo_ta text,
  thu_tu integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dm_phan_loai TO authenticated;
GRANT ALL ON public.dm_phan_loai TO service_role;
ALTER TABLE public.dm_phan_loai ENABLE ROW LEVEL SECURITY;
CREATE POLICY lookup_read_active ON public.dm_phan_loai
  FOR SELECT TO authenticated USING (public.is_active_user(auth.uid()));
CREATE POLICY lookup_write_manager ON public.dm_phan_loai
  FOR ALL TO authenticated
  USING (public.can_manage_equipment(auth.uid()))
  WITH CHECK (public.can_manage_equipment(auth.uid()));
CREATE TRIGGER update_dm_phan_loai_updated_at
  BEFORE UPDATE ON public.dm_phan_loai
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.dm_phan_loai (id, ma, ten, mo_ta, thu_tu, active, created_at, updated_at)
SELECT id, ma, ten, mo_ta, thu_tu, active, created_at, updated_at FROM public.dm_nhom_he_thong;

-- 2) Cột phan_loai_id + field_set_id, backfill từ nhom_he_thong_id cũ (đang mang phân loại).
ALTER TABLE public.dm_he_thong ADD COLUMN phan_loai_id uuid
  REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;
ALTER TABLE public.thiet_bi ADD COLUMN phan_loai_id uuid
  REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;
ALTER TABLE public.thiet_bi ADD COLUMN field_set_id uuid
  REFERENCES public.field_set(id) ON DELETE SET NULL;

UPDATE public.dm_he_thong SET phan_loai_id = nhom_he_thong_id WHERE nhom_he_thong_id IS NOT NULL;
UPDATE public.thiet_bi SET phan_loai_id = nhom_he_thong_id WHERE nhom_he_thong_id IS NOT NULL;

-- 3) Repurpose dm_nhom_he_thong thành NHÓM HỆ THỐNG THẬT (giữ nguyên FK sẵn có).
UPDATE public.dm_he_thong SET nhom_he_thong_id = NULL;
UPDATE public.thiet_bi SET nhom_he_thong_id = NULL WHERE nhom_he_thong_id IS NOT NULL;
DELETE FROM public.dm_nhom_he_thong;
ALTER TABLE public.dm_nhom_he_thong ADD COLUMN phan_loai_id uuid
  REFERENCES public.dm_phan_loai(id) ON DELETE SET NULL;

INSERT INTO public.dm_nhom_he_thong (ma, ten, thu_tu, active) VALUES
 ('VCCS','VCCS — Chuyển mạch thoại',10,true),
 ('AMHS','AMHS — Xử lý điện văn',20,true),
 ('ATIS','ATIS / D-ATIS',30,true),
 ('VHF','VHF — Thu phát thoại',40,true),
 ('HF','HF — Sóng ngắn',50,true),
 ('ADSB','ADS-B',60,true),
 ('MLAT','MLAT / WAM',70,true),
 ('VOR','VOR',80,true),
 ('DME','DME',90,true),
 ('NDB','NDB',100,true),
 ('RADAR','Radar',110,true),
 ('AWOS','AWOS — Quan trắc thời tiết',120,true),
 ('LLWAS','LLWAS — Cảnh báo gió đứt',130,true),
 ('ATM','ATM / RDP',140,true),
 ('VSAT','VSAT',150,true),
 ('VIBA','VIBA',160,true),
 ('PBX','Tổng đài điện thoại',170,true),
 ('REC','Ghi âm / Ghi hình',180,true),
 ('CAM','Camera giám sát',190,true),
 ('AC','Điều hòa',200,true),
 ('PWR','Nguồn điện / UPS',210,true),
 ('PCCC','PCCC',220,true),
 ('SET','Chống sét',230,true),
 ('CLK','Đồng hồ chuẩn',240,true),
 ('SIM','Giả định huấn luyện',250,true),
 ('NET','Mạng / Chuyển mạch',260,true),
 ('DO','Thiết bị đo lường',270,true),
 ('KHAC','Nhóm khác',999,true);

-- 4) Backfill nhom_he_thong_id của hệ thống bằng suy luận từ khoá (một lần).
UPDATE public.dm_he_thong h
SET nhom_he_thong_id = g.id
FROM public.dm_nhom_he_thong g
WHERE g.ma = (
  SELECT CASE
    WHEN u ~ '\yVCCS\y' OR u ~ 'CHUYEN MACH THOAI' THEN 'VCCS'
    WHEN u ~ '\yAMHS\y' OR u ~ 'DIEN VAN' THEN 'AMHS'
    WHEN u ~ 'D-?ATIS' OR u ~ '\yATIS\y' THEN 'ATIS'
    WHEN u ~ '\yVHF\y' THEN 'VHF'
    WHEN u ~ '\yHF\y' THEN 'HF'
    WHEN u ~ 'ADS-?B' THEN 'ADSB'
    WHEN u ~ '\yMLAT\y' OR u ~ '\yWAM\y' THEN 'MLAT'
    WHEN u ~ '\yVOR\y' THEN 'VOR'
    WHEN u ~ '\yDME\y' THEN 'DME'
    WHEN u ~ '\yNDB\y' THEN 'NDB'
    WHEN u ~ 'RADAR|RA ?DA|DOPPLER' THEN 'RADAR'
    WHEN u ~ 'AWOS|QUAN TRAC (THOI TIET|KHI TUONG)|OPTIMET|AVIMET|\yIMS\y' THEN 'AWOS'
    WHEN u ~ 'LLWAS|GIO DUT' THEN 'LLWAS'
    WHEN u ~ '\yRDP\y|\yFDP\y|\yATCC\y|QUAN LY KHONG LUU|\yATM\y' THEN 'ATM'
    WHEN u ~ 'VSAT' THEN 'VSAT'
    WHEN u ~ 'VIBA' THEN 'VIBA'
    WHEN u ~ 'TONG DAI|\yPBX\y|UNIFY' THEN 'PBX'
    WHEN u ~ 'GHI AM|RECORD' THEN 'REC'
    WHEN u ~ 'CAMERA|\yCAM\y|\yCCTV\y' THEN 'CAM'
    WHEN u ~ 'DIEU HOA|\yAC\y|CHILLER' THEN 'AC'
    WHEN u ~ '\yUPS\y|AC-?DC|MAY PHAT|ACQUY|AC QUY|NGUON DIEN|DIEN NGUON' THEN 'PWR'
    WHEN u ~ 'PCCC|CHUA CHAY|BAO CHAY' THEN 'PCCC'
    WHEN u ~ 'CHONG SET|CAT LOC SET' THEN 'SET'
    WHEN u ~ 'DONG HO|CLOCK|NTP' THEN 'CLK'
    WHEN u ~ 'SIMULATOR|GIA DINH|HUAN LUYEN' THEN 'SIM'
    WHEN u ~ '\ySW\y|SWITCH|CONVETER|CONVERTER|ROUTER|MANG|NETWORK' THEN 'NET'
    WHEN u ~ 'DO |DONG HO DO|MEGAOHM|WATMET|EARTH GROUND|DIEN TRO' THEN 'DO'
    ELSE 'KHAC'
  END
  FROM (SELECT upper(public.f_unaccent(h.ten)) AS u) s
);

-- 5) Đồng bộ xuống thiết bị: nhom_he_thong_id + phan_loai_id lấy từ hệ thống cha.
UPDATE public.thiet_bi t
SET nhom_he_thong_id = h.nhom_he_thong_id,
    phan_loai_id = COALESCE(t.phan_loai_id, h.phan_loai_id)
FROM public.dm_he_thong h
WHERE t.he_thong_id = h.id;

-- 6) Kế thừa tự động từ Mẫu thiết bị (model) -> thiết bị.
CREATE OR REPLACE FUNCTION public.thiet_bi_inherit_model()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE m public.dm_model;
BEGIN
  IF NEW.model_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR NEW.model_id IS DISTINCT FROM OLD.model_id) THEN
    SELECT * INTO m FROM public.dm_model WHERE id = NEW.model_id;
    IF FOUND THEN
      IF m.loai_thiet_bi_id IS NOT NULL THEN NEW.loai_thiet_bi_id := m.loai_thiet_bi_id; END IF;
      IF m.nha_san_xuat_id IS NOT NULL THEN NEW.nha_san_xuat_id := m.nha_san_xuat_id; END IF;
      IF m.field_set_id IS NOT NULL THEN NEW.field_set_id := m.field_set_id; END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_thiet_bi_inherit_model
  BEFORE INSERT OR UPDATE OF model_id ON public.thiet_bi
  FOR EACH ROW EXECUTE FUNCTION public.thiet_bi_inherit_model();

UPDATE public.thiet_bi t
SET loai_thiet_bi_id = COALESCE(m.loai_thiet_bi_id, t.loai_thiet_bi_id),
    nha_san_xuat_id = COALESCE(m.nha_san_xuat_id, t.nha_san_xuat_id),
    field_set_id = COALESCE(m.field_set_id, t.field_set_id)
FROM public.dm_model m
WHERE t.model_id = m.id;

-- 7) Chỉ mục hỗ trợ truy vấn cây.
CREATE INDEX IF NOT EXISTS idx_dm_he_thong_phan_loai ON public.dm_he_thong(phan_loai_id);
CREATE INDEX IF NOT EXISTS idx_dm_he_thong_nhom ON public.dm_he_thong(nhom_he_thong_id);
CREATE INDEX IF NOT EXISTS idx_dm_nhom_he_thong_phan_loai ON public.dm_nhom_he_thong(phan_loai_id);
CREATE INDEX IF NOT EXISTS idx_thiet_bi_phan_loai ON public.thiet_bi(phan_loai_id);