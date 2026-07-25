
-- Tighten SELECT policies flagged by security scan

-- 1) bao_cao_annotation: restrict to equipment managers, creators, or users
--    with view rights on the linked he_thong (via any thiet_bi in that he_thong)
DROP POLICY IF EXISTS annotation_select_all_auth ON public.bao_cao_annotation;
CREATE POLICY annotation_select_scoped ON public.bao_cao_annotation
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid())
    AND (
      can_manage_equipment(current_uid())
      OR tao_boi = auth.uid()
      OR (
        he_thong_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM public.thiet_bi tb
          WHERE tb.he_thong_id = bao_cao_annotation.he_thong_id
            AND can_view_thiet_bi(tb.id, current_uid())
          LIMIT 1
        )
      )
    )
  );

-- 2) su_co_lich_su: mirror scoping of parent su_co / hong_hoc rows
DROP POLICY IF EXISTS su_co_lich_su_select ON public.su_co_lich_su;
CREATE POLICY su_co_lich_su_select ON public.su_co_lich_su
  FOR SELECT TO authenticated
  USING (
    is_active_user(current_uid())
    AND (
      can_manage_equipment(current_uid())
      OR (
        doi_tuong_bang = 'su_co'
        AND EXISTS (
          SELECT 1 FROM public.su_co s
          WHERE s.id = su_co_lich_su.doi_tuong_id
            AND s.thiet_bi_id IS NOT NULL
            AND can_view_thiet_bi(s.thiet_bi_id, current_uid())
        )
      )
      OR (
        doi_tuong_bang = 'hong_hoc'
        AND EXISTS (
          SELECT 1 FROM public.hong_hoc h
          WHERE h.id = su_co_lich_su.doi_tuong_id
            AND h.thiet_bi_hong_id IS NOT NULL
            AND can_view_thiet_bi(h.thiet_bi_hong_id, current_uid())
        )
      )
    )
  );
