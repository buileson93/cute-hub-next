CREATE OR REPLACE FUNCTION public.fn_sync_du_an_tien_do()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_du_an uuid;
  v_moc uuid;
BEGIN
  v_du_an := COALESCE(NEW.du_an_id, OLD.du_an_id);
  v_moc := COALESCE(NEW.moc_id, OLD.moc_id);

  IF v_moc IS NOT NULL THEN
    UPDATE public.du_an_moc m
       SET tien_do = COALESCE((
             SELECT ROUND(AVG(GREATEST(0, LEAST(100, cv.tien_do))))::int
             FROM public.du_an_cong_viec cv
             WHERE cv.moc_id = m.id
           ), 0),
           updated_at = now()
     WHERE m.id = v_moc;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.moc_id IS DISTINCT FROM NEW.moc_id AND OLD.moc_id IS NOT NULL THEN
    UPDATE public.du_an_moc m
       SET tien_do = COALESCE((
             SELECT ROUND(AVG(GREATEST(0, LEAST(100, cv.tien_do))))::int
             FROM public.du_an_cong_viec cv
             WHERE cv.moc_id = m.id
           ), 0),
           updated_at = now()
     WHERE m.id = OLD.moc_id;
  END IF;

  IF v_du_an IS NOT NULL THEN
    UPDATE public.du_an d
       SET tien_do = COALESCE((
             SELECT ROUND(AVG(GREATEST(0, LEAST(100, cv.tien_do))))::int
             FROM public.du_an_cong_viec cv
             WHERE cv.du_an_id = d.id
           ), 0),
           updated_at = now()
     WHERE d.id = v_du_an;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_du_an_tien_do ON public.du_an_cong_viec;
CREATE TRIGGER trg_sync_du_an_tien_do
AFTER INSERT OR UPDATE OF tien_do, moc_id, du_an_id OR DELETE
ON public.du_an_cong_viec
FOR EACH ROW EXECUTE FUNCTION public.fn_sync_du_an_tien_do();